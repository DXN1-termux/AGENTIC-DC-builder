import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { Shield, Sparkles, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Authentication failed. Please verify popup permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Background visual ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl relative z-10"
      >
        <div id="login-header" className="flex flex-col items-center text-center">
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-4">
            <Shield className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Discord Server Architect
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Secure, end-to-end encrypted AI bot orchestrator.
          </p>
        </div>

        {error && (
          <div id="login-error" className="p-3 bg-red-950/40 border border-red-850 rounded-lg text-xs text-red-400 mb-4 text-center">
            {error}
          </div>
        )}

        <button
          id="google-signin-btn"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-medium rounded-xl transition duration-250 cursor-pointer shadow-lg shadow-violet-600/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.61 4.56 1.76l2.394-2.394C17.143 1.411 14.8.8 12.24.8c-5.637 0-10.2 4.563-10.2 10.2s4.563 10.2 10.2 10.2c5.88 0 9.8-4.131 9.8-9.972 0-.67-.06-1.32-.174-1.943H12.24z"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 bg-slate-950/60 py-1.5 px-3 rounded-full border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>Powered by Gemini 3.5 Flash</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
