import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from 'discord.js';
import CryptoJS from 'crypto-js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

// API Rate limit configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, 
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply the rate limiter specifically to all API routes
app.use('/api', apiLimiter);

const PORT = 3000;

// Initialize Google GenAI on the server with user agent tracking
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Reusable robust helper to handle transient 503, 429 errors with fallback models
async function generateContentWithRetry(params: any, retries = 2): Promise<any> {
  const modelsToTry = [
    params.model || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  // De-duplicate styles
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        console.log(`[Gemini API] Attempting generateContent with model: ${model} (attempt ${attempt + 1})`);
        const response = await ai.models.generateContent({
          ...params,
          model
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorMessage = String(err?.message || '').toLowerCase();
        const errStatus = String(err?.status || '').toUpperCase();
        console.warn(`[Gemini API] Notice: ${model} (attempt ${attempt + 1}) encountered transient/quota response code: ${err?.code || 'N/A'}, status: ${err?.status || 'N/A'}, message: ${err?.message || err}`);
        
        const isQuotaExhausted = errorMessage.includes('429') || 
                                 errorMessage.includes('quota') || 
                                 errorMessage.includes('exhausted') || 
                                 errorMessage.includes('limit') ||
                                 errStatus.includes('RESOURCE_EXHAUSTED') ||
                                 err?.code === 429;
        
        if (isQuotaExhausted) {
          console.warn(`[Gemini API] Quota/Rate Limit Exhausted for model ${model}. Transitioning immediately to next fallback model...`);
          break; // Exit inner loop and try the next fallback model immediately without retrying the exhausted model
        }

        const isTransient = errorMessage.includes('503') || 
                            errorMessage.includes('temporary') || 
                            errorMessage.includes('busy') || 
                            errorMessage.includes('demand') || 
                            errorMessage.includes('unavailable') ||
                            errStatus.includes('UNAVAILABLE') ||
                            err?.code === 503;
        
        if (isTransient) {
          attempt++;
          if (attempt <= retries) {
            const delay = Math.pow(2, attempt) * 500;
            console.log(`[Gemini API] Transient issue detected. Backing off for ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        break; // Go to fallback model
      }
    }
  }

  console.error('[Gemini API] CRITICAL: All fallback models and retry attempts have failed.', lastError);
  throw lastError || new Error('All model attempts failed');
}

// A pool of active Discord clients, indexed by Firebase userId
const clientPool = new Map<string, Client>();

// A cache of bot logs for active sessions
interface DiscordLogs {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}
const botLogs = new Map<string, DiscordLogs[]>();
const automodRulesCache = new Map<string, Array<{id: string, keyword: string, action: string, timeoutDurationMinutes?: number}>>();

function logForBot(userId: string, level: 'info' | 'warn' | 'error', message: string) {
  if (!botLogs.has(userId)) {
    botLogs.set(userId, []);
  }
  const logs = botLogs.get(userId)!;
  logs.push({
    timestamp: new Date().toISOString(),
    level,
    message
  });
  // Limit to last 100 entries
  if (logs.length > 100) {
    logs.shift();
  }
}

// REST route to verify a bot token and fetch bot metadata + eligible servers
app.post('/api/bot/verify', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  if (!token) {
    return res.status(400).json({ error: 'X-Discord-Token header is required' });
  }

  const testClient = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  try {
    await testClient.login(token);
    
    const botUser = testClient.user;
    if (!botUser) {
      testClient.destroy();
      return res.status(500).json({ error: 'Logged in but could not retrieve bot user info' });
    }

    // Fetch guilds where the bot is joined
    const rawGuilds = await testClient.guilds.fetch();
    const guildsList = rawGuilds.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL()
    }));

    testClient.destroy();

    return res.json({
      id: botUser.id,
      username: botUser.username,
      discriminator: botUser.discriminator,
      avatar: botUser.displayAvatarURL(),
      guilds: guildsList
    });
  } catch (err: any) {
    testClient.destroy();
    console.error('Error verifying Discord Token:', err);
    return res.status(401).json({ error: err.message || 'Verification of Discord token failed' });
  }
});

// Retrieve guild details (channels, roles)
app.post('/api/bot/guild-details', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  const { guildId } = req.body;

  if (!token || !guildId) {
    return res.status(400).json({ error: 'X-Discord-Token header and guildId are required' });
  }

  const tempClient = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  try {
    await tempClient.login(token);
    const guild = await tempClient.guilds.fetch(guildId);
    if (!guild) {
      tempClient.destroy();
      return res.status(404).json({ error: 'Discord Guild not found' });
    }

    const channelsRaw = await guild.channels.fetch();
    const channels = channelsRaw.map(c => ({
      id: c?.id,
      name: c?.name,
      type: c?.type,
      position: c?.position,
      parentId: c?.parentId
    }));

    const rolesRaw = await guild.roles.fetch();
    const roles = rolesRaw.map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      position: r.position,
      permissions: r.permissions.toString()
    }));

    const membersCount = guild.memberCount;

    tempClient.destroy();

    return res.json({
      guildName: guild.name,
      guildIcon: guild.iconURL(),
      memberCount: membersCount,
      channels,
      roles
    });
  } catch (err: any) {
    tempClient.destroy();
    console.error('Error fetching guild details:', err);
    return res.status(500).json({ error: err.message || 'Error occurred retrieving Discord Server details' });
  }
});

// Check if a specific target bot / user member is already joined in the Guild
app.post('/api/bot/check-member', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  const { guildId, memberId } = req.body;

  if (!token || !guildId || !memberId) {
    return res.status(400).json({ error: 'X-Discord-Token header, guildId, and memberId are required' });
  }

  const tempClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  try {
    await tempClient.login(token);
    const guild = await tempClient.guilds.fetch(guildId);
    if (!guild) {
      tempClient.destroy();
      return res.status(404).json({ error: 'Discord Guild not found' });
    }

    try {
      const member = await guild.members.fetch(memberId);
      tempClient.destroy();
      return res.json({ joined: !!member, username: member?.user?.username || '' });
    } catch {
      tempClient.destroy();
      return res.json({ joined: false });
    }
  } catch (err: any) {
    tempClient.destroy();
    return res.status(500).json({ error: err.message || 'Error occurred checking Discord Guild member' });
  }
});

// Auto-Moderation Rules Endpoint
app.post('/api/bot/automod/rules', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  const { userId, rules } = req.body;

  if (!token || !userId || !rules) {
    return res.status(400).json({ error: 'Token, userId, and rules are required' });
  }

  try {
    automodRulesCache.set(userId, rules);
    return res.json({ success: true, count: rules.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// AI Server Architect: Receives natural language prompt, generates structured actions using Gemini 3.5 Flash, and returns it.
app.post('/api/bot/architect/plan', async (req, res) => {
  const { instruction, guildDetails, useLite } = req.body;

  if (!instruction || !guildDetails) {
    return res.status(400).json({ error: 'Instruction and guildDetails are required' });
  }

  try {
    const prompt = `You are a HIGHLY INTELLIGENT, EXPERT Discord Guild Architect and veteran Server Master. You possess absolute knowledge of the Discord API, community server paradigms, channel categorization, permission hierarchies, and engagement-driven layouts.

CRITICAL DIRECTIVES & DISCORD KNOWLEDGE BASE:

1. ABSOLUTE DEDUPLICATION: You must meticulously analyze the provided JSON of current channels and roles. Look for ANY overlaps (e.g., "general", "general-chat", "welcome", "welcome-1", multiple "Admin" roles). Your TOP PRIORITY is to output \`DELETE_CHANNEL\` or \`DELETE_ROLE\` to completely wipe out redundant, unused, or messy duplicates before making new ones. Start with a clean slate by nuking bad structures.

2. AESTHETICS & NAMING CONVENTIONS:
   - Use standard modern Discord formatting (e.g., lowercase with hyphens for text channels: \`general-chat\`, \`announcements\`, \`rules\`, \`bot-commands\`).
   - Use emojis tastefully but consistently if the vibe calls for it (e.g., \`📣-announcements\`, \`💬-general\`).
   - Categories should be ALL CAPS with generous spacing or emojis (e.g., \`━ INFORMATION ━\`, \`💬 COMMUNITY\`, \`🔊 VOICE CHANNELS\`).

3. ROLE HIERARCHY & PERMISSIONS STRUCTURE:
   - Servers need a hierarchy: Admin/Owner, Mod/Staff, VIP/Booster, Regulars, and Bots.
   - Use contrasting, vibrant hex colors for roles (e.g., #FF4646 for Admins, #4690FF for Mods, #32CD32 for Members).
   - If asked to create roles, give them distinct names and logical visual colors. Delete duplicated existing roles in the JSON.

4. PROPER CATEGORIZATION (THE "BONE STRUCTURE"):
   - Channels should never be left floating without a Category (parentId).
   - Standard healthy skeleton: 
     - [Category] 📌 INFO (Rules, Announcements, Welcome)
     - [Category] 💬 MAIN (General, Media/Memes, Bot-Spam)
     - [Category] 🎮 HOBBIES (Specific topics)
     - [Category] 🔊 VOICE (Lobby, Gaming 1, Gaming 2, AFK)

5. ACTION CONTEXT AWARENESS & CAPABILITIES:
   - When modifying an existing channel (\`MODIFY_CHANNEL\`) or role (\`MODIFY_ROLE\`), YOU MUST USE ITS REAL \`id\` FROM THE PROVIDED JSON in the \`channelId\` or \`roleId\` field.
   - When creating channels inside a category you just created in the same plan, use the pseudo-reference format for \`parentId\`: \`category:Category Name\` (e.g., \`category:💬 COMMUNITY\`).
   - You can send rich text, lore, or welcome guides into channels using \`SEND_MESSAGE\` to make them feel alive!
   - DO NOT constantly rename the server using \`MODIFY_SERVER_NAME\`. Only rename the server if explicitly requested by the user, or if doing a complete conceptual reboot. Otherwise, leave the server name alone.

Guild current structural details:
Channels: ${JSON.stringify(guildDetails.channels)}
Roles: ${JSON.stringify(guildDetails.roles)}

User Request: "${instruction}"

Analyze the request and the existing structure. Formulate a brilliant architectural plan. Do NOT be shy about deleting garbage channels.

Output exactly one valid JSON object conforming to this schema:
{
  "explanation": "Brief human explanation of what operations you chose to do and why.",
  "actions": [
    {
      "type": "CREATE_CHANNEL", // Supported: CREATE_CHANNEL, CREATE_CATEGORY, DELETE_CHANNEL, MODIFY_CHANNEL, CREATE_ROLE, DELETE_ROLE, MODIFY_ROLE, MODIFY_SERVER_NAME, TIMEOUT_MEMBER, KICK_MEMBER, BAN_MEMBER, UNBAN_MEMBER, ASSIGN_ROLE, REMOVE_ROLE, SEND_MESSAGE, DELETE_MESSAGES, VOICE_MUTE_MEMBER, VOICE_DEAFEN_MEMBER, VOICE_DISCONNECT_MEMBER, ADD_BOT
      "params": {
        "name": "General Chat", // for channel name, role name, or bot name
        "channelType": "text", // "text" | "voice" | "category"
        "parentId": "optional_category_id_where_channel_lives_or_created_earlier_by_referring_to_its_name_placeholder_like_category:Gaming",
        "color": "#ff0000", // hex color for roles
        "roleId": "optional_target_id",
        "channelId": "optional_target_id_for_messages_or_modify",
        "topic": "optional channel topic string",
        "memberId": "optional_target_id_for_user_actions",
        "serverName": "optional_new_name_for_server",
        "reason": "optional_audit_reason",
        "durationMinutes": 60, // optional integer for TIMEOUT_MEMBER duration
        "messageContent": "Hello World", // text for SEND_MESSAGE
        "messageCount": 50 // amount for DELETE_MESSAGES
      }
    }
  ]
}

Ensure the output is compact, syntactically correct JSON. Avoid markdown tags like \`\`\`json outside the content, just output the pure JSON string. Make the actions logical.
If the user asks to add or invite a bot (e.g. "add Carl for moderation"), output "ADD_BOT" with params.name.
If the user asks to ban/kick/timeout someone, output "BAN_MEMBER", "KICK_MEMBER", "TIMEOUT_MEMBER" with memberId and reason.
If the user asks to rename the server, output "MODIFY_SERVER_NAME" with serverName.
If the user asks to assign a role to a member, output "ASSIGN_ROLE" with memberId and roleId.
If the user asks to send a message, output "SEND_MESSAGE" with channelId and messageContent.
If the user asks to clear or delete messages, output "DELETE_MESSAGES" with channelId and messageCount.
If you output MODIFY_CHANNEL or DELETE_CHANNEL, you MUST provide "channelId" from the provided Guild details. For MODIFY_CHANNEL, provide "name" or "topic" to change.
If you output MODIFY_ROLE or DELETE_ROLE, you MUST provide "roleId" from the Guild details. For MODIFY_ROLE, you can provide "name", "color" (hex).
CRITICAL: To rename/tweak a channel, do NOT use CREATE_CHANNEL. Use MODIFY_CHANNEL with the existing "channelId".
If the user asks to mute/deafen/disconnect in voice, output "VOICE_MUTE_MEMBER", "VOICE_DEAFEN_MEMBER", "VOICE_DISCONNECT_MEMBER" with memberId.

If the user asks to create rooms/channels inside a category (e.g. "make a gaming category with chat and voice channels"), you MUST do the following:
1. First, add a CREATE_CATEGORY action (or a CREATE_CHANNEL action with params.channelType set to "category") for the category (e.g., name: "Gaming").
2. Next, add CREATE_CHANNEL actions with params.channelType set to "text" or "voice" (e.g., name: "general-chat" or "Voice Lounge") and set their params.parentId to the parent category's name with a "category:" prefix (e.g. "parentId": "category:Gaming").`;

    const response = await generateContentWithRetry({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['explanation', 'actions'],
          properties: {
            explanation: { type: Type.STRING, description: 'Explanation of selected actions.' },
            actions: {
              type: Type.ARRAY,
              description: 'Steps to modify the server.',
              items: {
                type: Type.OBJECT,
                required: ['type', 'params'],
                properties: {
                  type: {
                    type: Type.STRING,
                    enum: ['CREATE_CHANNEL', 'CREATE_CATEGORY', 'DELETE_CHANNEL', 'CREATE_ROLE', 'DELETE_ROLE', 'MODIFY_CHANNEL', 'MODIFY_ROLE', 'MODIFY_SERVER_NAME', 'MUTE_MEMBER', 'BAN_MEMBER', 'KICK_MEMBER', 'TIMEOUT_MEMBER', 'ASSIGN_ROLE', 'REMOVE_ROLE', 'SEND_MESSAGE', 'DELETE_MESSAGES', 'VOICE_MUTE_MEMBER', 'VOICE_DEAFEN_MEMBER', 'VOICE_DISCONNECT_MEMBER', 'ADD_BOT']
                  },
                  params: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      channelType: { type: Type.STRING, enum: ['text', 'voice', 'category'] },
                      parentId: { type: Type.STRING },
                      color: { type: Type.STRING },
                      roleId: { type: Type.STRING },
                      channelId: { type: Type.STRING },
                      memberId: { type: Type.STRING },
                      serverName: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      return res.status(500).json({ error: 'Failed to generate architect plan' });
    }

    const payload = JSON.parse(resultText);
    return res.json(payload);
  } catch (err: any) {
    console.error('Gemini Architect modeling failed:', err);
    
    const errMsg = String(err?.message || '').toLowerCase();
    const errStatus = String(err?.status || '').toUpperCase();
    const isQuotaExhausted = errMsg.includes('429') || 
                             errMsg.includes('quota') || 
                             errMsg.includes('exhausted') || 
                             errMsg.includes('limit') || 
                             errStatus.includes('RESOURCE_EXHAUSTED') ||
                             err?.code === 429;
    const isTransient = errMsg.includes('503') || 
                        errMsg.includes('temporary') || 
                        errMsg.includes('busy') || 
                        errMsg.includes('demand') || 
                        errMsg.includes('unavailable') ||
                        errStatus.includes('UNAVAILABLE') ||
                        err?.code === 503;

    if (isQuotaExhausted) {
      return res.status(429).json({
        error: 'AI_QUOTA_EXHAUSTED',
        message: 'The workspace Gemini API Free-tier quota limit has been exceeded (20 requests/day). Please wait a minute, write a shorter design prompt, or provide an active Google Cloud API key in the Platform Settings > Secrets.'
      });
    } else if (isTransient) {
      return res.status(503).json({
        error: 'AI_TEMPORARILY_UNAVAILABLE',
        message: 'The Google Gemini API is currently unavailable due to very high request demand. Please try again in 5-10 seconds!'
      });
    }

    return res.status(500).json({ error: err.message || 'Gemini modeling failed' });
  }
});

// Execute AI Architect Plans on Discord REST API directly
app.post('/api/bot/architect/execute', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  const { guildId, actions } = req.body;

  if (!token || !guildId || !actions) {
    return res.status(400).json({ error: 'Token, guildId, and actions list are required' });
  }

  const hostClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  try {
    await hostClient.login(token);
    const guild = await hostClient.guilds.fetch(guildId);
    if (!guild) {
      hostClient.destroy();
      return res.status(404).json({ error: 'Discord Server (Guild) not found for execution' });
    }

    const executionResults = [];
    const categoryCache = new Map<string, string>(); // Maps temporary category name to final generated channel ID

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'CREATE_CATEGORY':
          case 'CREATE_CHANNEL': {
            const params = action.params;
            let typeCode = ChannelType.GuildText;
            const isCategory = action.type === 'CREATE_CATEGORY' || params.channelType === 'category';

            if (isCategory) {
              typeCode = ChannelType.GuildCategory;
            } else if (params.channelType === 'voice') {
              typeCode = ChannelType.GuildVoice;
            }

            let finalParentId = params.parentId;
            if (finalParentId && finalParentId.startsWith('category:')) {
              const placeholder = finalParentId.split('category:')[1];
              finalParentId = categoryCache.get(placeholder.toLowerCase()) || undefined;
            }

            const newChannel = await guild.channels.create({
              name: params.name || 'new-channel',
              type: typeCode,
              parent: finalParentId,
              reason: params.reason || 'AI Architect building server structure'
            });

            if (isCategory) {
              categoryCache.set((params.name || '').toLowerCase(), newChannel.id);
            }

            executionResults.push({
              action: action.type,
              status: 'SUCCESS',
              message: isCategory 
                ? `Created category: ${newChannel.name}` 
                : `Created channel: #${newChannel.name} (${params.channelType || 'text'})`
            });
            break;
          }

          case 'DELETE_CHANNEL': {
            const chan = await guild.channels.fetch(action.params.channelId);
            if (chan) {
              await chan.delete(action.params.reason || 'AI Architect deletion');
              executionResults.push({
                action: action.type,
                status: 'SUCCESS',
                message: `Deleted channel: #${chan.name}`
              });
            } else {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Channel ID ${action.params.channelId} not found`
              });
            }
            break;
          }

          case 'MODIFY_CHANNEL': {
            try {
              const chan = await guild.channels.fetch(action.params.channelId);
              if (chan) {
                const edits: any = {};
                if (action.params.name) edits.name = action.params.name;
                if (action.params.topic && chan.isTextBased()) edits.topic = action.params.topic;
                await chan.edit({ ...edits, reason: action.params.reason || 'AI Architect modify channel' });
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Modified channel: #${chan.name}`
                });
              } else {
                throw new Error('Channel not found');
              }
            } catch (err: any) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed modified channel ${action.params.channelId}: ${err.message}`
              });
            }
            break;
          }

          case 'CREATE_ROLE': {
            const params = action.params;
            const newRole = await guild.roles.create({
              name: params.name || 'New AI Role',
              color: params.color ? (params.color.replace('#', '0x') as any) : undefined,
              reason: params.reason || 'AI Architect building roles'
            });
            executionResults.push({
              action: action.type,
              status: 'SUCCESS',
              message: `Created role: @${newRole.name}`
            });
            break;
          }

          case 'DELETE_ROLE': {
            const role = await guild.roles.fetch(action.params.roleId);
            if (role) {
              await role.delete(action.params.reason || 'AI Architect deletion');
              executionResults.push({
                action: action.type,
                status: 'SUCCESS',
                message: `Deleted role: @${role.name}`
              });
            } else {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Role ID ${action.params.roleId} not found`
              });
            }
            break;
          }

          case 'MODIFY_ROLE': {
            try {
              const role = await guild.roles.fetch(action.params.roleId);
              if (role) {
                const edits: any = {};
                if (action.params.name) edits.name = action.params.name;
                if (action.params.color) edits.color = action.params.color.replace('#', '0x');
                await role.edit({ ...edits, reason: action.params.reason || 'AI Architect modify role' });
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Modified role: @${role.name}`
                });
              } else {
                throw new Error('Role not found');
              }
            } catch (err: any) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed modified role ${action.params.roleId}: ${err.message}`
              });
            }
            break;
          }

          case 'MODIFY_SERVER_NAME': {
            const oldName = guild.name;
            await guild.setName(action.params.serverName || oldName);
            executionResults.push({
              action: action.type,
              status: 'SUCCESS',
              message: `Renamed server from "${oldName}" to "${guild.name}"`
            });
            break;
          }

          case 'MUTE_MEMBER':
          case 'TIMEOUT_MEMBER': {
            try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member) {
                const durationMins = action.params.durationMinutes || 5;
                await member.timeout(durationMins * 60 * 1000, action.params.reason || 'AI automated moderation timeout');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Timed out member @${member.user.username} for ${durationMins} minutes.`
                });
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Member ID ${action.params.memberId} not found or permission denied`
              });
            }
            break;
          }

          case 'KICK_MEMBER': {
            try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member) {
                await member.kick(action.params.reason || 'AI Architect eviction');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Kicked member @${member.user.username}.`
                });
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed kicking member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'BAN_MEMBER': {
            try {
              await guild.members.ban(action.params.memberId, { reason: action.params.reason || 'AI Architect ban rule execution' });
              executionResults.push({
                action: action.type,
                status: 'SUCCESS',
                message: `Banned member ID ${action.params.memberId}.`
              });
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed banning member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'UNBAN_MEMBER': {
            try {
              await guild.bans.remove(action.params.memberId, action.params.reason || 'AI Architect pardon');
              executionResults.push({
                action: action.type,
                status: 'SUCCESS',
                message: `Unbanned member ID ${action.params.memberId}.`
              });
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed unbanning member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'ASSIGN_ROLE': {
            try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && action.params.roleId) {
                await member.roles.add(action.params.roleId, action.params.reason || 'AI Architect role assignment');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Assigned role ${action.params.roleId} to member @${member.user.username}.`
                });
              } else {
                throw new Error('Member or role not found');
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed assigning role ${action.params.roleId} to member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'REMOVE_ROLE': {
            try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && action.params.roleId) {
                await member.roles.remove(action.params.roleId, action.params.reason || 'AI Architect role removal');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Removed role ${action.params.roleId} from member @${member.user.username}.`
                });
              } else {
                throw new Error('Member or role not found');
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed removing role ${action.params.roleId} from member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'SEND_MESSAGE': {
            try {
              const channel = await guild.channels.fetch(action.params.channelId);
              if (channel && channel.isTextBased()) {
                await channel.send(action.params.messageContent || 'Hello from AI Architect!');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Sent message to channel ${channel.name}.`
                });
              } else {
                throw new Error('Channel not found or not text-based');
              }
            } catch (err: any) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed sending message: ${err.message}`
              });
            }
            break;
          }
          
          case 'DELETE_MESSAGES': {
            try {
              const channel = await guild.channels.fetch(action.params.channelId);
              if (channel && channel.isTextBased()) {
                const count = Math.min(Math.max(1, action.params.messageCount || 10), 100);
                // @ts-ignore bulkDelete exists on GuildTextChannel
                if (typeof channel.bulkDelete === 'function') {
                  const msgs = await channel.bulkDelete(count, true);
                  executionResults.push({
                    action: action.type,
                    status: 'SUCCESS',
                    message: `Deleted ${msgs.size} messages in channel ${channel.name}.`
                  });
                } else {
                   executionResults.push({
                    action: action.type,
                    status: 'FAILED',
                    message: `Channel ${channel.name} doesn't support bulk delete.`
                  });
                }
              }
            } catch (err: any) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed deleting messages: ${err.message}`
              });
            }
            break;
          }

          case 'VOICE_MUTE_MEMBER': {
            try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && member.voice.channelId) {
                await member.voice.setMute(true, action.params.reason || 'AI Architect voice mute');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Server-muted member @${member.user.username} in voice.`
                });
              } else {
                 executionResults.push({
                  action: action.type,
                  status: 'FAILED',
                  message: `Member @${member?.user.username || action.params.memberId} is not in a voice channel.`
                });
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed voice-muting member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'VOICE_DEAFEN_MEMBER': {
             try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && member.voice.channelId) {
                await member.voice.setDeaf(true, action.params.reason || 'AI Architect voice deafen');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Server-deafened member @${member.user.username} in voice.`
                });
              } else {
                 executionResults.push({
                  action: action.type,
                  status: 'FAILED',
                  message: `Member @${member?.user.username || action.params.memberId} is not in a voice channel.`
                });
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed voice-deafening member ${action.params.memberId}`
              });
            }
            break;
          }

          case 'VOICE_DISCONNECT_MEMBER': {
             try {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && member.voice.channelId) {
                await member.voice.disconnect(action.params.reason || 'AI Architect voice disconnect');
                executionResults.push({
                  action: action.type,
                  status: 'SUCCESS',
                  message: `Disconnected member @${member.user.username} from voice.`
                });
              } else {
                 executionResults.push({
                  action: action.type,
                  status: 'FAILED',
                  message: `Member @${member?.user.username || action.params.memberId} is not in a voice channel.`
                });
              }
            } catch (err) {
              executionResults.push({
                action: action.type,
                status: 'FAILED',
                message: `Failed disconnecting member ${action.params.memberId} from voice.`
              });
            }
            break;
          }

          case 'ADD_BOT': {
            const params = action.params;
            const bName = (params.name || '').toLowerCase().trim();
            
            const POPULAR_BOTS: Record<string, { id: string; permissions: string; displayName: string }> = {
              'carl': { id: '235148962100674560', permissions: '8', displayName: 'Carl-bot' },
              'carl-bot': { id: '235148962100674560', permissions: '8', displayName: 'Carl-bot' },
              'carlbot': { id: '235148962100674560', permissions: '8', displayName: 'Carl-bot' },
              'mee6': { id: '159985870458322944', permissions: '8', displayName: 'MEE6' },
              'dyno': { id: '155149108183695360', permissions: '8', displayName: 'Dyno' },
              'dank memer': { id: '270904126974590976', permissions: '8', displayName: 'Dank Memer' },
              'dankmemer': { id: '270904126974590976', permissions: '8', displayName: 'Dank Memer' },
              'rythm': { id: '235088799074484224', permissions: '8', displayName: 'Rythm' },
              'probot': { id: '282859044593598464', permissions: '1099511627903', displayName: 'ProBot' },
              'mudae': { id: '432610292342587394', permissions: '8', displayName: 'Mudae' },
              'ticket tool': { id: '558328638918656027', permissions: '8', displayName: 'Ticket Tool' },
              'tickettool': { id: '558328638918656027', permissions: '8', displayName: 'Ticket Tool' },
              'arcane': { id: '437808476106031104', permissions: '8', displayName: 'Arcane' },
              'welcomer': { id: '331002347318722560', permissions: '8', displayName: 'Welcomer' }
            };

            let botInfo = POPULAR_BOTS[bName];
            if (!botInfo) {
              const key = Object.keys(POPULAR_BOTS).find(k => bName.includes(k) || k.includes(bName));
              if (key) {
                botInfo = POPULAR_BOTS[key];
              }
            }

            const targetBotId = botInfo ? botInfo.id : (params.memberId || '235148962100674560');
            const displayName = botInfo ? botInfo.displayName : (params.name || 'Requested Bot');
            const perms = botInfo ? botInfo.permissions : '8';
            const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${targetBotId}&permissions=${perms}&scope=bot%20applications.commands&guild_id=${guildId}&disable_guild_select=true`;

            let isAlreadyMember = false;
            try {
              const member = await guild.members.fetch(targetBotId);
              if (member) {
                isAlreadyMember = true;
              }
            } catch (fetchErr) {
              // Ignore fetch error - normal if member doesn't exist
            }

            if (isAlreadyMember) {
              executionResults.push({
                action: action.type,
                status: 'SUCCESS',
                message: `${displayName} is already a member of your server!`
              });
            } else {
              executionResults.push({
                action: action.type,
                status: 'PENDING_AUTHORIZATION',
                botId: targetBotId,
                botName: displayName,
                inviteUrl,
                message: `Invite Pending: Please authorize ${displayName} to join the guild.`
              });
            }
            break;
          }

          default:
            executionResults.push({
              action: action.type,
              status: 'FAILED',
              message: 'Unknown action type specified'
            });
        }
      } catch (innerErr: any) {
        executionResults.push({
          action: action.type,
          status: 'FAILED',
          message: innerErr.message || 'Error occurred executing Discord API operation'
        });
      }
    }

    hostClient.destroy();
    return res.json({ executionResults });
  } catch (err: any) {
    hostClient.destroy();
    console.error('Error executing operations:', err);
    return res.status(500).json({ error: err.message || 'Error executing operations on server' });
  }
});

// SECURE BULK WIPE SERVER ENDPOINT
app.post('/api/bot/architect/wipe', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  const { guildId } = req.body;

  if (!token || !guildId) {
    return res.status(400).json({ error: 'X-Discord-Token header and guildId are required' });
  }

  const hostClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  try {
    await hostClient.login(token);
    const guild = await hostClient.guilds.fetch(guildId);
    if (!guild) {
      hostClient.destroy();
      return res.status(404).json({ error: 'Discord Server (Guild) not found for wiping' });
    }

    console.log(`[Server Architect] Commencing security-authorized server purge for Guild ID: ${guildId} (${guild.name})`);

    // 1. Create a pristine new default channel first to satisfy Discord's "at least one text channel" rule.
    const cleanDefaultChannel = await guild.channels.create({
      name: 'general',
      type: ChannelType.GuildText,
      reason: 'Pristine setup general channel created during security wipe'
    });

    const executionResults = [];

    // 2. Fetch and delete all existing channels except the new general channel
    const channelsRaw = await guild.channels.fetch();
    let channelsDeletedCount = 0;
    for (const [id, chan] of channelsRaw) {
      if (chan && chan.id !== cleanDefaultChannel.id) {
        try {
          await chan.delete('Security-authorized server wipe operation');
          channelsDeletedCount++;
        } catch (chanErr: any) {
          console.error(`[Wipe] Failed to delete channel ${chan?.name || id}:`, chanErr?.message);
        }
      }
    }
    executionResults.push({
      action: 'DELETE_CHANNELS',
      status: 'SUCCESS',
      message: `Successfully deleted ${channelsDeletedCount} old channels and categories.`
    });

    // 3. Fetch and delete all deletable non-managed roles (excluding @everyone and bot integration role)
    const rolesRaw = await guild.roles.fetch();
    let rolesDeletedCount = 0;
    for (const [id, role] of rolesRaw) {
      if (role && role.id !== guild.id && role.editable && !role.managed) {
        try {
          await role.delete('Security-authorized server wipe operation');
          rolesDeletedCount++;
        } catch (roleErr: any) {
          console.error(`[Wipe] Failed to delete role ${role.name || id}:`, roleErr?.message);
        }
      }
    }
    executionResults.push({
      action: 'DELETE_ROLES',
      status: 'SUCCESS',
      message: `Successfully deleted ${rolesDeletedCount} custom roles.`
    });

    executionResults.push({
      action: 'CREATE_DEFAULT',
      status: 'SUCCESS',
      message: 'Created pristine #general text channel.'
    });

    hostClient.destroy();
    return res.json({ 
      success: true, 
      message: 'Server successfully wiped and reset to pristine state', 
      executionResults 
    });
  } catch (err: any) {
    hostClient.destroy();
    console.error('Error during authorized server purge:', err);
    return res.status(500).json({ error: err.message || 'Error occurred during server purge' });
  }
});


// LIVE CHATBOT CONTROLLER: Turns the Discord bot online, listening directly in Discord servers in real time.
app.post('/api/bot/toggle-live', async (req, res) => {
  const token = req.headers['x-discord-token'] as string;
  const { userId, customPrompt, activeGuildId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ error: 'Token and userId are required' });
  }

  // If already active, shut it down
  if (clientPool.has(userId)) {
    const active = clientPool.get(userId)!;
    active.destroy();
    clientPool.delete(userId);
    logForBot(userId, 'info', 'Bot successfully offline.');
    return res.json({ status: 'OFFLINE', message: 'Bot turned Offline' });
  }

  // Create new Discord gateway client
  const botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  });

  try {
    botClient.on('ready', () => {
      console.log(`Bot ${botClient.user?.tag} is online & listening`);
      logForBot(userId, 'info', `Logged in as ${botClient.user?.tag}. Listening to servers.`);
    });

    botClient.on('error', (err) => {
      console.error('Bot client error:', err);
      logForBot(userId, 'error', `Bot connection error: ${err.message}`);
    });

    // Real-time listener for Discord server messages inside channels
    botClient.on('messageCreate', async (message) => {
      // Ignore other bots or self messages
      if (message.author.bot || !botClient.user) return;

      // Auto-Moderation Evaluation
      const rules = automodRulesCache.get(userId) || [];
      if (rules.length > 0 && message.guild) {
        const lowerContent = message.content.toLowerCase();
        for (const rule of rules) {
          if (lowerContent.includes(rule.keyword)) {
            try {
              logForBot(userId, 'warn', `Auto-Mod triggered for @${message.author.username} matching '${rule.keyword}'. Action: ${rule.action}`);
              await message.delete();
              
              const member = await message.guild.members.fetch(message.author.id).catch(() => null);
              if (member) {
                if (rule.action === 'timeout') {
                  const duration = (rule.timeoutDurationMinutes || 5) * 60 * 1000;
                  await member.timeout(duration, `Auto-Mod rule matched: ${rule.keyword}`);
                } else if (rule.action === 'kick') {
                  await member.kick(`Auto-Mod rule matched: ${rule.keyword}`);
                } else if (rule.action === 'ban') {
                  await member.ban({ reason: `Auto-Mod rule matched: ${rule.keyword}` });
                }
              }
              
              // We successfully acted on a rule, stop processing other rules for this same message
              return;
            } catch (modErr: any) {
              logForBot(userId, 'error', `Auto-Mod failed to execute ${rule.action} on @${message.author.username}: ${modErr.message}`);
              return;
            }
          }
        }
      }

      // Check if bot was mentioned or if user tags it
      const isMentioned = message.mentions.has(botClient.user.id);
      
      if (isMentioned) {
        message.channel.sendTyping();
        logForBot(userId, 'info', `Answering mention from @${message.author.username} in channel #${(message.channel as any).name}`);

        try {
          // Instruct Gemini to assume the persona and fulfill commands or request
          const systemInstruction = customPrompt || 'You are an intelligent, powerful, helpful AI Discord Admin assistant. You have full Administrator access, and can guide users on roles, channels, setting up servers, or provide helpful server building advice.';
          const cleanInput = message.content.replace(`<@${botClient.user.id}>`, '').trim();

          const response = await generateContentWithRetry({
            model: 'gemini-3.5-flash',
            contents: `User message: "${cleanInput}"\n\nYou are talking in Discord guild channel #${(message.channel as any).name} in the server "${message.guild?.name}". Suggest role structures, answer general questions, moderate nicely, or offer helpful advice. Keep the response friendly, constructive, and concise.`,
            config: {
              systemInstruction
            }
          });

          const replyText = response.text || 'Beep boop! I heard you but failed to formulate an answer.';
          await message.reply(replyText);
        } catch (innerErr: any) {
          console.error('Live responding failed:', innerErr);
          logForBot(userId, 'error', `Failed to respond to message: ${innerErr.message || innerErr}`);
          await message.reply(`Oops! I ran into an error while communicating with my system brains: ${innerErr.message || 'Unknown error'}`);
        }
      }
    });

    await botClient.login(token);
    clientPool.set(userId, botClient);
    return res.json({ status: 'ONLINE', username: botClient.user?.username });
  } catch (err: any) {
    botClient.destroy();
    console.error('Failed to log in the live bot:', err);
    logForBot(userId, 'error', `Failed logging in: ${err.message}`);
    return res.status(500).json({ error: err.message || 'Error executing live client login' });
  }
});

// Endpoint to fetch real-time active state & cache logs of the bot for dashboard
app.get('/api/bot/status/:userId', (req, res) => {
  const { userId } = req.params;
  const isOnline = clientPool.has(userId);
  const logs = botLogs.get(userId) || [];
  return res.json({
    online: isOnline,
    logs
  });
});

// Clear active server pool sessions on shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Purging active Discord sockets...');
  for (const client of clientPool.values()) {
    try { client.destroy(); } catch (e) {}
  }
});

// Serve frontend assets and listen on port
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start fullstack express engine on Hardcoded Port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express engine listening on port ${PORT}`);
  });
}

startServer().catch(console.error);
