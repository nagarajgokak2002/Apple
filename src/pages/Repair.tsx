import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Wrench, Battery, Smartphone, Camera, CloudRain, Volume2, Fingerprint, Cpu, Loader2, CheckCircle2, ChevronRight, Zap, Sparkles, Shield, Smartphone as DeviceIcon, Tablet, Laptop, Watch, Headphones, Database, Truck, ArrowLeft } from 'lucide-react';
import { diagnoseRepair } from '../services/gemini';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { DEVICE_TREE } from '../constants/deviceList';

const CATEGORIES = [
  { id: 'iPhone', name: 'iPhone', icon: Smartphone },
  { id: 'MacBook', name: 'MacBook', icon: Laptop },
  { id: 'iPad', name: 'iPad', icon: Tablet },
  { id: 'Watch', name: 'Watch', icon: Watch },
  { id: 'Audio', name: 'AirPods/Audio', icon: Headphones },
  { id: 'iMac', name: 'iMac', icon: Database },
  { id: 'Mac Desktop', name: 'Mac mini/Studio', icon: Laptop },
  { id: 'Vision & Accessories', name: 'Vision/Accessories', icon: Settings }
];

const REpair_SERVICES = [
  { id: 'Screen Replacement', icon: Smartphone },
  { id: 'Battery Replacement', icon: Battery },
  { id: 'Camera Repair', icon: Camera },
  { id: 'Charging Port', icon: Cpu },
  { id: 'Liquid Damage Service', icon: CloudRain },
  { id: 'Speaker Issue', icon: Volume2 },
  { id: 'Logic Board', icon: Cpu },
  { id: 'Other Service', icon: Settings },
];

