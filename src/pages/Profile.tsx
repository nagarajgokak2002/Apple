import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { User, Mail, Shield, LogOut, Package, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, profile, logout } = useAuth();

  if (!user) return <div className="h-screen flex items-center justify-center">Please sign in.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 space-y-12">
      <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 border-b border-apple-border pb-12">
        <div className="w-24 h-24 bg-apple-gray rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-apple-secondary" />
        </div>
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-4xl font-bold">{profile?.displayName || user.displayName}</h1>
          <p className="text-apple-secondary flex items-center justify-center md:justify-start">
            <Mail className="w-4 h-4 mr-2" /> {user.email}
          </p>
          <div className="flex items-center justify-center md:justify-start mt-2">
            <span className="px-3 py-1 bg-apple-blue/10 text-apple-blue rounded-full text-xs font-bold uppercase tracking-widest flex items-center">
              <Shield className="w-3 h-3 mr-1" /> {profile?.role || 'Customer'}
            </span>
          </div>
        </div>
        <button 
          onClick={logout}
          className="md:ml-auto apple-button-secondary border border-red-100 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Link to="/track" className="apple-card p-10 space-y-4 group">
          <div className="w-12 h-12 bg-apple-gray rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <Package className="w-6 h-6 text-apple-text" />
          </div>
          <h3 className="text-xl font-bold">Orders & Tracking</h3>
          <p className="text-apple-secondary">Track your active repairs and view trade-in status.</p>
        </Link>
        <Link to="/store" className="apple-card p-10 space-y-4 group">
          <div className="w-12 h-12 bg-apple-gray rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
            <ShoppingBag className="w-6 h-6 text-apple-text" />
          </div>
          <h3 className="text-xl font-bold">Shopping Bag</h3>
          <p className="text-apple-secondary">Continue shopping for premium certified Apple products.</p>
        </Link>
      </div>
    </div>
  );
}
