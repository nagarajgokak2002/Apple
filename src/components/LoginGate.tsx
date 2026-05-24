import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Shield, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { subscribeToConfig, AppConfig, DEFAULT_CONFIG } from '../services/configService';
import { useAuth } from '../hooks/useAuth';

export default function LoginGate() {
  const { login, register } = useAuth();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToConfig(setConfig);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
    } catch (error: any) {
      setErr(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
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

        {/* Title */}
        <div className="text-center space-y-2 mb-8 w-full">
          <h2 className="text-2xl font-display font-bold tracking-tight text-neutral-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-zinc-500">
            {mode === 'login' ? 'Sign in to your account to continue.' : 'Join to unlock all features.'}
          </p>
        </div>

        {/* Features */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-zinc-800">Smart Price AI Estimates</p>
              <p className="text-[11px] text-zinc-500">Instant quotes on repairs or trade-ins.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-zinc-800">Secure Service Tracking</p>
              <p className="text-[11px] text-zinc-500">Real-time milestones for your devices.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full apple-button-primary py-4 flex items-center justify-center space-x-3 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
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
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(null); }}
            className="text-xs text-zinc-500 hover:text-apple-blue transition-colors cursor-pointer"
          >
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-zinc-400 tracking-wide uppercase">
            Secured via InsForge PostgreSQL
          </p>
        </div>
      </motion.div>
    </div>
  );
}
