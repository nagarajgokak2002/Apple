import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Heart, Users, MapPin, Phone, Mail, ChevronRight, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    question: "What devices do you repair?",
    answer: "We specialize in the entire Apple ecosystem, including iPhones, iPads, MacBooks, Apple Watches, and AirPods. From the latest models to vintage classics, our technicians are trained to handle them all."
  },
  {
    question: "Do you use original Apple parts?",
    answer: "We use high-quality, certified pre-owned original parts or premium-grade replacements that meet or exceed Apple's factory standards. Every repair is calibrated to ensure full functionality like FaceID and True Tone."
  },
  {
    question: "How long does a typical repair take?",
    answer: "Most iPhone screen and battery replacements are completed within 2-4 hours. MacBook repairs and complex logic board issues typically take 1-3 business days depending on part availability."
  },
  {
    question: "What kind of warranty do you offer?",
    answer: "All iResell repairs come with our industry-leading 180-day warranty. If the part we replaced fails due to a manufacturing defect, we'll replace it again for free, no questions asked."
  },
  {
    question: "Is my data safe during the repair?",
    answer: "Data privacy is our top priority. We do not require your passcode for most hardware repairs, and we recommend backing up your device to iCloud or a computer before bringing it in as a standard precaution."
  }
];

export default function About() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="space-y-24 pb-40">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 text-center space-y-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter"
        >
          Built for <span className="text-apple-blue">Longevity.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl text-apple-secondary max-w-3xl mx-auto leading-relaxed"
        >
          We believe the best device for the planet is the one you already own. iResell provides professional repair and trade-in services to keep your Apple gear in play longer.
        </motion.p>
      </section>

      {/* Values Bento */}
      <section className="bento-grid">
        <div className="bento-item md:col-span-2 bg-zinc-900 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <ShieldCheck className="w-12 h-12 text-apple-blue mb-6" />
            <h3 className="text-3xl font-bold">Certified Quality</h3>
            <p className="text-zinc-400 mt-4">We use only original-grade parts and professional tools to ensure your device returns to factory standards.</p>
          </div>
          <img src="https://images.unsplash.com/photo-1556652311-5444e21b0128?q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity" alt="" referrerPolicy="no-referrer" />
        </div>
        <div className="bento-item md:col-span-2 bg-[#f5f5f7] relative overflow-hidden group">
          <div className="relative z-10">
            <Zap className="w-12 h-12 text-orange-500 mb-6" />
            <h3 className="text-3xl font-bold">Smart Diagnostics</h3>
            <p className="text-apple-secondary mt-4">Our proprietary evaluation system identifies issues instantly, giving you transparent pricing before you even step in.</p>
          </div>
          <img src="https://images.unsplash.com/photo-1591337676887-a217a6970c8a?q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-10 transition-opacity" alt="" referrerPolicy="no-referrer" />
        </div>
        <div className="bento-item bg-white relative overflow-hidden">
          <div className="relative z-10">
            <Heart className="w-10 h-10 text-red-500 mb-4" />
            <h4 className="font-bold">Sustainability</h4>
            <p className="text-sm text-apple-secondary">Every repair saves a device from the landfill.</p>
          </div>
          <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600" className="absolute inset-0 w-full h-full object-cover opacity-5" alt="" referrerPolicy="no-referrer" />
        </div>
        <div className="bento-item bg-white font-display flex flex-col justify-center">
          <h4 className="text-4xl font-bold text-apple-blue">99%</h4>
          <p className="text-sm text-apple-secondary mt-2">Customer satisfaction on over 10,000 repairs.</p>
        </div>
      </section>

      {/* Our Journey Image Section */}
      <section className="px-6">
        <div className="max-w-7xl mx-auto rounded-[3.5rem] overflow-hidden relative h-[600px]">
          <img 
            src="https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=2070" 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Our Journey"
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-20 left-20 max-w-2xl text-white space-y-6">
            <h2 className="text-5xl font-bold tracking-tight">Our Journey.</h2>
            <p className="text-xl text-white/80 leading-relaxed">Starting from a small workshop in 2018, we've grown into a leading destination for premium Apple services. Our mission remains unchanged: extending the life of technology through expertise and trust.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl font-bold tracking-tight">Questions. Answered.</h2>
          <p className="text-apple-secondary text-lg">Everything you need to know about our service.</p>
        </div>
        
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div 
              key={index} 
              className="border-b border-apple-border last:border-0"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full py-8 flex items-center justify-between text-left group"
              >
                <span className="text-xl font-medium tracking-tight group-hover:text-apple-blue transition-colors">
                  {faq.question}
                </span>
                <div className={`w-8 h-8 rounded-full bg-apple-gray flex items-center justify-center transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                  {openFaq === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              
              <motion.div
                initial={false}
                animate={{ 
                  height: openFaq === index ? 'auto' : 0,
                  opacity: openFaq === index ? 1 : 0
                }}
                className="overflow-hidden"
              >
                <p className="text-apple-secondary leading-relaxed pb-8 text-lg">
                  {faq.answer}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="apple-card p-12 md:p-20 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Get in touch.</h2>
            <p className="text-apple-secondary">Have a question about a repair or trade-in? We're here to help.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-apple-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-5 h-5 text-apple-text" />
              </div>
              <p className="font-bold">Call Us</p>
              <p className="text-xs text-apple-secondaryLeading relaxed">8431000107</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-apple-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-apple-text" />
              </div>
              <p className="font-bold">Email Us</p>
              <p className="text-xs text-apple-secondary leading-relaxed">iresellcare@gmail.com</p>
            </div>
          </div>
          <div className="pt-8 flex justify-center">
             <Link to="/repair" className="apple-button-primary flex items-center">
               Book a Repair Now <ChevronRight className="ml-2 w-4 h-4" />
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
