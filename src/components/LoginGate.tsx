import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Shield, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { subscribeToConfig, AppConfig, DEFAULT_CONFIG } from '../services/configService';

interface LoginGateProps {
  onLogin: () => Promise<void>;
}

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [signingIn, setSigningIn] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToConfig(setConfig);
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    setErr(null);
    try {
      await onLogin();
    } catch (error: any) {
      console.error('[LoginGate] authentication error:', error);
      setErr(error?.message || 'Failed to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Visual background details */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-400 rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-zinc-200/50 shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] p-10 md:p-12 relative z-10 flex flex-col items-center"
      >
        {/* Brand Header */}
        <motion.div 
          className="flex items-center space-x-2.5 mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-3 bg-apple-blue/5 rounded-2xl border border-apple-blue/10">
            <Smartphone className="w-8 h-8 text-apple-blue" />
          </div>
          <span className="font-display font-extrabold tracking-tighter text-3xl text-zinc-900">
            {config.storeName}
          </span>
        </motion.div>

        {/* Text Area */}
        <div className="text-center space-y-4 mb-10 w-full">
          <h2 className="text-3xl font-display font-bold tracking-tight text-neutral-900">
            Welcome to the Ecosystem
          </h2>
          <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
            Please sign in to unlock custom pricing, book diagnostics, and track your repairs.
          </p>
        </div>

        {/* Key Features Section */}
        <div className="w-full space-y-4 mb-10">
          <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-zinc-800">Smart Price AI Estimates</p>
              <p className="text-[11px] text-zinc-500">Instant quotes on repairs or trade-ins based on market pricing.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-zinc-800">Secure Service Tracking</p>
              <p className="text-[11px] text-zinc-500">Real-time milestones for your requested devices with timeline feeds.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full space-y-4">
          <button
            id="google-sign-in-btn"
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full apple-button-primary py-4 flex items-center justify-center space-x-3 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          >
            {signingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In with Google</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <AnimatePresence>
            {err && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500 text-center"
              >
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Compliance details */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-zinc-400 tracking-wide uppercase">
            Secured via Firebase Authentication
          </p>
        </div>
      </motion.div>
    </div>
  );
}
