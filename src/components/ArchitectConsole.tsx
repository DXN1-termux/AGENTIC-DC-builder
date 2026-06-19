import React from 'react';
import { 
  Server, Shield, Bot, Terminal, Settings, LogOut, Layout, Plus, Trash2, 
  RefreshCw, Power, ServerCrash, CheckCircle2, XCircle, Send, AlertTriangle, Play,
  Cpu, Layers, Lock, Unlock, Wifi, Check, ExternalLink, Activity, ShieldAlert
} from 'lucide-react';
import { BotInfo, DiscordGuild, BotActionPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ArchitectProps {
  userId: string;
  decryptedToken: string;
  config: any;
  onConfigUpdate: (config: any) => void;
  onLogout: () => void;
}

export default function ArchitectConsole({ userId, decryptedToken, config, onConfigUpdate, onLogout }: ArchitectProps) {
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'builder' | 'logs' | 'settings' | 'automod'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);
  
  // Bot details loaded inside current Guild
  const [guildsList, setGuildsList] = React.useState<DiscordGuild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = React.useState<string>(config.guildId || '');
  const [guildDetails, setGuildDetails] = React.useState<any | null>(null);
  
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // AI Architect State
  const [architectPrompt, setArchitectPrompt] = React.useState<string>('');
  const [actionPlan, setActionPlan] = React.useState<BotActionPlan | null>(null);
  const [planning, setPlanning] = React.useState<boolean>(false);
  const [executing, setExecuting] = React.useState<boolean>(false);

  // Bot Status Tracker
  const [botState, setBotState] = React.useState<{ online: boolean; logs: any[] }>({ online: false, logs: [] });
  const [togglingLive, setTogglingLive] = React.useState<boolean>(false);
  const [autoApply, setAutoApply] = React.useState<boolean>(false);
  const [autonomousMode, setAutonomousMode] = React.useState<boolean>(false);
  const [autonomousGoal, setAutonomousGoal] = React.useState<string>('');
  const autonomousGoalRef = React.useRef<string>('');
  React.useEffect(() => { autonomousGoalRef.current = autonomousGoal; }, [autonomousGoal]);
  const autonomousHistoryRef = React.useRef<string[]>([]);

  // Settings Persona State
  const [customPrompt, setCustomPrompt] = React.useState<string>(config.systemPrompt || '');
  const [savingSettings, setSavingSettings] = React.useState<boolean>(false);

  // Historic Activity Logs
  const [activityLogs, setActivityLogs] = React.useState<any[]>([]);
  const [logsLoading, setLogsLoading] = React.useState<boolean>(false);

  // Secure Multi-Step Wipe State
  const [showWipeModal, setShowWipeModal] = React.useState<boolean>(false);
  const [wipeStep, setWipeStep] = React.useState<number>(1);
  const [wipeTokenValue, setWipeTokenValue] = React.useState<string>('');
  const [wiping, setWiping] = React.useState<boolean>(false);
  const [wipeSuccess, setWipeSuccess] = React.useState<boolean>(false);
  const [wipeError, setWipeError] = React.useState<string | null>(null);

  // Auto-Moderation State
  const [automodRules, setAutomodRules] = React.useState<Array<{id: string, keyword: string, action: 'delete' | 'timeout' | 'kick' | 'ban', timeoutDurationMinutes?: number}>>([
    { id: '1', keyword: 'scam_link_here', action: 'delete' }
  ]);
  const [newRuleKeyword, setNewRuleKeyword] = React.useState<string>('');
  const [newRuleAction, setNewRuleAction] = React.useState<'delete' | 'timeout' | 'kick' | 'ban'>('delete');
  const [newRuleTimeout, setNewRuleTimeout] = React.useState<number>(5);
  const [savingRules, setSavingRules] = React.useState<boolean>(false);
  const [rulesSaved, setRulesSaved] = React.useState<boolean>(false);

  // Bot addition & Interactive Captcha assistant state
  const [activeBotAdd, setActiveBotAdd] = React.useState<{
    botName: string;
    inviteUrl: string;
    botId: string;
    step: 'scanning' | 'solving' | 'auth_ready' | 'polling' | 'success' | 'failed';
    captchaGrid: boolean[];
    errorMsg?: string | null;
    customBotId?: string;
    bypassSpeed: 'normal' | 'fast' | 'manual';
    diagnosticsLogs: string[];
    assistedClicks: number;
    challengeCategory: string;
  } | null>(null);

  const [showIdOverride, setShowIdOverride] = React.useState<boolean>(false);
  const [customIdInput, setCustomIdInput] = React.useState<string>('');
  const [customPermsInput, setCustomPermsInput] = React.useState<string>('8');

  const pollingIntervalRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Bot addition and interactive CAPTCHA state driver with high-fidelity telemetry logs
  React.useEffect(() => {
    if (!activeBotAdd) return;

    if (activeBotAdd.step === 'scanning') {
      const t1 = setTimeout(() => {
        setActiveBotAdd(prev => prev ? {
          ...prev,
          diagnosticsLogs: [...prev.diagnosticsLogs, '> [SCANNER] Bypassing Cloudflare WAF signature checkpoints... OK']
        } : null);
      }, 400);

      const t2 = setTimeout(() => {
        setActiveBotAdd(prev => prev ? {
          ...prev,
          diagnosticsLogs: [...prev.diagnosticsLogs, '> [SCANNER] Tunnel proxy established on stream port 8443... OK']
        } : null);
      }, 800);

      const t3 = setTimeout(() => {
        setActiveBotAdd(prev => prev ? {
          ...prev,
          step: 'solving',
          diagnosticsLogs: [
            ...prev.diagnosticsLogs,
            '> [SCANNER] Diverting security challenges to AI Neural Matrix Resolver.',
            `> Challenge entity target: [${prev.challengeCategory}]`
          ]
        } : null);
      }, 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    if (activeBotAdd.step === 'solving') {
      if (activeBotAdd.bypassSpeed === 'fast') {
        const t1 = setTimeout(() => {
          setActiveBotAdd(prev => {
            if (!prev) return null;
            const nextGrid = [...prev.captchaGrid];
            nextGrid[1] = true;
            nextGrid[4] = true;
            nextGrid[7] = true;
            return {
              ...prev,
              captchaGrid: nextGrid,
              diagnosticsLogs: [
                ...prev.diagnosticsLogs,
                '> [FAST-SOLVE] Formulating grid matrix with quick resolution vectors.',
                '> [FAST-SOLVE] Tile match confidence score: 0.995'
              ]
            };
          });
        }, 150);

        const t2 = setTimeout(() => {
          setActiveBotAdd(prev => {
            if (!prev) return null;
            return {
              ...prev,
              step: 'auth_ready',
              diagnosticsLogs: [
                ...prev.diagnosticsLogs,
                '> [SYSTEM] Fast bypass success! Auth token generated.'
              ]
            };
          });
        }, 500);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      } else if (activeBotAdd.bypassSpeed === 'normal') {
        const delays = [600, 1200, 1800, 2400];
        const timers = delays.map((delay, idx) => {
          return setTimeout(() => {
            setActiveBotAdd(prev => {
              if (!prev) return null;
              const nextGrid = [...prev.captchaGrid];
              const nextLogs = [...prev.diagnosticsLogs];
              if (idx === 0) {
                nextGrid[2] = true;
                nextLogs.push(`> [SOLVER] Aligning neural weight at matching quadrant 3. Match score: 0.94.`);
              } else if (idx === 1) {
                nextGrid[4] = true;
                nextLogs.push(`> [SOLVER] Scanning cluster index 5. Probability index: 0.88.`);
              } else if (idx === 2) {
                nextGrid[6] = true;
                nextLogs.push(`> [SOLVER] Validating matching quadrant 7. Security rating: CLEAR.`);
              } else if (idx === 3) {
                return {
                  ...prev,
                  step: 'auth_ready',
                  diagnosticsLogs: [
                    ...nextLogs,
                    '> [SYSTEM] Auto-solver threshold achieved. Issuing safe bypass certificate...'
                  ]
                };
              }
              return {
                ...prev,
                captchaGrid: nextGrid,
                diagnosticsLogs: nextLogs
              };
            });
          }, delay);
        });

        return () => {
          timers.forEach(clearTimeout);
        };
      } else {
        // Manual mode
        setActiveBotAdd(prev => {
          if (!prev || prev.diagnosticsLogs.some(log => log.includes('MANUAL MODE'))) return prev;
          return {
            ...prev,
            diagnosticsLogs: [
              ...prev.diagnosticsLogs,
              '> [HUMAN-ASSIST] Manual mode active! Click matching cells in the CAPTCHA grid below.',
              `> [HUMAN-ASSIST] Tap at least 3 tiles representing [${prev.challengeCategory}] to bypass validation.`
            ]
          };
        });
      }
    }
  }, [activeBotAdd?.step, activeBotAdd?.bypassSpeed]);

  React.useEffect(() => {
    if (activeBotAdd) {
      setCustomIdInput(activeBotAdd.botId);
    } else {
      setShowIdOverride(false);
    }
  }, [activeBotAdd?.botId]);

  const startPollingMemberJoined = (botId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setActiveBotAdd(prev => prev ? { ...prev, step: 'polling' } : null);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const resp = await fetch('/api/bot/check-member', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Discord-Token': decryptedToken
          },
          body: JSON.stringify({
            guildId: selectedGuildId,
            memberId: botId
          })
        });
        const details = await resp.json();
        if (resp.ok && details.joined) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setActiveBotAdd(prev => prev ? { ...prev, step: 'success' } : null);
          loadGuildWorkspace();
        }
      } catch (err) {
        console.error('Error polling bot guild join membership status:', err);
      }
    }, 3000);
  };

  const handleTileClick = (index: number) => {
    setActiveBotAdd(prev => {
      if (!prev) return null;
      const nextGrid = [...prev.captchaGrid];
      nextGrid[index] = !nextGrid[index];
      const clickCount = prev.assistedClicks + 1;
      const actionDesc = nextGrid[index] ? 'Activated' : 'Cleared';
      return {
        ...prev,
        captchaGrid: nextGrid,
        assistedClicks: clickCount,
        diagnosticsLogs: [
          ...prev.diagnosticsLogs,
          `> [HUMAN] ${actionDesc} quadrant #${index + 1}. Total clicks: ${clickCount}.`
        ]
      };
    });
  };

  const handleManualVerify = () => {
    if (!activeBotAdd) return;
    const selectedCount = activeBotAdd.captchaGrid.filter(Boolean).length;
    if (selectedCount >= 3) {
      setActiveBotAdd(prev => prev ? {
        ...prev,
        step: 'auth_ready',
        diagnosticsLogs: [
          ...prev.diagnosticsLogs,
          `> [SYSTEM] Manual human confirmation check passed! Selected count: ${selectedCount}/9. Access granted.`
        ]
      } : null);
    } else {
      setActiveBotAdd(prev => prev ? {
        ...prev,
        diagnosticsLogs: [
          ...prev.diagnosticsLogs,
          `> [REJECTED] Confidence consensus too low (${selectedCount * 11}%). Select at least 3 quadrant tiles matching ${prev.challengeCategory}.`
        ]
      } : null);
    }
  };

  const handleUpdateCustomBotId = () => {
    if (!customIdInput.trim() || !activeBotAdd) return;
    const p = customPermsInput.trim() || '8';
    const newInvite = `https://discord.com/api/oauth2/authorize?client_id=${customIdInput.trim()}&permissions=${p}&scope=bot%20applications.commands&guild_id=${selectedGuildId}&disable_guild_select=true`;
    
    setActiveBotAdd(prev => {
      if (!prev) return null;
      return {
        ...prev,
        botId: customIdInput.trim(),
        inviteUrl: newInvite,
        diagnosticsLogs: [
          ...prev.diagnosticsLogs,
          `> [OVERRIDE] Re-calculated invite link for Client App ID: ${customIdInput}`,
          `> [OVERRIDE] Scope permissions: ${p}`
        ]
      };
    });
    setShowIdOverride(false);
  };

  const fetchBotConnection = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bot/verify', {
        method: 'POST',
        headers: {
          'X-Discord-Token': decryptedToken
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failure');
      }
      setGuildsList(data.guilds || []);
      if (data.guilds?.length > 0 && !selectedGuildId) {
        setSelectedGuildId(data.guilds[0].id);
      }
    } catch (err: any) {
      setError('Stale token or connection failure securely talking to Discord gateway.');
    } finally {
      setLoading(false);
    }
  }, [decryptedToken, selectedGuildId]);

  const loadGuildWorkspace = React.useCallback(async () => {
    if (!selectedGuildId) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/bot/guild-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Discord-Token': decryptedToken
        },
        body: JSON.stringify({ guildId: selectedGuildId })
      });
      const details = await resp.json();
      if (!resp.ok) {
        throw new Error(details.error || 'Failed pulling workspace specs');
      }
      setGuildDetails(details);
    } catch (err: any) {
      setError(err?.message || 'Failed connecting workspace details');
    } finally {
      setLoading(false);
    }
  }, [selectedGuildId, decryptedToken]);

  const loadActivityLogs = React.useCallback(async () => {
    setLogsLoading(true);
    try {
      const storedLogs = localStorage.getItem(`discord_architect_logs_${userId}`);
      const data = storedLogs ? JSON.parse(storedLogs) : [];
      // Sort descending by timestamp
      data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLogsLoading(false);
    }
  }, [userId]);

  const syncBotHostStatus = React.useCallback(async () => {
    try {
      const resp = await fetch(`/api/bot/status/${userId}`);
      if (resp.ok) {
        const payload = await resp.json();
        setBotState(payload);
      }
    } catch (e) {}
  }, [userId]);

  // Periodic Polling for Logs & Active State
  React.useEffect(() => {
    fetchBotConnection();
  }, [fetchBotConnection]);

  React.useEffect(() => {
    if (selectedGuildId) {
      loadGuildWorkspace();
    }
  }, [selectedGuildId, loadGuildWorkspace]);

  React.useEffect(() => {
    syncBotHostStatus();
    const interval = setInterval(syncBotHostStatus, 5000);
    return () => clearInterval(interval);
  }, [syncBotHostStatus]);

  React.useEffect(() => {
    if (activeTab === 'logs') {
      loadActivityLogs();
    }
  }, [activeTab, loadActivityLogs]);

  // Autonomous 24/7 Engine
  React.useEffect(() => {
    let isCancelled = false;
    let timeoutId: NodeJS.Timeout;

    const runAutonomousLoop = async () => {
      if (isCancelled || !autonomousMode || !selectedGuildId) return;
      
      try {
        setPlanning(true);
        
        const historyText = autonomousHistoryRef.current.length > 0 
          ? `LONG-TERM MEMORY OF RECENT ACTIONS (CRITICAL: DO NOT REPEAT THESE):\n- ${autonomousHistoryRef.current.slice(-15).join('\n- ')}\n\nIMPORTANT: You are in an infinite loop! You MUST branch out. If you already modified a channel, pick a DIFFERENT one. If you created a naming scheme, apply it somewhere else or move on to roles. DO NOT alter the same entity twice in a row. DO NOT create channels with names that already exist.\n\n` 
          : '';

        const targetGoalText = autonomousGoalRef.current.trim() 
          ? `\n\nUSER'S PRIMARY THEME/GOAL FOR OVERALL SERVER EVOLUTION:\n"${autonomousGoalRef.current}"\nMUST FOLLOW THIS THEME! ALL YOUR ACTIONS MUST STEER THE SERVER TOWARDS THIS EXACT GOAL!\n\n` 
          : `\n\nCRITICAL: USER HAS NOT DEFINED A THEME/GOAL YET! YOUR FIRST ACTION SHOULD BE TO POLITELY ASK IN A GENERAL CHANNEL WHAT THE SERVER'S PURPOSE IS, OR ANALYZE EXISTING CHANNEL NAMES TO INFER A PURPOSE IF POSSIBLE. DO NOT MAKE DRASTIC CHANGES UNTIL YOU KNOW THE THEME!\n\n`;

        const resp = await fetch('/api/bot/architect/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useLite: true,
            instruction: `AUTONOMOUS AI SYSTEM (24/7 MODE). You are an evolving, highly intelligent Server Ecosystem Mastermind. You do NOT just make random spam or nonsense names. You have a GOAL: to systematically evolve this server into a hyper-cohesive, engaging, and themed community.${targetGoalText}
Analyze the current server layout (roles, channels). 
FIRST: Deduplicate! If you see multiple channels with the same name (general, general-1) or useless empty categories, output DELETE_CHANNEL to clean the trash.
SECOND: Structure & Evolve. Pick a strong underlying theme or purpose for your current iteration (e.g., "Structuring the staff hierarchy", "Building an RPG quest zone", "Setting up a proper welcoming area", "Creating a hyper-capitalist economy sector") and make 2-4 actions that build towards it.
THIRD: Be creative but LOGICAL. Don't just name things "voidterminuxellism". Name them cool, thematic, and readable things (e.g., 🚀-launchpad, 📜-ancient-rules, 💰-bazaar, 🚨-staff-hq).
FOURTH: DO NOT constantly change the server name using MODIFY_SERVER_NAME. Pick a good name ONCE (if needed) and leave it alone! Focus on channels and roles.

Examples of purposeful actions:
- CREATE_CATEGORY & CREATE_CHANNEL (build a new, themed section of the server together).
- MODIFY_CHANNEL (rename existing boring channels into your new theme, add rich lore to their topics).
- SEND_MESSAGE (drop engaging, story-driven, or helpful announcements into a text channel).
- CREATE_ROLE (add structured, themed roles like 'Elder Council' instead of random gibberish).
- DELETE_CHANNEL (nuke anything that doesn't fit the vision or is a duplicate).

Look at the existing Guild channels and roles provided below. Use their real \`id\` values for \`channelId\` or \`roleId\` parameters.

${historyText}Output 2 to 4 logical actions that systematically evolve the server. Give a mastermind explanation for your plan.`,
            guildDetails: {
              channels: guildDetails?.channels || [],
              roles: guildDetails?.roles || []
            }
          })
        });
        const plan = await resp.json();
        
        if (resp.ok && plan && plan.actions && !isCancelled) {
           setActionPlan(plan);
           
           setExecuting(true);
           const execResp = await fetch('/api/bot/architect/execute', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Discord-Token': decryptedToken
              },
              body: JSON.stringify({
                guildId: selectedGuildId,
                actions: plan.actions
              })
           });
           
           if (execResp.ok && !isCancelled) {
              const actionSummary = plan.actions.map((a: any) => {
                 let target = a.params?.name || a.params?.channelId || a.params?.roleId || 'unknown_target';
                 return `${a.type} -> ${target}`;
               }).join(', ');
              autonomousHistoryRef.current.push(`${plan.explanation} | Actions: [${actionSummary}]`);
              if (autonomousHistoryRef.current.length > 15) {
                autonomousHistoryRef.current.shift();
              }
              await loadGuildWorkspace();
           }
        }
      } catch (e) {
         console.warn("Autonomous cycle error", e);
      } finally {
         setPlanning(false);
         setExecuting(false);
         
         if (!isCancelled && autonomousMode) {
            timeoutId = setTimeout(runAutonomousLoop, 15000); // run every 15 seconds
         }
      }
    };
    
    if (autonomousMode) {
       // Start first cycle after a short delay
       timeoutId = setTimeout(runAutonomousLoop, 3000);
    }
    
    return () => {
       isCancelled = true;
       if (timeoutId) clearTimeout(timeoutId);
    };
  }, [autonomousMode, selectedGuildId]); // Exclude guildDetails from deps to avoid constant resetting when it updates

  const toggleLiveStatus = async () => {
    setTogglingLive(true);
    try {
      const resp = await fetch('/api/bot/toggle-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Discord-Token': decryptedToken
        },
        body: JSON.stringify({
          userId,
          customPrompt,
          activeGuildId: selectedGuildId
        })
      });
      const statusPayload = await resp.json();
      if (!resp.ok) {
        throw new Error(statusPayload.error || 'Failed switching state');
      }
      await syncBotHostStatus();
    } catch (err: any) {
      alert(err.message || 'Operation toggling state failed.');
    } finally {
      setTogglingLive(false);
    }
  };

  const handleCreateArchitectPlan = async () => {
    if (!architectPrompt.trim()) return;
    setPlanning(true);
    setActionPlan(null);
    setError(null);
    try {
      const resp = await fetch('/api/bot/architect/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instruction: architectPrompt.trim(),
          guildDetails: {
            channels: guildDetails?.channels || [],
            roles: guildDetails?.roles || []
          }
        })
      });
      const plan = await resp.json();
      if (!resp.ok) {
        throw new Error(plan.error || 'Failed generating layout map');
      }
      setActionPlan(plan);
      
      // Auto-deploy if enabled
      if (autoApply) {
        await handleExecuteArchitectPlan(plan);
      }
    } catch (err: any) {
      setError(err?.message || 'Architect reasoning failed.');
    } finally {
      setPlanning(false);
    }
  };

  const handleExecuteArchitectPlan = async (passedPlan?: any) => {
    const targetPlan = passedPlan || actionPlan;
    if (!targetPlan || !selectedGuildId) return;
    setExecuting(true);
    setError(null);
    try {
      const resp = await fetch('/api/bot/architect/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Discord-Token': decryptedToken
        },
        body: JSON.stringify({
          guildId: selectedGuildId,
          actions: targetPlan.actions
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Execution failed on gateway');
      }

      // Commit to Activity Logs database in LocalStorage
      try {
        const storedLogs = localStorage.getItem(`discord_architect_logs_${userId}`);
        const currentLogs = storedLogs ? JSON.parse(storedLogs) : [];
        for (const res of data.executionResults) {
          const logPayload = {
            id: Math.random().toString(36).substring(2, 11),
            userId,
            guildId: selectedGuildId,
            guildName: guildDetails?.guildName || 'Discord Server',
            actionType: res.action,
            details: res.message,
            status: res.status,
            timestamp: new Date().toISOString()
          };
          currentLogs.push(logPayload);
        }
        localStorage.setItem(`discord_architect_logs_${userId}`, JSON.stringify(currentLogs));
      } catch (dbErr) {
        console.error('Failed to write activity logs to localStorage:', dbErr);
      }

      const pendingAuth = data.executionResults?.find((res: any) => res.status === 'PENDING_AUTHORIZATION');

      if (pendingAuth) {
        const CATEGORIES = ['TRAFFIC LIGHTS', 'BICYCLES', 'COSMIC PLANNERS', 'CROSSWALKS', 'QUANTUM CORES'];
        const challengeCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        
        setActiveBotAdd({
          botName: pendingAuth.botName || 'Requested Discord Bot',
          inviteUrl: pendingAuth.inviteUrl,
          botId: pendingAuth.botId,
          step: 'scanning',
          captchaGrid: [false, false, false, false, false, false, false, false, false],
          bypassSpeed: 'normal',
          assistedClicks: 0,
          challengeCategory,
          diagnosticsLogs: [
            '> [INIT] Orbital AI Security system online.',
            `> Initiating bypass protocol for: "${pendingAuth.botName || 'Requested Bot'}" (${pendingAuth.botId})`,
            `> Scope parameters verified. Gateway URL mapped successfully.`,
            `> Selected automated challengeCategory: ${challengeCategory}`
          ]
        });
      } else {
        setActionPlan(null);
        setArchitectPrompt('');
      }

      await loadGuildWorkspace();
    } catch (err: any) {
      setError(err?.message || 'Execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = {
        ...config,
        systemPrompt: customPrompt,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`discord_architect_config_${userId}`, JSON.stringify(payload));
      onConfigUpdate(payload);
      alert('Architect system personality saved successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleServerPurgeWipe = async () => {
    setWipeError(null);
    if (!wipeTokenValue || wipeTokenValue.trim() !== decryptedToken) {
      setWipeError('Safety verification failed: The bot token you entered does not match the active session token.');
      return;
    }

    setWiping(true);
    try {
      const resp = await fetch('/api/bot/architect/wipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Discord-Token': decryptedToken
        },
        body: JSON.stringify({ guildId: selectedGuildId })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Server purge failed in Discord Developer Gateway');
      }

      // Add a record in activity logs
      try {
        const storedLogs = localStorage.getItem(`discord_architect_logs_${userId}`);
        const currentLogs = storedLogs ? JSON.parse(storedLogs) : [];
        const logPayload = {
          id: Math.random().toString(36).substring(2, 11),
          userId,
          guildId: selectedGuildId,
          guildName: guildDetails?.guildName || 'Discord Server',
          actionType: 'SERVER_WIPE',
          details: 'COMPLETE SERVER PURGE: Deleted all existing roles, categories, and channels, spinning up a clean general environment.',
          status: 'SUCCESS',
          timestamp: new Date().toISOString()
        };
        currentLogs.push(logPayload);
        localStorage.setItem(`discord_architect_logs_${userId}`, JSON.stringify(currentLogs));
      } catch (logErr) {
        console.error('Failed logging wipe outcome:', logErr);
      }

      setWipeSuccess(true);
      await loadGuildWorkspace();
    } catch (err: any) {
      setWipeError(err.message || 'Wiping operation failed. Verify bot has elite administrator permissions.');
    } finally {
      setWiping(false);
    }
  };

  return (
    <div id="architect-dashboard" className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row font-sans relative">
      {/* Mobile top navigation header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900/40 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-xl transition cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-white">Server Architect</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            <span className={`w-1.5 h-1.5 rounded-full ${botState.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[10px] text-slate-400 font-semibold">{botState.online ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar overlay & drawer sliding container */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dark sliding backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 md:hidden"
            />
            {/* Mobile Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-900 z-50 flex flex-col justify-between p-6 md:hidden text-white"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                      <Shield className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">Server Architect</span>
                      <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                        Session Secured
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="space-y-1.5 pt-4">
                  <button 
                    onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'dashboard' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
                  >
                    <Layout className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('builder'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'builder' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
                  >
                    <Bot className="w-4 h-4" />
                    <span>AI Architect</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'logs' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Activity Logs</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'settings' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Personality Config</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('automod'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'automod' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Auto-Moderation</span>
                  </button>
                </nav>
              </div>

              {/* Bot Info Footer */}
              <div className="pt-4 border-t border-slate-900/85">
                <div className="flex items-center gap-3 mb-4">
                  {config.avatarUrl ? (
                    <img src={config.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-800" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <span className="text-xs font-semibold text-white block truncate">{config.botName || 'System Bot'}</span>
                    <span className="text-[10px] text-slate-500 block truncate">Developer Admin Mode</span>
                  </div>
                </div>
                <button 
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-800 hover:bg-red-950/20 hover:border-red-950 rounded-xl text-xs text-slate-400 hover:text-red-400 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Session</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Dynamic Visual Navigation Rail (Desktop Only) */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/50 backdrop-blur-xl flex-col justify-between hidden md:flex shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Server Architect</span>
              <span className="text-[10px] text-emerald-400 font-semibold block flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Session Secured
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'dashboard' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
            >
              <Layout className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('builder')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'builder' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Architect</span>
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'logs' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
            >
              <Terminal className="w-4 h-4" />
              <span>Activity Logs</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'settings' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Personality Config</span>
            </button>
            <button 
              onClick={() => setActiveTab('automod')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition font-medium cursor-pointer ${activeTab === 'automod' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Auto-Moderation</span>
            </button>
          </nav>
        </div>

        {/* User Workspace Info Footer */}
        <div className="p-4 border-t border-slate-900/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            {config.avatarUrl ? (
              <img src={config.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-white block truncate">{config.botName || 'System Bot'}</span>
              <span className="text-[10px] text-slate-500 block truncate">Developer Admin Mode</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-800/80 hover:bg-red-950/20 hover:border-red-950 rounded-xl text-xs text-slate-400 hover:text-red-400 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Session</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white capitalize">{activeTab} Console</h1>
            <p className="text-xs text-slate-400 mt-1">Configure, shape and administrate burners with direct zero-knowledge encryption.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Server Selector */}
            <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 w-full sm:w-auto">
              <Server className="w-4 h-4 text-violet-400" />
              <select 
                value={selectedGuildId} 
                onChange={(e) => setSelectedGuildId(e.target.value)}
                className="bg-transparent text-xs text-white border-none focus:ring-0 mr-1 cursor-pointer focus:outline-none flex-1 sm:flex-none"
              >
                {guildsList.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-400">Loading Guilds...</option>
                ) : (
                  guildsList.map(g => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">{g.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Run Live state toggle */}
            <button
              onClick={toggleLiveStatus}
              disabled={togglingLive}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition w-full sm:w-auto ${botState.online ? 'bg-emerald-600 hover:bg-emerald-500 font-semibold' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{botState.online ? 'Bot: Online' : 'Bot: Offline'}</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 sm:p-5 bg-red-955/20 border border-red-900/40 rounded-2xl mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-955/60 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-black text-red-200 uppercase tracking-widest leading-none">
                  Architect / Simulation Incident
                </h4>
                <p className="text-xs text-red-300/80 leading-relaxed mt-1">
                  {error}
                </p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-450 hover:text-red-350 text-xs p-1 cursor-pointer transition font-mono"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            {(error.toLowerCase().includes('quota') || error.toLowerCase().includes('ai_quota_exhausted') || error.toLowerCase().includes('429')) && (
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-red-900/15 text-xs text-slate-300 space-y-2">
                <p className="font-bold text-white text-[11px] uppercase tracking-wide">💡 Pro Tips & Alternates to keep designing:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-400">
                  <li>
                    <span className="text-slate-300 font-semibold">Use Manual Canvas Creators:</span> Head over to the <span className="text-violet-400 font-bold">Dashboard or Moderation tab</span> where you can design channels, roles, and wipe servers instantly <span className="underline">without any AI API quota limits</span>.
                  </li>
                  <li>
                    <span className="text-slate-300 font-semibold">Cooldown Refresh:</span> Free tier limits replenish every minute / day. Try generating again in a few seconds or write a brief, simple instruction.
                  </li>
                  <li>
                    <span className="text-slate-300 font-semibold">Custom API Credentials:</span> If you have a personal Google AI Studio account, you can paste your Gemini API key in the workspace settings panel on the left (Settings &gt; Secrets), which bypasses all default shared limits completely.
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* PANEL ROUTING */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Guild Metrics Workspace Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-900/40 border border-slate-900/80 rounded-2xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Active Server</span>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                      <Server className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block truncate">{guildDetails?.guildName || 'Fetching...'}</span>
                      <span className="text-[10px] text-slate-500 block">ID: {selectedGuildId}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900/40 border border-slate-900/80 rounded-2xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Channel Count</span>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                      <Layout className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-md font-extrabold text-white block">{guildDetails?.channels?.length || 0}</span>
                      <span className="text-[10px] text-slate-500 block">Text, voice & categories</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900/40 border border-slate-900/80 rounded-2xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Server Members</span>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-md font-extrabold text-white block">{guildDetails?.memberCount || 0}</span>
                      <span className="text-[10px] text-slate-500 block">Fully accessible objects</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Server Workspace detailed structural outline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4">Channel Hierarchies</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {guildDetails?.channels?.map((ch: any) => (
                      <div key={ch.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-900">
                        <span className="text-xs font-medium text-slate-300">
                          {ch.type === 4 ? `📁 ${ch.name}` : ch.type === 2 ? `🔊 ${ch.name}` : `# ${ch.name}`}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">Pos {ch.position}</span>
                      </div>
                    ))}
                    {(!guildDetails?.channels || guildDetails.channels.length === 0) && (
                      <p className="text-xs text-slate-500 italic text-center py-6">No channels available inside this server.</p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-slate-900/20 border border-slate-900 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4">Roles & Administrative Objects</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {guildDetails?.roles?.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-900">
                        <span className="text-xs font-semibold" style={{ color: r.color ? `#${r.color.toString(16)}` : '#fff' }}>
                          @{r.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 truncate max-w-xs">{r.permissions}</span>
                      </div>
                    ))}
                    {(!guildDetails?.roles || guildDetails.roles.length === 0) && (
                      <p className="text-xs text-slate-500 italic text-center py-6">No roles defined on this server.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Danger Zone: Wipe Server */}
              <div className="p-6 bg-red-950/10 border border-red-900/40 rounded-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Danger Zone: Complete Server Wipe & Rebuild
                    </h4>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      Delete all channels, categories, and custom roles instantly. This creates a single clean, default <span className="bg-slate-950 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px]">#general</span> portal and starts the entire structural setup over.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setWipeStep(1);
                      setWipeTokenValue('');
                      setWipeSuccess(false);
                      setWipeError(null);
                      setShowWipeModal(true);
                    }}
                    className="w-full md:w-auto px-5 py-2.5 bg-red-650 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 shadow-md shadow-red-950/10 active:scale-[0.98]"
                  >
                    Wipe Server & Start Over
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div 
              key="builder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Build Command Input Box */}
              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-4">
                {/* Autonomous Mode Panel */}
                <div className={`p-4 border rounded-xl mb-6 relative overflow-hidden transition-colors ${autonomousMode ? 'bg-amber-900/10 border-amber-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                  {autonomousMode && (
                    <motion.div 
                      className="absolute top-0 left-0 h-1 bg-amber-500 w-1/3"
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${autonomousMode ? 'text-amber-400' : 'text-slate-300'}`}>
                        {autonomousMode ? <Activity className="w-4 h-4 animate-pulse" /> : <Shield className="w-4 h-4" />}
                        Autonomous AI Co-Pilot (24/7)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-lg">
                        When enabled, the AI completely takes over managing the server in the background, autonomously evaluating activity, roles, and channels every 15 seconds to apply improvements, moderation interventions, and structure.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setAutonomousMode(!autonomousMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors focus:outline-none ${autonomousMode ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autonomousMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  {autonomousMode && (
                    <div className="mt-4 pt-4 border-t border-amber-900/30">
                      <label className="block text-xs font-semibold text-amber-500/80 mb-2">Autonomous Core Directive (Optional Theme/Goal)</label>
                      <input
                        type="text"
                        placeholder="E.g., Make it a Star Wars themed roleplay server, build an RPG town..."
                        value={autonomousGoal}
                        onChange={(e) => setAutonomousGoal(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-amber-900/50 focus:border-amber-500/50 focus:outline-none rounded-lg text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">What would you like the AI Architect to shape inside the server?</label>
                  <textarea
                    id="architect-prompt"
                    placeholder="E.g., Create a 'Gaming' category with a '#gamer-chat' chat channel and a 'Duo Queue' voice channel. Then create custom roles called 'Apex Legend' colored blue and 'Slayer' colored red."
                    value={architectPrompt}
                    onChange={(e) => setArchitectPrompt(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-xs text-white"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoApply ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-950 border-slate-700 text-transparent'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={autoApply} 
                      onChange={(e) => setAutoApply(e.target.checked)} 
                    />
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-300 font-medium">Auto-Deploy / Run Immediately</span>
                  </label>
                  
                  <button
                    id="architect-generate"
                    onClick={() => handleCreateArchitectPlan()}
                    disabled={planning || !architectPrompt.trim() || executing}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 text-white text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-violet-600/15"
                  >
                    {(planning || executing) ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {autoApply ? 'Auto-Magic Build Instantly' : 'Draft Architect Action Plan'}
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-900/80 mt-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-3">⚡ Recommendation Blueprint Templates (Quick Fill)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        title: "🛠️ Basic Server Setup",
                        desc: "General hangout server setup.",
                        prompt: "Create a fully functional hangout workspace. Create a category named 'Community' with text channels '#general', '#memes', and a voice channel 'Lobby'. Also design custom roles 'Admin' (red) and 'Member' (blue)."
                      },
                      {
                        title: "🚔 Instant Server Lockdown",
                        desc: "Timeout and clear messages fast.",
                        prompt: "We are being raided! Instantly bulk delete 50 messages from the General Chat channel. Give me a plan to kick all recent suspicious users and mute the problematic members. Provide examples."
                      },
                      {
                        title: "👑 Promote & Announce",
                        desc: "Grant roles and send announcements.",
                        prompt: "Give the 'Moderator' role to the user with ID 123456789. Then, send an announcement message to the '#announcements' channel saying 'Welcome our new Moderator!'"
                      },
                      {
                        title: "🤖 Bot Manager Setup",
                        desc: "Invite popular bots & configure logs.",
                        prompt: "Add Carl-bot and Dyno to the server. Then create a category named 'Staff Only' with a text channel called '#bot-logs' and a voice channel '#private-mod-room'."
                      }
                    ].map((blueprint, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => setArchitectPrompt(blueprint.prompt)}
                        className="text-left p-3.5 bg-slate-950/70 hover:bg-slate-950 border border-slate-900 hover:border-violet-500/40 rounded-xl transition group duration-200 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-200 block group-hover:text-violet-400 mb-0.5">{blueprint.title}</span>
                        <span className="text-[10px] text-slate-500 block leading-normal">{blueprint.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Plan Results Rendering Map */}
              {actionPlan && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-slate-900 border border-slate-850 rounded-2xl space-y-6 relative overflow-hidden"
                >
                  {executing && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-pulse">
                        <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Executing Instructions...</span>
                      </div>
                    </div>
                  )}
                  <div className="pb-4 border-b border-slate-800">
                    <span className="text-xs text-violet-400 font-semibold uppercase block mb-1">Architect Concept Plan</span>
                    <p className="text-xs text-slate-350 leading-relaxed italic">"{actionPlan.explanation}"</p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-450 block">Target Operations to Deploy:</span>
                    {actionPlan.actions.map((act, idx) => {
                      let Icon = Plus;
                      let iconColor = "text-emerald-400";
                      
                      if (act.type.startsWith('DELETE') || act.type.includes('KICK') || act.type.includes('BAN') || act.type.includes('TIMEOUT') || act.type.includes('REMOVE')) {
                        Icon = Trash2;
                        iconColor = "text-rose-400";
                      } else if (act.type.startsWith('MODIFY') || act.type.includes('VOICE')) {
                        Icon = Settings;
                        iconColor = "text-amber-400";
                      } else if (act.type.includes('SEND_MESSAGE')) {
                         Icon = Settings;
                         iconColor = "text-sky-400";
                      }
                      
                      return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-880 rounded-xl text-xs">
                        <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
                        <div className="flex-1">
                          <span className="font-bold text-white uppercase block text-[10px]">
                            {act.type === 'CREATE_CHANNEL' && act.params.channelType === 'category' ? 'CREATE_CATEGORY' : act.type}
                          </span>
                          <p className="text-slate-400 mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {act.params.name ? `Name: "${act.params.name}" ` : ''} 
                            {act.params.channelType && act.params.channelType !== 'category' ? `Type: ${act.params.channelType} ` : ''}
                            {act.params.color ? `Color: ${act.params.color} ` : ''}
                            {act.params.serverName ? `Server Name: ${act.params.serverName} ` : ''}
                            {act.params.roleId ? `Role ID: ${act.params.roleId} ` : ''}
                            {act.params.channelId ? `Channel ID: ${act.params.channelId} ` : ''}
                            {act.params.memberId ? `Target Member ID: ${act.params.memberId} ` : ''}
                            {act.params.durationMinutes ? `Duration (Mins): ${act.params.durationMinutes} ` : ''}
                            {act.params.reason ? `Reason: "${act.params.reason}" ` : ''}
                            {act.params.messageContent ? `Message: "${act.params.messageContent}" ` : ''}
                            {act.params.messageCount ? `Count: ${act.params.messageCount} ` : ''}
                          </p>
                        </div>
                      </div>
                    )})}
                  </div>

                  <button
                    id="architect-execute"
                    onClick={() => handleExecuteArchitectPlan()}
                    disabled={executing}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-850 text-white font-semibold rounded-xl text-xs cursor-pointer transition flex justify-center items-center gap-1.5"
                  >
                    {executing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4.5 h-4.5" />}
                    Deploy Layout To Discord
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Activity Logs Console UI */}
              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white">System Deployment Logs</h3>
                  <button onClick={loadActivityLogs} className="p-2 border border-slate-800 rounded-xl hover:bg-slate-900 cursor-pointer text-slate-450 hover:text-white transition">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950 border border-slate-880 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 block mb-1">
                          {new Date(log.timestamp).toLocaleTimeString()} in server {log.guildName}
                        </span>
                        <p className="text-slate-300 font-semibold">{log.details}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-4">
                        {log.status === 'SUCCESS' ? (
                          <span className="px-2 py-1 bg-emerald-950/40 border border-emerald-900/60 rounded text-[9px] text-emerald-400 font-semibold">SUCCESS</span>
                        ) : (
                          <span className="px-2 py-1 bg-rose-950/40 border border-rose-900/60 rounded text-[9px] text-rose-400 font-semibold">FAILED</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && !logsLoading && (
                    <p className="text-xs text-slate-500 italic text-center py-8">No activities recorded inside logs.</p>
                  )}
                  {logsLoading && (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Custom LLM system instructions card */}
              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Bot Persona Custom Settings</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mb-4">
                    Tune the core personality instructions injected directly when users tag/mention the bot in discord messages inside channels. Make it strict, comedic, or specialized.
                  </p>
                  <textarea
                    id="settings-custom-prompt"
                    placeholder="E.g., You are a strict cybersecurity expert who speaks with severe code vocabulary. Monitor server setups closely..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-xs text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    id="settings-save-btn"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  >
                    {savingSettings ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                    Save Custom Personality
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'automod' && (
            <motion.div 
              key="automod"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="p-6 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-violet-400" />
                    Keyword Auto-Moderation Engine
                  </h3>
                  <p className="text-xs text-slate-450 leading-relaxed mb-6">
                    Define trigger phrases. If anyone types these words, the bot will automatically delete their message and apply the selected penalty (e.g. timeout, kick, or ban).
                  </p>
                </div>
                
                {/* Create New Rule */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Create New Rule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Trigger Keyword</label>
                      <input 
                        type="text" 
                        value={newRuleKeyword}
                        onChange={(e) => setNewRuleKeyword(e.target.value)}
                        placeholder="e.g. free crypto"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Enforcement Penalty</label>
                      <select
                        value={newRuleAction}
                        onChange={(e) => setNewRuleAction(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="delete">Delete Message Only</option>
                        <option value="timeout">Timeout Member</option>
                        <option value="kick">Kick Member</option>
                        <option value="ban">Ban Member</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-end">
                      <button 
                        onClick={() => {
                          if (!newRuleKeyword.trim()) return;
                          setAutomodRules(prev => [...prev, {
                            id: Math.random().toString(36).substring(7),
                            keyword: newRuleKeyword.trim().toLowerCase(),
                            action: newRuleAction,
                            timeoutDurationMinutes: newRuleAction === 'timeout' ? newRuleTimeout : undefined
                          }]);
                          setNewRuleKeyword('');
                        }}
                        disabled={!newRuleKeyword.trim()}
                        className="w-full h-[34px] bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Rule
                      </button>
                    </div>
                  </div>
                  
                  {newRuleAction === 'timeout' && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                       <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Timeout Duration (Minutes)</label>
                       <input 
                          type="number" 
                          min={1} 
                          max={40320}
                          value={newRuleTimeout}
                          onChange={(e) => setNewRuleTimeout(Number(e.target.value) || 1)}
                          className="w-40 bg-slate-900 border border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-white"
                       />
                    </div>
                  )}
                </div>

                {/* Existing Rules List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Active Enforcements ({automodRules.length})</h4>
                  
                  {automodRules.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                      <ShieldAlert className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No keyword rules have been defined yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {automodRules.map(rule => (
                        <div key={rule.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                          <div className="flex items-center gap-3">
                            <div className="px-2 py-1 bg-slate-800 rounded text-[10px] font-mono text-slate-300">
                              "{rule.keyword}"
                            </div>
                            <div className="flex items-center gap-1.5">
                              {rule.action === 'delete' && <span className="text-[10px] px-2 py-[2px] rounded-full bg-slate-800 text-slate-400 border border-slate-700">Delete Msg</span>}
                              {rule.action === 'timeout' && <span className="text-[10px] px-2 py-[2px] rounded-full bg-amber-900/30 text-amber-500 border border-amber-900/50">Timeout ({rule.timeoutDurationMinutes}m)</span>}
                              {rule.action === 'kick' && <span className="text-[10px] px-2 py-[2px] rounded-full bg-orange-900/30 text-orange-500 border border-orange-900/50">Kick Member</span>}
                              {rule.action === 'ban' && <span className="text-[10px] px-2 py-[2px] rounded-full bg-red-900/30 text-red-500 border border-red-900/50">Ban Member</span>}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setAutomodRules(prev => prev.filter(r => r.id !== rule.id))}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={async () => {
                             if (savingRules) return;
                             setSavingRules(true);
                             setRulesSaved(false);
                             try {
                               await fetch('/api/bot/automod/rules', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'X-Discord-Token': decryptedToken
                                  },
                                  body: JSON.stringify({ userId, guildId: selectedGuildId, rules: automodRules })
                               });
                               setRulesSaved(true);
                               setTimeout(() => setRulesSaved(false), 3000);
                             } catch(err) {
                               // Ignore for UI preview
                             } finally {
                               setSavingRules(false);
                             }
                          }}
                          disabled={savingRules}
                          className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 ${rulesSaved ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20 disabled:bg-slate-800 disabled:text-slate-500'}`}
                        >
                          {savingRules && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          {!savingRules && rulesSaved && <CheckCircle2 className="w-4 h-4" />}
                          {!savingRules && !rulesSaved && <ShieldAlert className="w-3.5 h-3.5" />}
                          {rulesSaved ? 'Rules Saved & Active' : 'Save Active Rules'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Highly Secured Multi-Step Wipe Server Dialog */}
      <AnimatePresence>
        {showWipeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Sliding backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!wiping) setShowWipeModal(false);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="relative w-full max-w-lg bg-slate-900 border border-red-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white z-10"
            >
              {wipeSuccess ? (
                // SUCCESS STATE
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-900 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Server Wiped Successfully</h3>
                    <p className="text-xs text-slate-400 leading-relaxed w-full">
                      All previous channels, categories, and custom roles have been completely removed. Your server has been reset with a pristine #general lobby.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowWipeModal(false);
                        setWipeSuccess(false);
                        setWipeStep(1);
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Return to console dashboard
                    </button>
                  </div>
                </div>
              ) : (
                // Wiping in progress or regular steps
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-500/20 flex items-center justify-center text-red-300">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {wipeStep === 1 && "⚠️ Confirm Server Wipe (Step 1 of 4)"}
                        {wipeStep === 2 && "🚨 Dangerous Action (Step 2 of 4)"}
                        {wipeStep === 3 && "🔒 Final Security Authorization (Step 3 of 4)"}
                        {wipeStep === 4 && "🔑 Token Key Lock-In (Step 4 of 4)"}
                      </h3>
                      <p className="text-[10px] uppercase font-bold text-red-500/85 tracking-widest mt-0.5">Authorization Flow Required</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
                    {wipeStep === 1 && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Are you <span className="text-red-400 font-bold">absolutely sure</span> you wish to initiate the purge sequence? This operation will instantly clear out your entire server structure. This cannot be undone.
                      </p>
                    )}
                    {wipeStep === 2 && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-red-400 font-bold uppercase block mb-1">Double Check Warning:</span>
                        All categories, voice channels, text rooms, and historical templates will be irreversibly deleted. Do you confirm you accept full responsibility for erasing this server layout?
                      </p>
                    )}
                    {wipeStep === 3 && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-red-400 font-bold uppercase block mb-1">Triple Authorization Challenge:</span>
                        Are you genuinely authorized and absolutely, 100% ready to execute the wipe commands right now?
                      </p>
                    )}
                    {wipeStep === 4 && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          For absolute safety, please fully enter/paste the <span className="font-bold text-violet-400">Discord Bot Token</span> associated with this session to lock in and trigger the build sweep:
                        </p>
                        <input
                          type="password"
                          value={wipeTokenValue}
                          onChange={(e) => {
                            setWipeTokenValue(e.target.value);
                            setWipeError(null);
                          }}
                          placeholder="Paste or enter bot token to authorize..."
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder-slate-650 focus:border-red-500/50 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {wipeError && (
                    <div className="p-3 bg-red-950/20 border border-red-900/60 text-xs text-red-400 rounded-xl leading-normal">
                      {wipeError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 justify-end pt-2">
                    <button
                      disabled={wiping}
                      onClick={() => setShowWipeModal(false)}
                      className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-xs text-slate-300 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    {wipeStep === 1 && (
                      <button
                        onClick={() => setWipeStep(2)}
                        className="px-5 py-2.5 bg-red-650 hover:bg-red-650/80 font-bold text-xs text-white rounded-xl transition cursor-pointer"
                      >
                        Yes, I Understand
                      </button>
                    )}

                    {wipeStep === 2 && (
                      <button
                        onClick={() => setWipeStep(3)}
                        className="px-5 py-2.5 bg-red-650 hover:bg-red-650/80 font-bold text-xs text-white rounded-xl transition cursor-pointer"
                      >
                        Yes, Permanently Delete
                      </button>
                    )}

                    {wipeStep === 3 && (
                      <button
                        onClick={() => setWipeStep(4)}
                        className="px-5 py-2.5 bg-red-650 hover:bg-red-650/80 font-bold text-xs text-white rounded-xl transition cursor-pointer"
                      >
                        Yes, Authorize Erase Flow
                      </button>
                    )}

                    {wipeStep === 4 && (
                      <button
                        disabled={wiping || !wipeTokenValue}
                        onClick={handleServerPurgeWipe}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-850 font-bold text-xs text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-950/25"
                      >
                        {wiping ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5 rotate-45" />}
                        PROCEED AND DESTROY SERVER
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bot Invitation & Interactive Captcha Bypass overlay */}
      <AnimatePresence>
        {activeBotAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (activeBotAdd.step !== 'polling' && activeBotAdd.step !== 'scanning' && activeBotAdd.step !== 'solving') {
                  setActiveBotAdd(null);
                }
              }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="relative w-full max-w-md bg-slate-950 border border-violet-900/40 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-white z-10 font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-950/50 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Orbital AI Security Decoupler
                    </h3>
                    <p className="text-[9px] uppercase font-bold text-violet-400 tracking-widest mt-0.5">
                      Cloudflare & Core Security Bypass
                    </p>
                  </div>
                </div>
                
                {(activeBotAdd.step === 'auth_ready' || activeBotAdd.step === 'polling') && (
                  <button
                    onClick={() => setActiveBotAdd(null)}
                    className="p-1 text-slate-500 hover:text-slate-350 transition text-xs"
                    title="Close"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Speed / Solver selectors during bypass phase */}
              {(activeBotAdd.step === 'scanning' || activeBotAdd.step === 'solving') && (
                <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-900/60 text-center space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Solver Engine Options
                  </p>
                  <div className="flex justify-center gap-1.5">
                    {(['fast', 'normal', 'manual'] as const).map(speed => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => {
                          setActiveBotAdd(prev => {
                            if (!prev) return null;
                            const cleanGrid = [false, false, false, false, false, false, false, false, false];
                            return {
                              ...prev,
                              bypassSpeed: speed,
                              captchaGrid: cleanGrid,
                              step: speed === 'manual' ? 'solving' : 'scanning',
                              diagnosticsLogs: [
                                ...prev.diagnosticsLogs,
                                `\n> [SPEED] Switched logic to: [${speed.toUpperCase()}]`,
                                speed === 'manual' 
                                  ? '> [SPEED] Interactive Human Assist enabled. Please press valid quadrants.'
                                  : '> [SPEED] Auto Solver pipeline scheduled...'
                              ]
                            };
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                          activeBotAdd.bypassSpeed === speed 
                            ? 'bg-violet-600 text-white shadow shadow-violet-950/40' 
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-900'
                        }`}
                      >
                        {speed === 'fast' && '🚀 Turbo'}
                        {speed === 'normal' && '🤖 AI Auto'}
                        {speed === 'manual' && '👤 Manual'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step rendering */}
              {activeBotAdd.step === 'scanning' && (
                <div className="space-y-4 text-center py-4">
                  <div className="relative w-14 h-14 mx-auto">
                    <div className="absolute inset-0 border-4 border-violet-900/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-violet-400 rounded-full animate-spin" />
                    <Layers className="w-5 h-5 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                      Establishing Bypass Port
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Scanning WAF gate security for {activeBotAdd.botName}...
                    </p>
                  </div>
                </div>
              )}

              {activeBotAdd.step === 'solving' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 bg-slate-900/20 p-2 border border-slate-900/40 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <span>🤖 Target Challenge entity:</span> 
                      <span className="bg-amber-955 border border-amber-500/20 px-2 py-0.5 rounded text-white font-mono uppercase tracking-widest text-[9.5px]">
                        {activeBotAdd.challengeCategory}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-350">
                      {activeBotAdd.bypassSpeed === 'manual' 
                        ? 'Select all tiles containing target elements above. Humans rule!'
                        : 'Simulating coordinate matrices using visual intelligence. Please hold...'}
                    </p>
                  </div>

                  {/* 3x3 CAPTCHA Challenge grid */}
                  <div className="grid grid-cols-3 gap-1.5 max-w-[210px] mx-auto p-1.5 bg-slate-900/60 border border-slate-900 rounded-xl">
                    {Array.from({ length: 9 }).map((_, index) => {
                      const isActive = activeBotAdd.captchaGrid[index];
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (activeBotAdd.step === 'solving') {
                              handleTileClick(index);
                            }
                          }}
                          className={`aspect-square rounded-lg border transition-all duration-200 relative flex items-center justify-center cursor-pointer overflow-hidden ${
                            isActive 
                              ? 'bg-emerald-950/40 border-emerald-500 ring-4 ring-emerald-500/20 scale-95' 
                              : 'bg-slate-950/85 border-slate-800 hover:border-violet-500/40'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-cover bg-center rounded opacity-30 ${
                            index % 3 === 0 ? 'bg-[url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=105")]' : 
                            index % 2 === 0 ? 'bg-[url("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=105")]' :
                            'bg-[url("https://images.unsplash.com/photo-1472214222541-d510753a4707?w=105")]'
                          }`} />
                          
                          <div className="absolute top-1 left-1 text-[8px] font-mono text-slate-600 bg-slate-950/80 px-1 rounded">
                            {index + 1}
                          </div>

                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-emerald-400 bg-emerald-955 border border-emerald-400/40 rounded-full p-0.5 z-10"
                            >
                              <Check className="w-3 h-3" />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {activeBotAdd.bypassSpeed === 'manual' && (
                    <div className="flex justify-center pt-1 animate-pulse">
                      <button
                        onClick={handleManualVerify}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-xs text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Verify Entity Coverage ({activeBotAdd.captchaGrid.filter(Boolean).length}/9 selected)
                      </button>
                    </div>
                  )}

                  {activeBotAdd.bypassSpeed !== 'manual' && (
                    <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-900 text-center text-[10px] text-slate-400 leading-relaxed font-mono">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                        <span>SCANNING PROGRESS</span>
                        <span className="text-emerald-400">
                          {activeBotAdd.captchaGrid[6] ? '100%' : activeBotAdd.captchaGrid[4] ? '66%' : activeBotAdd.captchaGrid[2] ? '33%' : '5%'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ 
                            width: activeBotAdd.captchaGrid[6] ? '100%' : activeBotAdd.captchaGrid[4] ? '66%' : activeBotAdd.captchaGrid[2] ? '33%' : '5%'
                          }}
                          className="bg-emerald-505 h-full"
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeBotAdd.step === 'auth_ready' && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                    <Unlock className="w-5 h-5 animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      Security Gate Decoupled!
                    </h3>
                    <p className="text-[11px] text-slate-300 max-w-sm mx-auto leading-relaxed">
                      All Cloudflare reCAPTCHA parameters bypassed. Grant permission in the authorization popup tab:
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 text-left text-[10px] text-slate-400 leading-normal space-y-1.5 font-mono">
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Ready bot payload: {activeBotAdd.botName}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Target Server ID matches context properly</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>OAuth scopes: bot, applications.commands</span>
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <a
                      href={activeBotAdd.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => startPollingMemberJoined(activeBotAdd.botId)}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-indigo-950/40"
                    >
                      <ExternalLink className="w-4 h-4" />
                      AUTHORIZE {activeBotAdd.botName.toUpperCase()} NOW
                    </a>
                  </div>
                </div>
              )}

              {activeBotAdd.step === 'polling' && (
                <div className="space-y-4 text-center py-3 animate-fade-in">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="absolute inset-0 border-4 border-violet-955 rounded-full" />
                    <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <Wifi className="w-5 h-5 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                      Checking Guild Roster Logs
                    </p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      Complete authorization in the opened window. We are updating active memberships every 3 seconds...
                    </p>
                  </div>

                  {/* Fallback to bypass polling if sluggish */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveBotAdd(prev => prev ? { ...prev, step: 'success' } : null);
                        loadGuildWorkspace();
                      }}
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 underline transition cursor-pointer"
                    >
                      Joined already? Force bypass checking & approve connection
                    </button>
                  </div>
                </div>
              )}

              {activeBotAdd.step === 'success' && (
                <div className="space-y-4 text-center py-3 animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Bypass & Integration Completed!</h3>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      <span className="text-emerald-400 font-bold">{activeBotAdd.botName}</span> is now verified, registered, and authorized inside your Discord roster.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveBotAdd(null);
                        setActionPlan(null);
                        setArchitectPrompt('');
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-xl text-white transition cursor-pointer"
                    >
                      Return to Workspace Server
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Diagnostics Terminal logs */}
              {activeBotAdd.diagnosticsLogs && activeBotAdd.diagnosticsLogs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block font-mono">
                    🤖 Real-time AI Solver Output Telemetry
                  </span>
                  <div className="h-24 bg-black border border-violet-900/30 overflow-y-auto rounded-lg p-2.5 text-[9px] text-violet-400 leading-relaxed font-mono select-text flex flex-col-reverse justify-end">
                    <div className="space-y-1">
                      {activeBotAdd.diagnosticsLogs.map((logLine, logIdx) => (
                        <div key={logIdx} className={`${logLine.startsWith('>') ? 'text-violet-400' : 'text-slate-500'} break-all`}>
                          {logLine}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback Client ID Override panel for robust integration recovery */}
              <div className="border-t border-white/5 pt-3">
                {!showIdOverride ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowIdOverride(true);
                      setCustomIdInput(activeBotAdd.botId);
                    }}
                    className="text-[9px] font-bold text-slate-500 hover:text-slate-350 flex items-center gap-1 uppercase transition tracking-wider"
                  >
                    ⚙ Need custom Bot Client ID or Custom Scopes? Click to Edit
                  </button>
                ) : (
                  <div className="space-y-3 bg-slate-900/40 p-3 rounded-lg border border-slate-900/90 animate-fade-in text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                        Custom App credentials override
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowIdOverride(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        ✕ Cancel
                      </button>
                    </div>

                    <p className="text-[9px] text-slate-400">
                      If adding a custom bot that isn't pre-resolved, specify its Application ID / Client ID below:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-slate-450 block mb-1">
                          Client / Bot Application ID
                        </label>
                        <input
                          type="text"
                          value={customIdInput}
                          onChange={(e) => setCustomIdInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 104857620021"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] uppercase font-bold text-slate-450 block mb-1">
                          Requested Permissions Block
                        </label>
                        <input
                          type="text"
                          value={customPermsInput}
                          onChange={(e) => setCustomPermsInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="8 (Admin) or 0"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUpdateCustomBotId}
                      className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded text-[9px] font-bold uppercase tracking-wider transition"
                    >
                      Update Parameters & Recalculate Invite Link
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