export default function Repair() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [problem, setProblem] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [repairPrices, setRepairPrices] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    let isSubscribed = true;

    const fetchPrices = () => {
      fetch('/api/repair-prices')
        .then(res => res.json())
        .then(data => {
          if (isSubscribed) {
            setRepairPrices(data);
          }
        })
        .catch(err => console.error('[Repair] Error loading prices:', err));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const getRepairPrice = () => {
    if (!model || !problem) return null;
    const modelId = model.replace(/\s+/g, '-').toLowerCase();
    const pricing = repairPrices.find(p => p.id === modelId);
    return pricing?.prices?.[problem] || null;
  };

  const handleDiagnose = async () => {
    if (!model || !problem) return;
    setLoading(true);
    try {
      const result = await diagnoseRepair(model, problem);
      // Override price if admin price exists
      const adminPrice = getRepairPrice();
      if (adminPrice) {
        result.estimatedRepairCost = adminPrice;
      }
      setDiagnosis(result);
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!user) return alert('Please sign in to book a repair');
    setLoading(true);
    try {
      const response = await fetch('/api/repair-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          customerName: customerInfo.name,
          phoneNumber: customerInfo.phone,
          deviceType: model,
          problem,
          diagnosis: diagnosis,
          status: 'Device Received',
          price: diagnosis.estimatedRepairCost,
          timeline: [{ status: 'Repair Requested', time: new Date().toISOString() }],
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create repair booking');
      }

      setConfirmed(true);
    } catch (error) {
      console.error('[Repair]Booking Error:', error);
      alert('Could not schedule repair booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="apple-card p-6 sm:p-12 text-center space-y-6 sm:space-y-8 max-w-2xl w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div className="space-y-3">
             <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Repair Scheduled</h2>
             <p className="text-apple-secondary text-base sm:text-lg">Your repair ticket for your {model} has been generated. We've notified our technicians at your local service center.</p>
          </div>

          <div className="w-full max-w-md mx-auto bg-apple-gray/30 rounded-[1.5rem] sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 text-left border border-apple-border">
             <h3 className="font-bold text-base sm:text-lg flex items-center">
                <Truck className="w-5 h-5 mr-3 text-apple-blue" />
                Next Steps
             </h3>
             <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start space-x-3 sm:space-x-4">
                   <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-apple-blue text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                   <p className="text-xs sm:text-sm text-apple-secondary"><span className="font-bold text-apple-text">Drop-off or Pickup:</span> Visit our store or wait for our pickup agent (confirmed via WhatsApp).</p>
                </li>
                <li className="flex items-start space-x-3 sm:space-x-4">
                   <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-apple-blue text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                   <p className="text-xs sm:text-sm text-apple-secondary"><span className="font-bold text-apple-text">Real-time Fix:</span> Track your repair progress in real-time through the dashboard.</p>
                </li>
                <li className="flex items-start space-x-3 sm:space-x-4">
                   <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-apple-blue text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                   <p className="text-xs sm:text-sm text-apple-secondary"><span className="font-bold text-apple-text">90-Day Warranty:</span> Every repair is certified with our standard technical warranty.</p>
                </li>
             </ul>
          </div>

          <div className="pt-4 flex flex-col space-y-3 sm:space-y-4 max-w-xs mx-auto w-full">
            <Link to="/track" className="apple-button-primary w-full text-center py-3 sm:py-4">Track Progress</Link>
            <Link to="/" className="apple-button-secondary w-full text-center py-3 sm:py-4">Back to Dashboard</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-24">
      <section className="relative h-[45vh] sm:h-[60vh] flex items-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1510557880570-3bc8a3d1f03d?q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Technical Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/90 to-transparent" />
        
        <header className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-2 text-apple-blue font-bold tracking-widest text-[10px] sm:text-xs uppercase">
            <Wrench className="w-4 h-4" />
            <span>Certified Service</span>
          </div>
          <h1 className="text-3.5xl sm:text-5xl md:text-7xl font-bold tracking-tight">Expert repair.<br/><span className="text-apple-secondary">Restored to perfection.</span></h1>
          <p className="text-sm sm:text-lg md:text-xl text-apple-secondary max-w-xl">Get an instant diagnosis and transparent quote. All repairs use original parts and include a 180-day technical warranty.</p>
        </header>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-40 relative">
        <AnimatePresence mode="wait">
          {/* Step 0: Category */}
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold px-1">What are we fixing today?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setStep(1); }}
                    className="apple-card p-4 sm:p-8 flex flex-col items-center justify-center space-y-3 sm:space-y-4 border-2 border-transparent hover:border-apple-blue hover:bg-apple-blue/5 transition-all group"
                  >
                    <cat.icon className="w-8 h-8 sm:w-10 sm:h-10 text-apple-secondary group-hover:text-apple-blue transition-colors" />
                    <span className="font-bold text-xs sm:text-sm text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Model Selection */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-8"
            >
              <button onClick={handleBack} className="flex items-center text-apple-blue font-bold text-sm mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold text-center">Select your {category} model</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {(DEVICE_TREE[category as keyof typeof DEVICE_TREE] || []).map(m => (
                  <button
                    key={m}
                    onClick={() => { setModel(m); setStep(2); }}
                    className="apple-card p-4 sm:p-6 flex items-center justify-center text-center font-bold text-xs sm:text-sm border-2 border-transparent hover:border-apple-blue hover:bg-zinc-50 transition-all"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Issue Selection */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 sm:space-y-12"
            >
              <div className="flex justify-between items-center px-1">
                 <button onClick={handleBack} className="flex items-center text-apple-blue font-bold text-sm">
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
                 </button>
                 <span className="text-xs font-bold text-apple-secondary uppercase tracking-widest">{model}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-center">What's the issue?</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {REpair_SERVICES.map(service => (
                  <button
                    key={service.id}
                    onClick={() => setProblem(service.id)}
                    className={`apple-card p-4 sm:p-8 flex flex-col items-center justify-center space-y-3 sm:space-y-4 border-2 transition-all ${problem === service.id ? 'border-apple-blue bg-apple-blue/5 shadow-inner' : 'border-transparent hover:bg-apple-gray'}`}
                  >
                    <service.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${problem === service.id ? 'text-apple-blue' : 'text-apple-secondary'}`} />
                    <div className="text-center">
                       <p className={`font-bold text-xs sm:text-sm ${problem === service.id ? 'text-apple-blue' : ''}`}>{service.id}</p>
                       {getRepairPrice() && problem === service.id && (
                         <p className="text-[10px] sm:text-xs font-mono font-bold text-green-600 mt-1">₹{getRepairPrice()}</p>
                       )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="max-w-2xl mx-auto pt-4 sm:pt-8 w-full">
                {showContactForm ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="apple-card p-6 sm:p-10 bg-white border border-apple-border space-y-4 sm:space-y-6 shadow-xl"
                  >
                    <div className="text-center space-y-1 sm:space-y-2">
                       <h3 className="font-bold text-lg sm:text-xl">Almost there!</h3>
                       <p className="text-xs sm:text-sm text-apple-secondary">Enter your details to view your technical diagnosis and quote.</p>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-1">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="John Doe" 
                            className="w-full apple-card p-3 sm:p-4 bg-apple-gray/50 border-none focus:ring-2 focus:ring-apple-blue"
                            value={customerInfo.name}
                            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-1">Mobile Number</label>
                          <input 
                            type="tel" 
                            placeholder="+1 (555) 000-0000" 
                            className="w-full apple-card p-3 sm:p-4 bg-apple-gray/50 border-none focus:ring-2 focus:ring-apple-blue"
                            value={customerInfo.phone}
                            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          />
                       </div>
                       <button 
                         disabled={!customerInfo.name || !customerInfo.phone || loading}
                         onClick={handleDiagnose}
                         className="apple-button-primary w-full py-3.5 sm:py-4 text-base sm:text-lg font-bold"
                       >
                         {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "View My Price & Diagnosis"}
                       </button>
                       <button 
                         onClick={() => setShowContactForm(false)}
                         className="w-full text-xs font-bold text-apple-secondary hover:text-apple-blue transition-colors pt-2"
                       >
                         Cancel
                       </button>
                    </div>
                  </motion.div>
                ) : (
                  <button 
                    disabled={!problem || loading}
                    onClick={() => setShowContactForm(true)}
                    className="apple-button-primary w-full flex items-center justify-center py-4 sm:py-6 text-base sm:text-xl shadow-xl shadow-apple-blue/10"
                  >
                    <Sparkles className="w-5 h-5 mr-3" />
                    Get Technical Diagnosis & Price
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Diagnosis Result */}
          {step === 3 && diagnosis && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto w-full"
            >
              <button onClick={handleBack} className="flex items-center text-apple-blue font-bold text-sm mb-6 sm:mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Issue
              </button>
              
              <div className="grid md:grid-cols-2 gap-6 sm:gap-12">
                 <div className="apple-card bg-zinc-900 text-white p-6 sm:p-12 space-y-6 sm:space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-apple-blue/10 blur-[80px]" />
                    <div className="flex items-center space-x-3 text-apple-blue">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Technical Quote</span>
                    </div>
                    
                    <div className="space-y-2">
                       <h3 className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-widest">Estimated Repair</h3>
                       <p className="text-4xl sm:text-6xl font-bold tracking-tighter">₹{diagnosis.estimatedRepairCost}</p>
                       {getRepairPrice() && (
                         <div className="flex items-center space-x-2 text-green-500 text-[10px] sm:text-xs font-bold mt-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Pre-approved Part Pricing</span>
                         </div>
                       )}
                    </div>

                    <div className="space-y-4 pt-6 sm:pt-10 border-t border-zinc-800">
                       <div className="grid grid-cols-2 gap-4 sm:gap-8">
                          <div className="space-y-1">
                             <p className="text-[8px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Est. Duration</p>
                             <p className="text-base sm:text-lg font-bold">{diagnosis.estimatedTime}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] sm:text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Status</p>
                             <p className="text-base sm:text-lg font-bold text-blue-400">Parts in Stock</p>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={handleBook}
                      disabled={loading}
                      className="apple-button-primary w-full bg-white text-black hover:bg-zinc-200 mt-6 sm:mt-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Book Service Pickup"}
                    </button>
                 </div>

                 <div className="space-y-4 sm:space-y-8">
                    <div className="grid grid-cols-1 gap-4">
                       <div className="apple-card p-5 sm:p-6 flex items-start space-x-4 bg-apple-blue/5 border border-apple-blue/10">
                          <Shield className="w-6 h-6 text-apple-blue shrink-0" />
                          <div className="space-y-1">
                             <p className="font-bold text-sm sm:text-base text-apple-text">90-Day Guarantee</p>
                             <p className="text-xs text-apple-secondary">All technical repairs include a certified warranty on parts and labor.</p>
                          </div>
                       </div>
                       <div className="apple-card p-5 sm:p-6 flex items-start space-x-4 bg-green-50 border border-green-100">
                          <Zap className="w-6 h-6 text-green-600 shrink-0" />
                          <div className="space-y-1">
                             <p className="font-bold text-green-700 uppercase text-[8px] sm:text-[10px] tracking-widest">Express Service</p>
                             <p className="text-xs text-green-600 font-medium">Most repairs of this type are completed within same-day of receipt.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

