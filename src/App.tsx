import React from 'react';
import { decryptBotToken } from './lib/encryption';
import TokenSetup from './components/TokenSetup';
import ArchitectConsole from './components/ArchitectConsole';
import { Shield } from 'lucide-react';

export default function App() {
  const [currentUser] = React.useState<any>({
    uid: 'local-user',
    email: 'local@example.com',
    emailVerified: true,
    displayName: 'Local Administrator',
  });
  const [dbConfig, setDbConfig] = React.useState<any | null>(null);
  const [configLoading, setConfigLoading] = React.useState<boolean>(true);

  // Decrypted bot token stored in local React memory for live active operations
  const [localToken, setLocalToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setConfigLoading(true);
    try {
      const storedConfig = localStorage.getItem(`discord_architect_config_${currentUser.uid}`);
      if (storedConfig) {
        const data = JSON.parse(storedConfig);
        setDbConfig(data);
        try {
          const decrypted = decryptBotToken(data.encryptedToken, currentUser.uid);
          setLocalToken(decrypted);
        } catch (decErr) {
          console.error('Auto-decryption of config failed:', decErr);
        }
      } else {
        setDbConfig(null);
      }
    } catch (err) {
      console.error('Failed to read config from localStorage', err);
    } finally {
      setConfigLoading(false);
    }
  }, [currentUser.uid]);

  const handleSetupComplete = (decryptedToken: string, updatedConfig: any) => {
    setLocalToken(decryptedToken);
    setDbConfig(updatedConfig);
  };

  const handleConfigUpdate = (updatedConfig: any) => {
    setDbConfig(updatedConfig);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem(`discord_architect_config_${currentUser.uid}`);
      setDbConfig(null);
      setLocalToken(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (configLoading) {
    return (
      <div id="loader" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans gap-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative flex justify-center items-center">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500/10 border-t-violet-400 animate-spin" />
          <Shield className="w-5 h-5 text-violet-400 absolute animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">Initializing System...</p>
      </div>
    );
  }

  // If user is authenticated, but hasn't decrypted / locked their token in the current active session
  if (!localToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-white py-6 md:py-12 px-4 md:px-6">
        <div className="max-w-xl mx-auto flex justify-between items-center mb-6 md:mb-8 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-bold">Discord Server Architect</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer transition"
          >
            Reset Console
          </button>
        </div>
        <TokenSetup 
          userId={currentUser.uid} 
          existingConfig={dbConfig} 
          onSetupSuccess={handleSetupComplete} 
        />
      </div>
    );
  }

  // Token is decrypted and session unlocked! Go directly to dashboard console
  return (
    <ArchitectConsole 
      userId={currentUser.uid} 
      decryptedToken={localToken} 
      config={dbConfig} 
      onConfigUpdate={handleConfigUpdate}
      onLogout={() => {
        setLocalToken(null); // Just locks local active token memory, requiring passphrase on reload
      }} 
    />
  );
}
