import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X, Smartphone, RefreshCcw, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToConfig, AppConfig, DEFAULT_CONFIG } from '../services/configService';

const ALL_NAV_ITEMS = [
  { name: 'Store', path: '/store', icon: Smartphone },
  { name: 'Sell', path: '/sell', icon: RefreshCcw },
  { name: 'Repair', path: '/repair', icon: Smartphone },
  { name: 'About', path: '/about', icon: Users },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const { user, profile, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const unsub = subscribeToConfig(setConfig);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsub();
    };
  }, []);

  const navItems = ALL_NAV_ITEMS.filter(item => !config.hiddenSections.includes(item.name));

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'py-2 sm:py-4' : 'py-4 sm:py-6'}`}>
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6">
        <div className={`relative flex items-center justify-between rounded-full border border-white/20 px-4 sm:px-8 h-14 sm:h-16 transition-all duration-500 ${scrolled ? 'apple-blur shadow-lg shadow-black/5' : 'bg-white/30 backdrop-blur-md'}`}>
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 group">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue transition-transform group-hover:scale-110" />
            <span className="font-display font-bold tracking-tighter text-lg sm:text-xl">{config.storeName}</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`text-sm font-medium transition-colors hover:text-apple-blue px-2 py-1 ${location.pathname === item.path ? 'text-apple-blue' : 'text-apple-secondary'}`}
              >
                {item.name}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-sm font-bold text-apple-blue px-2 py-1 border-l border-apple-border/50">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/profile" className="flex items-center space-x-2 group">
                  <User className="w-5 h-5" />
                  {profile?.role === 'admin' && <span className="hidden md:inline px-2 py-0.5 bg-apple-blue/10 text-apple-blue text-[10px] font-bold uppercase rounded-md tracking-widest">Admin</span>}
                </Link>
              ) : (
                <button onClick={login} className="text-sm font-semibold hover:text-apple-blue">Sign In</button>
              )}
              
              <button 
                className="lg:hidden text-apple-text"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="lg:hidden absolute top-full inset-x-6 mt-4 p-8 apple-blur rounded-[2.5rem] border border-white/20 shadow-2xl space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path} 
                  className="flex flex-col items-center justify-center p-6 rounded-3xl bg-apple-gray/50 hover:bg-apple-gray transition-colors space-y-3"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-6 h-6 text-apple-secondary" />
                  <span className="font-semibold text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
