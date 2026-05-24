import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-apple-border/50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 pb-20">
          <div className="col-span-2 space-y-6">
            <Link to="/" className="flex items-center space-x-2 group w-fit">
              <Smartphone className="w-6 h-6 text-apple-blue transition-transform group-hover:scale-110" />
              <span className="font-display font-bold tracking-tighter text-xl text-apple-text">iResell</span>
            </Link>
            <p className="text-apple-secondary text-sm leading-relaxed max-w-xs font-medium">
              Premium ecosystem for buying, selling, and repairing devices with advanced diagnostics and certified technician support.
            </p>
            <div className="flex items-center space-x-5 pt-2">
              <Instagram className="w-5 h-5 text-apple-secondary hover:text-apple-blue cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-apple-secondary hover:text-apple-blue cursor-pointer transition-colors" />
              <Facebook className="w-5 h-5 text-apple-secondary hover:text-apple-blue cursor-pointer transition-colors" />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold text-apple-text uppercase tracking-widest">Shop</h4>
            <ul className="space-y-4 text-sm font-medium text-apple-secondary">
              <li><Link to="/sell" className="hover:text-apple-blue transition-colors">Sell Device</Link></li>
              <li><Link to="/repair" className="hover:text-apple-blue transition-colors">Repair Service</Link></li>
              <li><Link to="/store" className="hover:text-apple-blue transition-colors">Browse Store</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold text-apple-text uppercase tracking-widest">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-apple-secondary">
              <li><Link to="/track" className="hover:text-apple-blue transition-colors">Track Order</Link></li>
              <li><Link to="/about" className="hover:text-apple-blue transition-colors">About Us</Link></li>
              <li><Link to="/about" className="hover:text-apple-blue transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-6 col-span-2 lg:col-span-1">
             <h4 className="text-xs font-bold text-apple-text uppercase tracking-widest">Contact</h4>
             <ul className="space-y-4 text-sm font-medium text-apple-secondary">
               <li><a href="mailto:iresellcare@gmail.com" className="hover:text-apple-blue transition-colors">iresellcare@gmail.com</a></li>
               <li><a href="tel:8431000107" className="hover:text-apple-blue transition-colors">8431000107</a></li>
             </ul>
          </div>
        </div>

        <div className="border-t border-apple-border/30 pt-8 flex flex-col items-center text-[10px] font-bold text-apple-secondary uppercase tracking-widest gap-6 text-center">
          <div className="space-y-4 max-w-4xl">
            <p>© 2026 iResell Pvt Ltd. All rights reserved.</p>
            <p className="normal-case font-medium opacity-60">
              Service provider for all Apple products. All product names, logos, and images are the property of Apple Inc. We are not, however, associated with or certified by Apple Inc. in any manner.
            </p>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-apple-text transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-apple-text transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-apple-text transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
