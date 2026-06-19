import React from 'react';
import { encryptBotToken } from '../lib/encryption';
import { Shield, Key, Eye, EyeOff, Check, Bot, AlertTriangle, ExternalLink } from 'lucide-react';
import { BotInfo } from '../types';
import { motion } from 'motion/react';

interface TokenSetupProps {
  userId: string;
  onSetupSuccess: (decryptedToken: string, config: any) => void;
  existingConfig: any | null; // Config loaded from localStorage fallback
}

export default function TokenSetup({ userId, onSetupSuccess, existingConfig }: TokenSetupProps) {
  const [botToken, setBotToken] = React.useState<string>('');
  const [showToken, setShowToken] = React.useState<boolean>(false);
  
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verifiedBot, setVerifiedBot] = React.useState<BotInfo | null>(null);

  const handleTestToken = async () => {
    if (!botToken.trim()) {
      setError('Bot token must not be empty');
      return;
    }
    setLoading(true);
    setError(null);
    setVerifiedBot(null);
    try {
      const response = await fetch('/api/bot/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Discord-Token': botToken.trim()
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid discord connection credentials');
      }
      setVerifiedBot(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Token verification failed. Please ensure the token is active and has necessary Guild gateway privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!verifiedBot) {
      setError('Please verify the bot token connection first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cipherToken = encryptBotToken(botToken.trim(), userId);

      const payload = {
        userId,
        encryptedToken: cipherToken,
        guildId: verifiedBot.guilds?.[0]?.id || existingConfig?.guildId || '',
        botName: verifiedBot.username,
        avatarUrl: verifiedBot.avatar || existingConfig?.avatarUrl || '',
        systemPrompt: existingConfig?.systemPrompt || '',
        createdAt: existingConfig?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(`discord_architect_config_${userId}`, JSON.stringify(payload));
      } catch (dbErr) {
        console.error('Failed storing config to localStorage:', dbErr);
      }

      onSetupSuccess(botToken.trim(), payload);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error occurred saving secure bot settings.');
    } finally {
      setLoading(false);
    }
  };

  // Setup wizard screen
  return (
    <div id="setup-wizard" className="max-w-xl mx-auto p-4 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mt-4 sm:mt-10">
      <div id="setup-header" className="mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-violet-400" />
          Install New Bot Assistant
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Supply a Discord Bot Token. Our AI engine securely orchestrates channels, roles, categories, and logs of actions inside your verified servers.
        </p>
      </div>

      {existingConfig && (
        <div className="flex gap-4 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl mb-6 text-xs text-emerald-300 leading-relaxed">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-1 text-white">Upgrade Active Bot</span>
            An existing bot config was found. Because we successfully simplified security to be passphrase-less, please re-enter or test your discord token to automatically link and resume using the architect.
          </div>
        </div>
      )}

      <div className="flex gap-4 p-4 bg-violet-950/20 border border-violet-550/25 rounded-xl mb-6 text-xs text-violet-300 leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-1 text-white">Pre-requisite Permissions</span>
          To manage structures and automations, create a **Discord Bot** in the Discord Developer Console, enable the **Message Content Intent**, and invite it to your target burner server with **Administrator** permissions.
          <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-400 hover:text-white ml-1.5 font-medium underline">
            Discord Dev Portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-xs text-red-500 mb-6 rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Discord Bot Token</label>
          <div className="relative">
            <input
              id="setup-token-input"
              type={showToken ? 'text' : 'password'}
              placeholder="MTExN..."
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl text-sm text-white focus:outline-none pr-12 font-mono"
            />
            <button 
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white cursor-pointer"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            id="setup-test-token"
            onClick={handleTestToken}
            disabled={loading || !botToken.trim()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg text-xs cursor-pointer transition flex items-center gap-1.5"
          >
            {loading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Test & Link Bot
          </button>
        </div>

        {verifiedBot && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4"
          >
            {verifiedBot.avatar ? (
              <img src={verifiedBot.avatar} alt="Avatar" className="w-12 h-12 rounded-full border border-violet-500/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-violet-400" />
              </div>
            )}
            <div className="flex-1">
              <span className="text-white text-sm font-semibold">{verifiedBot.username}</span>
              <p className="text-xs text-slate-400 mt-1">
                Joined: {verifiedBot.guilds?.length || 0} server(s)
              </p>
            </div>
          </motion.div>
        )}

        {verifiedBot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4 border-t border-slate-800"
          >
            <button
              id="setup-submit-save"
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-medium rounded-xl text-sm cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
              Assemble Bot & Secure Config
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
