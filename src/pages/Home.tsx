import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Smartphone, Laptop, Watch, Headphones, Zap, Shield, Recycle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_PRODUCTS = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    tagline: 'Titanium. So strong. So light. So Pro.',
    image: 'https://images.unsplash.com/photo-1707018042456-4258c49e77f0?q=80&w=2070&auto=format&fit=crop',
    color: 'bg-zinc-900',
    textColor: 'text-white'
  }
];

export default function Home() {
  return (
    <div className="space-y-24 pb-40">
      {/* Hero Section */}
      <section className="px-3 sm:px-6 pt-16 sm:pt-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[70vh] sm:h-[85vh] w-full rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden bg-black text-white flex flex-col items-center justify-center text-center px-4"
        >
          <div className="z-20 absolute top-12 sm:top-20 text-center space-y-4 sm:space-y-6 max-w-4xl px-2">
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-tight"
            >
              The Next Chapter.<br/><span className="text-apple-blue">iPremium Ecosystem.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-base sm:text-xl md:text-3xl font-light text-zinc-400"
            >
              Professional repair and premium trade-ins.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
            >
              <Link to="/repair" className="apple-button-primary w-full sm:w-auto scale-100 sm:scale-110 text-center">
                Repair Now
              </Link>
              <Link to="/sell" className="apple-button-secondary w-full sm:w-auto bg-white text-black hover:bg-zinc-200 scale-100 sm:scale-110 text-center">
                Trade In
              </Link>
            </motion.div>
          </div>

          {/* New Branding Overlay matching user's image */}
          <div className="hidden sm:flex absolute bottom-12 left-12 flex flex-col items-start z-20 text-white text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <Smartphone className="w-12 h-12 mb-4 opacity-90" />
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">iPhone</h1>
            </motion.div>
          </div>

          <motion.img 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.7, scale: 1 }}
            transition={{ delay: 0.2, duration: 2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1695048103153-93d229c9ab07?q=80&w=2070&auto=format&fit=crop" 
            alt="iPhone 17 Pro Max Design" 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 animate-pulse-subtle" 
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black z-10" />
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section className="bento-grid">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bento-item md:col-span-2 md:row-span-2 bg-[#f5f5f7]"
        >
          <div className="space-y-4">
            <h3 className="text-4xl font-bold">New arrivals.</h3>
            <p className="text-xl text-apple-secondary">Explore our certified pre-owned selection.</p>
          </div>
          <Link to="/store" className="apple-button-secondary self-start">Shop Store</Link>
          <img src="https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=2070&auto=format&fit=crop" className="absolute -right-20 -bottom-20 w-3/4 opacity-40 rotate-12" alt="" referrerPolicy="no-referrer" />
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bento-item md:col-span-2 bg-zinc-900 text-white"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Trade In</h3>
              <p className="text-zinc-400">Turn your device into credit.</p>
            </div>
            <Recycle className="w-8 h-8 text-green-500" />
          </div>
          <Link to="/sell" className="text-apple-blue font-bold hover:underline flex items-center">
            Estimate value <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bento-item bg-white"
        >
          <Zap className="w-10 h-10 text-orange-500 mb-6" />
          <h3 className="text-xl font-bold">Smart Diagnostics</h3>
          <p className="text-sm text-apple-secondary">Instant repair quotes powered by advanced technology.</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bento-item bg-white"
        >
          <Shield className="w-10 h-10 text-blue-500 mb-6" />
          <h3 className="text-xl font-bold">Certified Parts</h3>
          <h4 className="text-xs font-bold text-apple-secondary uppercase tracking-widest mt-2">100% Original</h4>
        </motion.div>
      </section>

      {/* Categories Horizontal Scroll */}
      <section className="space-y-6 sm:space-y-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Shop by category.</h2>
        </div>
        <div className="flex space-x-4 sm:space-x-6 overflow-x-auto px-4 sm:px-6 pb-6 sm:pb-12 no-scrollbar snap-x snap-mandatory scroll-smooth">
          {[
            { name: 'iPhone', icon: Smartphone, img: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=600&auto=format&fit=crop' },
            { name: 'MacBook', icon: Laptop, img: 'https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop' },
            { name: 'Watch', icon: Watch, img: 'https://images.unsplash.com/photo-1508685096489-7aac291ba75a?q=80&w=600&auto=format&fit=crop' },
            { name: 'AirPods', icon: Headphones, img: 'https://images.unsplash.com/photo-1588423770574-9169244fd57b?q=80&w=600&auto=format&fit=crop' },
            { name: 'iPad', icon: Laptop, img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop' },
          ].map((cat, i) => (
             <motion.div
               key={cat.name}
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               viewport={{ once: true }}
               className="snap-center flex-shrink-0"
             >
               <Link 
                to={`/store?cat=${cat.name}`}
                className="group relative w-64 sm:w-72 h-80 sm:h-96 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden block"
              >
                <img src={cat.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cat.name} referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/60" />
                <div className="absolute bottom-8 left-8 sm:bottom-10 sm:left-10 text-white space-y-2">
                  <cat.icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
                  <h3 className="text-2xl sm:text-3xl font-bold">{cat.name}</h3>
                </div>
              </Link>
             </motion.div>
          ))}
        </div>
      </section>

      {/* Simplified Repair Section Overhaul */}
      <section className="px-4 sm:px-6">
        <div className="max-w-7xl mx-auto relative rounded-[2rem] sm:rounded-[4rem] bg-zinc-900 overflow-hidden py-16 sm:py-32 px-6 sm:px-24 flex flex-col lg:flex-row items-center justify-between text-white gap-8 sm:gap-12">
          <div className="max-w-xl space-y-6 sm:space-y-8 z-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight sm:leading-[0.9] tracking-tighter">Expert repair.<br/><span className="text-zinc-500">Restored to perfection.</span></h2>
            <p className="text-base sm:text-xl text-zinc-400">Cracked screen? Battery issues? Our certified technicians use only original parts to bring your device back to life.</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/repair" className="apple-button-primary w-full sm:w-auto text-center">Book Repair</Link>
              <Link to="/track" className="apple-button-secondary bg-zinc-800 text-white border-zinc-700 w-full sm:w-auto text-center hover:bg-zinc-700">Track Service</Link>
            </div>
          </div>
          <motion.div 
            whileHover={{ rotate: -5, scale: 1.05 }}
            className="w-full max-w-sm aspect-square bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[100px] absolute right-0 top-0 opacity-20"
          />
          <img src="https://images.unsplash.com/photo-1591337676887-a217a6970c8a?q=80&w=2070&auto=format&fit=crop" className="w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl z-10 border border-zinc-800" alt="Repair" referrerPolicy="no-referrer" />
        </div>
      </section>
    </div>
  );
}
