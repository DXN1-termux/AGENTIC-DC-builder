import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import readline from 'readline';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
let PKG_VERSION = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
  PKG_VERSION = pkg.version || '1.0.0';
} catch { /* ignore */ }

// --- CLI Arg Parsing ---
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  console.log(`discord-server-architect v${PKG_VERSION}`);
  process.exit(0);
}
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[1m\x1b[35mdiscord-server-architect\x1b[0m v${PKG_VERSION}
AI-powered Discord server management CLI

\x1b[1mUSAGE\x1b[0m
  npm run cli                  Launch interactive architect CLI
  npm run cli -- --help        Show this help
  npm run cli -- --version     Show version

\x1b[1mRUNTIME COMMANDS\x1b[0m
  <any instruction>            Describe server changes in plain English
  refresh                      Re-fetch and redisplay the server tree
  clear                        Clear the terminal screen
  exit | quit                  Disconnect and exit

\x1b[1mCREDENTIALS\x1b[0m
  Set via environment variables or answer the interactive prompts:
    GEMINI_API_KEY              Google Gemini API key
    DISCORD_TOKEN               Discord bot token
    GUILD_ID                    Target Discord server (Guild) ID

  Or create a .env.local file (see .env.example)

\x1b[1mEXAMPLE INSTRUCTIONS\x1b[0m
  "Create a gaming server with voice channels for different games"
  "Add a VIP role with purple color and move it above moderator"
  "Clean up all duplicate channels and reorganize into categories"
  "Send a welcome message to the general channel"
`);
  process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

// --- Custom Non-Blocking Terminal Spinner ---
function startSpinner(text: string) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let x = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r\x1b[35m${frames[x++]}\x1b[0m ${text}`);
    x %= frames.length;
  }, 80);
  return {
    stop: (success = true, finalMsg = '') => {
      clearInterval(id);
      process.stdout.write(`\r${success ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m'} ${finalMsg || text}\n`);
    }
  };
}

// --- Visual Tree Diagram Renderer ---
function printServerTree(channels: any[], roles: any[]) {
  console.log('\n\x1b[1m\x1b[34m🏰 CURRENT SERVER MAP\x1b[0m');
  
  // Categorize channels
  const categories = channels.filter(c => c.type === ChannelType.GuildCategory);
  const uncategorized = channels.filter(c => !c.parentId && c.type !== ChannelType.GuildCategory);
  
  // Render Categories & Childs
  categories.forEach(cat => {
    console.log(` 📁 \x1b[1m\x1b[35m${cat.name.toUpperCase()}\x1b[0m`);
    const childs = channels.filter(c => c.parentId === cat.id);
    childs.forEach((child, index) => {
      const isLast = index === childs.length - 1;
      const branch = isLast ? ' └──' : ' ├──';
      const icon = child.type === ChannelType.GuildVoice ? '🔊' : '💬';
      console.log(`   ${branch} ${icon} \x1b[37m${child.name}\x1b[0m`);
    });
  });
  
  // Render Uncategorized
  if (uncategorized.length > 0) {
    console.log(` 📁 \x1b[1m\x1b[36mUNCATEGORIZED CHANNELS\x1b[0m`);
    uncategorized.forEach((child, index) => {
      const isLast = index === uncategorized.length - 1;
      const branch = isLast ? ' └──' : ' ├──';
      const icon = child.type === ChannelType.GuildVoice ? '🔊' : '💬';
      console.log(`   ${branch} ${icon} \x1b[37m${child.name}\x1b[0m`);
    });
  }

  // Render Roles
  console.log('\n\x1b[1m\x1b[33m🏷️  ROLES HIERARCHY\x1b[0m');
  const sortedRoles = [...roles].sort((a, b) => b.position - a.position);
  sortedRoles.forEach(role => {
    if (role.name === '@everyone') return;
    const colorCode = role.color 
      ? `\x1b[38;2;${(role.color >> 16) & 255};${(role.color >> 8) & 255};${role.color & 255}m` 
      : '\x1b[37m';
    console.log(`   • ${colorCode}${role.name}\x1b[0m`);
  });
}

// --- Colored Action Plan Formatter ---
function printActionPlan(actions: any[]) {
  console.log('\n\x1b[1m\x1b[35m🛠️  PROPOSED ARCHITECTURAL PLAN\x1b[0m');
  actions.forEach((action, index) => {
    const num = `\x1b[33m[${index + 1}]\x1b[0m`;
    const params = action.params;
    
    switch (action.type) {
      case 'CREATE_CATEGORY':
        console.log(`   ${num} \x1b[32m[+] Create Category:\x1b[0m "${params.name}"`);
        break;
      case 'CREATE_CHANNEL':
        console.log(`   ${num} \x1b[32m[+] Create Channel:\x1b[0m "${params.name}" (Type: ${params.channelType || 'text'}, Parent: ${params.parentId || 'None'})`);
        break;
      case 'DELETE_CHANNEL':
        console.log(`   ${num} \x1b[31m[-] Delete Channel ID:\x1b[0m ${params.channelId} (Reason: ${params.reason || 'None'})`);
        break;
      case 'MODIFY_CHANNEL':
        console.log(`   ${num} \x1b[33m[*] Modify Channel ID:\x1b[0m ${params.channelId} (New Name: ${params.name || 'Unchanged'}, Topic: ${params.topic || 'Unchanged'})`);
        break;
      case 'CREATE_ROLE':
        console.log(`   ${num} \x1b[32m[+] Create Role:\x1b[0m "${params.name}" (Color: ${params.color || 'Default'})`);
        break;
      case 'DELETE_ROLE':
        console.log(`   ${num} \x1b[31m[-] Delete Role ID:\x1b[0m ${params.roleId}`);
        break;
      case 'MODIFY_ROLE':
        console.log(`   ${num} \x1b[33m[*] Modify Role ID:\x1b[0m ${params.roleId} (New Name: ${params.name || 'Unchanged'}, Color: ${params.color || 'Unchanged'})`);
        break;
      case 'SEND_MESSAGE':
        console.log(`   ${num} \x1b[36m[>] Send Message:\x1b[0m ${params.channelId} -> "${params.messageContent}"`);
        break;
      case 'DELETE_MESSAGES':
        console.log(`   ${num} \x1b[31m[x] Delete Messages:\x1b[0m ${params.messageCount} in Channel ${params.channelId}`);
        break;
      case 'ADD_BOT':
        console.log(`   ${num} \x1b[35m[+] Add Bot:\x1b[0m "${params.name}"`);
        break;
      default:
        console.log(`   ${num} \x1b[37m[?] Action:\x1b[0m ${action.type} with params: ${JSON.stringify(params)}`);
    }
  });
}

async function main() {
  console.log('\n\x1b[1m\x1b[35m╔═════════════════════════════════════════════════════╗');
  console.log(`║   🏰  DISCORD SERVER ARCHITECT  v${PKG_VERSION.padEnd(18)}║`);
  console.log('║              AI-Powered Guild Management             ║');
  console.log('╚═════════════════════════════════════════════════════╝\x1b[0m');
  console.log('\x1b[2m  Type "help" for commands, "exit" to quit.\x1b[0m');
  
  // 1. Resolve Credentials
  let geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    geminiKey = await askQuestion('🔑 Enter your Gemini API Key: ');
    geminiKey = geminiKey.trim();
    if (!geminiKey) {
      console.error('\x1b[31m❌ Gemini API key is required.\x1b[0m');
      process.exit(1);
    }
  }

  let botToken = process.env.DISCORD_TOKEN;
  if (!botToken) {
    botToken = await askQuestion('🤖 Enter your Discord Bot Token: ');
    botToken = botToken.trim();
    if (!botToken) {
      console.error('\x1b[31m❌ Discord Bot Token is required.\x1b[0m');
      process.exit(1);
    }
  }

  let guildId = process.env.GUILD_ID;
  if (!guildId) {
    guildId = await askQuestion('🏰 Enter target Discord Server (Guild) ID: ');
    guildId = guildId.trim();
    if (!guildId) {
      console.error('\x1b[31m❌ Guild ID is required.\x1b[0m');
      process.exit(1);
    }
  }

  // 2. Init Gemini SDK
  const ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  // Fallback and Retry Engine for Gemini Calls
  async function generateContentWithRetry(params: any, retries = 2): Promise<any> {
    const modelsToTry = [
      params.model || 'gemini-2.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];
    const uniqueModels = Array.from(new Set(modelsToTry));
    let lastError: any = null;

    for (const model of uniqueModels) {
      let attempt = 0;
      while (attempt <= retries) {
        try {
          const response = await ai.models.generateContent({ ...params, model });
          return response;
        } catch (err: any) {
          lastError = err;
          const errorMessage = String(err?.message || '').toLowerCase();
          const errStatus = String(err?.status || '').toUpperCase();
          
          const isQuotaExhausted = errorMessage.includes('429') || 
                                   errorMessage.includes('quota') || 
                                   errorMessage.includes('exhausted') || 
                                   errorMessage.includes('limit') ||
                                   errStatus.includes('RESOURCE_EXHAUSTED') ||
                                   err?.code === 429;
          
          if (isQuotaExhausted) {
            break;
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
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
              continue;
            }
          }
          break;
        }
      }
    }
    throw lastError || new Error('All model attempts failed');
  }

  // 3. Connect to Discord API
  const connSpinner = startSpinner('Establishing secure Discord link...');
  const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  try {
    await discordClient.login(botToken);
  } catch (err: any) {
    connSpinner.stop(false, 'Discord link failed.');
    console.error(`\x1b[31m❌ Failed to login to Discord: ${err.message || err}\x1b[0m`);
    process.exit(1);
  }

  const guild = await discordClient.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    connSpinner.stop(false, 'Discord guild retrieval failed.');
    console.error(`\x1b[31m❌ Discord Guild ID ${guildId} is not accessible.\x1b[0m`);
    discordClient.destroy();
    process.exit(1);
  }

  connSpinner.stop(true, `Connected successfully to "${guild.name}" as [${discordClient.user?.tag}]`);

  // Initial Fetch & Show Structure
  const fetchSpinner = startSpinner('Syncing server directories & database records...');
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

  const guildDetails = { channels, roles };
  fetchSpinner.stop(true, 'Server sync completed.');

  // Print initial diagram tree
  printServerTree(guildDetails.channels, guildDetails.roles);

  // Helper to re-sync and display tree
  async function syncAndPrint() {
    const syncSpinner = startSpinner('Fetching latest server structure...');
    const chRaw = await guild.channels.fetch();
    guildDetails.channels = chRaw.map(c => ({
      id: c?.id, name: c?.name, type: c?.type, position: c?.position, parentId: c?.parentId
    }));
    const roRaw = await guild.roles.fetch();
    guildDetails.roles = roRaw.map(r => ({
      id: r.id, name: r.name, color: r.color, position: r.position, permissions: r.permissions.toString()
    }));
    syncSpinner.stop(true, 'Server structure synced.');
    printServerTree(guildDetails.channels, guildDetails.roles);
  }

  // 4. Prompt loop
  while (true) {
    console.log('\n\x1b[2m─────────────────────────────────────────────────────\x1b[0m');
    const instruction = await askQuestion('\x1b[1m\x1b[35m▶\x1b[0m  Instruction: ');
    const cmd = instruction.trim().toLowerCase();
    
    if (cmd === 'exit' || cmd === 'quit') {
      break;
    }

    if (cmd === 'clear') {
      process.stdout.write('\x1b[2J\x1b[0f');
      continue;
    }

    if (cmd === 'refresh') {
      await syncAndPrint();
      continue;
    }

    if (cmd === 'help') {
      console.log(`
\x1b[1mRUNTIME COMMANDS\x1b[0m
  \x1b[33mrefresh\x1b[0m      Re-fetch and redisplay the server tree
  \x1b[33mclear\x1b[0m        Clear the terminal screen
  \x1b[33mexit / quit\x1b[0m  Disconnect and exit
  \x1b[33m<instruction>\x1b[0m Describe server changes in plain English
`);
      continue;
    }

    if (!instruction.trim()) continue;

    const planSpinner = startSpinner('Google Gemini is analyzing layout and drafting action plan...');
    
    const prompt = `You are a HIGHLY INTELLIGENT, EXPERT Discord Guild Architect and veteran Server Master. You possess absolute knowledge of the Discord API, community server paradigms, channel categorization, permission hierarchies, and engagement-driven layouts.

CRITICAL DIRECTIVES & DISCORD KNOWLEDGE BASE:
1. ABSOLUTE DEDUPLICATION: You must meticulously analyze the provided JSON of current channels and roles. Look for ANY overlaps. Your TOP PRIORITY is to output DELETE_CHANNEL or DELETE_ROLE to completely wipe out redundant, unused, or messy duplicates before making new ones.
2. AESTHETICS & NAMING CONVENTIONS: Tastful emojis (e.g. 📣-announcements, 💬-general).
3. ROLE HIERARCHY & PERMISSIONS STRUCTURE: Contraesting vibrant colors.
4. PROPER CATEGORIZATION: parentId referencing category name placeholders.

Guild current structural details:
Channels: ${JSON.stringify(guildDetails.channels)}
Roles: ${JSON.stringify(guildDetails.roles)}

User Request: "${instruction}"

Output exactly one valid JSON object conforming to this schema:
{
  "explanation": "Brief explanation",
  "actions": [
    {
      "type": "CREATE_CHANNEL", 
      "params": {
        "name": "General Chat",
        "channelType": "text", 
        "parentId": "optional_category_id",
        "color": "#ff0000",
        "roleId": "optional_target_id",
        "channelId": "optional_target_id",
        "topic": "optional topic",
        "memberId": "optional_member_id",
        "serverName": "optional_server_name",
        "reason": "optional_reason",
        "durationMinutes": 60,
        "messageContent": "Hello World",
        "messageCount": 50
      }
    }
  ]
}`;

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: ['explanation', 'actions'],
            properties: {
              explanation: { type: Type.STRING },
              actions: {
                type: Type.ARRAY,
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
                        channelType: { type: Type.STRING },
                        parentId: { type: Type.STRING },
                        color: { type: Type.STRING },
                        roleId: { type: Type.STRING },
                        channelId: { type: Type.STRING },
                        memberId: { type: Type.STRING },
                        serverName: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        durationMinutes: { type: Type.INTEGER },
                        messageContent: { type: Type.STRING },
                        messageCount: { type: Type.INTEGER }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      planSpinner.stop(true, 'Gemini analysis complete.');

      const payload = JSON.parse(response.text || '{}');
      console.log(`\n\x1b[32m✔ Rationale:\x1b[0m ${payload.explanation}`);

      if (!payload.actions || payload.actions.length === 0) {
        console.log('\x1b[33m⚠️ Gemini determined no structural changes are needed for this request.\x1b[0m');
        continue;
      }

      // Print Proposed plan beautifully
      printActionPlan(payload.actions);

      // Review Plan
      const review = await askQuestion('\n❓ Proceed and apply these architectural changes to the server? (y/n): ');
      if (review.trim().toLowerCase() !== 'y') {
        console.log('\x1b[31m✖ Action execution aborted by user.\x1b[0m');
        continue;
      }

      console.log('\n🚀 Starting deployment phase...');
      const categoryCache = new Map<string, string>();

      for (const action of payload.actions) {
        const actionSpinner = startSpinner(`Executing: ${action.type}...`);
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
                reason: params.reason || 'CLI AI Architect building server structure'
              });

              if (isCategory) {
                categoryCache.set((params.name || '').toLowerCase(), newChannel.id);
              }
              actionSpinner.stop(true, `Successfully created: "${newChannel.name}"`);
              break;
            }

            case 'DELETE_CHANNEL': {
              const chan = await guild.channels.fetch(action.params.channelId);
              if (chan) {
                await chan.delete(action.params.reason || 'CLI AI Architect deletion');
                actionSpinner.stop(true, `Successfully deleted: "${chan.name}"`);
              } else {
                throw new Error(`Channel ${action.params.channelId} not found`);
              }
              break;
            }

            case 'MODIFY_CHANNEL': {
              const chan = await guild.channels.fetch(action.params.channelId);
              if (chan) {
                const edits: any = {};
                if (action.params.name) edits.name = action.params.name;
                if (action.params.topic && chan.isTextBased()) edits.topic = action.params.topic;
                await chan.edit({ ...edits, reason: action.params.reason || 'CLI AI Architect modify channel' });
                actionSpinner.stop(true, `Successfully modified: "${chan.name}"`);
              } else {
                throw new Error(`Channel ${action.params.channelId} not found`);
              }
              break;
            }

            case 'CREATE_ROLE': {
              const params = action.params;
              const newRole = await guild.roles.create({
                name: params.name || 'New AI Role',
                color: params.color ? (params.color.replace('#', '0x') as any) : undefined,
                reason: params.reason || 'CLI AI Architect building roles'
              });
              actionSpinner.stop(true, `Successfully created role: @${newRole.name}`);
              break;
            }

            case 'DELETE_ROLE': {
              const role = await guild.roles.fetch(action.params.roleId);
              if (role) {
                await role.delete(action.params.reason || 'CLI AI Architect deletion');
                actionSpinner.stop(true, `Successfully deleted role: @${role.name}`);
              } else {
                throw new Error(`Role ${action.params.roleId} not found`);
              }
              break;
            }

            case 'MODIFY_ROLE': {
              const role = await guild.roles.fetch(action.params.roleId);
              if (role) {
                const edits: any = {};
                if (action.params.name) edits.name = action.params.name;
                if (action.params.color) edits.color = action.params.color.replace('#', '0x');
                await role.edit({ ...edits, reason: action.params.reason || 'CLI AI Architect modify role' });
                actionSpinner.stop(true, `Successfully modified role: @${role.name}`);
              } else {
                throw new Error(`Role ${action.params.roleId} not found`);
              }
              break;
            }

            case 'MODIFY_SERVER_NAME': {
              const oldName = guild.name;
              await guild.setName(action.params.serverName || guild.name);
              actionSpinner.stop(true, `Renamed server to "${guild.name}" (was: "${oldName}")`);
              break;
            }

            case 'TIMEOUT_MEMBER': {
              const member = await guild.members.fetch(action.params.memberId);
              if (member) {
                const durationMins = action.params.durationMinutes || 5;
                await member.timeout(durationMins * 60 * 1000, action.params.reason || 'CLI AI Architect timeout');
                actionSpinner.stop(true, `Timed out @${member.user.username} for ${durationMins}m`);
              } else {
                throw new Error(`Member ${action.params.memberId} not found`);
              }
              break;
            }

            case 'KICK_MEMBER': {
              const member = await guild.members.fetch(action.params.memberId);
              if (member) {
                await member.kick(action.params.reason || 'CLI AI Architect eviction');
                actionSpinner.stop(true, `Kicked @${member.user.username}`);
              } else {
                throw new Error(`Member ${action.params.memberId} not found`);
              }
              break;
            }

            case 'BAN_MEMBER': {
              await guild.members.ban(action.params.memberId, { reason: action.params.reason || 'CLI AI Architect ban' });
              actionSpinner.stop(true, `Banned member ID ${action.params.memberId}`);
              break;
            }

            case 'ASSIGN_ROLE': {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && action.params.roleId) {
                await member.roles.add(action.params.roleId, action.params.reason || 'CLI AI Architect role assign');
                actionSpinner.stop(true, `Assigned role ID ${action.params.roleId} to @${member.user.username}`);
              } else {
                throw new Error('Member or role not found');
              }
              break;
            }

            case 'REMOVE_ROLE': {
              const member = await guild.members.fetch(action.params.memberId);
              if (member && action.params.roleId) {
                await member.roles.remove(action.params.roleId, action.params.reason || 'CLI AI Architect role remove');
                actionSpinner.stop(true, `Removed role ID ${action.params.roleId} from @${member.user.username}`);
              } else {
                throw new Error('Member or role not found');
              }
              break;
            }

            case 'SEND_MESSAGE': {
              const channel = await guild.channels.fetch(action.params.channelId);
              if (channel && channel.isTextBased()) {
                await channel.send(action.params.messageContent || 'Hello from CLI Architect!');
                actionSpinner.stop(true, `Sent message to #${channel.name}`);
              } else {
                throw new Error('Channel not found or not text-based');
              }
              break;
            }

            default:
              actionSpinner.stop(false, `Unhandled action skipped: ${action.type}`);
          }
        } catch (innerErr: any) {
          actionSpinner.stop(false, `Failed: ${innerErr.message || innerErr}`);
        }
      }
      console.log('\n\x1b[32m✔ Server changes deployed successfully!\x1b[0m');

      // Sync active memory with changes
      const syncSpinner = startSpinner('Resyncing active server tree...');
      const cleanChannels = await guild.channels.fetch();
      guildDetails.channels = cleanChannels.map(c => ({
        id: c?.id,
        name: c?.name,
        type: c?.type,
        position: c?.position,
        parentId: c?.parentId
      }));
      const cleanRoles = await guild.roles.fetch();
      guildDetails.roles = cleanRoles.map(r => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
        permissions: r.permissions.toString()
      }));
      syncSpinner.stop(true, 'Server sync complete.');

      // Print new server map
      printServerTree(guildDetails.channels, guildDetails.roles);

    } catch (err: any) {
      planSpinner.stop(false, 'Gemini architect failed.');
      console.error(`\x1b[31m❌ Error executing Gemini Plan / Bot commands: ${err.message || err}\x1b[0m`);
    }
  }

  discordClient.destroy();
  rl.close();
  console.log('\n👋 Goodbye!');
}

main().catch(console.error);
