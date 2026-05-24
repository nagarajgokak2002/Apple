import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, CheckCircle2, DollarSign, Camera, ArrowRight, Loader2, RefreshCcw, Sparkles, Shield, Smartphone as DeviceIcon, Tablet, Laptop, Watch, Headphones, Database, Truck } from 'lucide-react';
import { estimateDevicePrice } from '../services/gemini';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { DEVICE_TREE } from '../constants/deviceList';

const CATEGORIES = [
  { id: 'iPhone', name: 'iPhone', icon: Smartphone },
  { id: 'MacBook', name: 'MacBook', icon: Laptop },
  { id: 'iPad', name: 'iPad', icon: Tablet },
  { id: 'Watch', name: 'Watch', icon: Watch },
  { id: 'Audio', name: 'Audio', icon: Headphones },
  { id: 'Mac Desktop', name: 'Mac Desktop', icon: Laptop },
  { id: 'iMac', name: 'iMac', icon: Laptop },
  { id: 'Vision & Accessories', name: 'Accessories', icon: Sparkles },
];

const CAPACITIES = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

const CONDITIONS = [
  { id: 'Flawless', desc: 'No visible signs of use. No scratches.' },
  { id: 'Good', desc: 'Light scratches/minor wear.' },
  { id: 'Fair', desc: 'Significant scratches/dents.' },
  { id: 'Broken', desc: 'Cracked screen or non-functional.' },
];

export default function Sell() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('');
  const [device, setDevice] = useState('');
  const [capacity, setCapacity] = useState('128GB');
  const [condition, setCondition] = useState('');
  const [battery, setBattery] = useState(100);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [tradeInPrices, setTradeInPrices] = useState<any[]>([]);

  React.useEffect(() => {
    let isSubscribed = true;

    const fetchTradeInPrices = () => {
      fetch('/api/trade-in-prices')
        .then(res => res.json())
        .then(data => {
          if (isSubscribed) {
            setTradeInPrices(data);
          }
        })
        .catch(err => console.error('[Sell] Error loading trade-in prices:', err));
    };

    fetchTradeInPrices();
    const interval = setInterval(fetchTradeInPrices, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const handleGetEstimate = async () => {
    if (!device || !condition || !customerInfo.name || !customerInfo.phone || !termsAccepted) return;
    setLoading(true);
    try {
      if (!user) {
        alert('Please sign in to save your estimate.');
        return;
      }

      const fullDeviceName = `${device} (${capacity})`;
      let estimatedVal = 0;
      let reasoningStr = '';
      
      // Try local price matrix first
      const docId = device.replace(/\s+/g, '-').toLowerCase();
      const currentPriceItem = tradeInPrices.find(p => p.id === docId);
      
      if (currentPriceItem) {
        const matrix = currentPriceItem.prices;
        const manualPrice = matrix[capacity]?.[condition];
        if (manualPrice) {
          estimatedVal = manualPrice;
          reasoningStr = `Value based on our current store price matrix for ${fullDeviceName} in ${condition} condition.`;
        }
      }

      if (!estimatedVal) {
        // Fallback to AI
        const result = await estimateDevicePrice(fullDeviceName, condition, battery);
        estimatedVal = result.estimatedPrice;
        reasoningStr = result.reasoning;
      }

      const response = await fetch('/api/sell-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          customerName: customerInfo.name,
          phoneNumber: customerInfo.phone,
          deviceType: device,
          capacity,
          category,
          condition,
          batteryHealth: battery,
          estimate: estimatedVal,
          termsAccepted: true,
          status: 'Estimate Submitted',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit sell estimate.');
      }

      const resData = await response.json();
      const orderId = resData.id || 'sel-' + Math.random().toString(36).substr(2, 9);

      setEstimate({ estimatedPrice: estimatedVal, reasoning: reasoningStr });
      setLastOrderId(orderId);
      
      // Simulate Notifications
      console.log(`[Notification] SMS sent to ${customerInfo.phone}: Your iResell estimate for ${device} is ₹${estimatedVal}. Ref: #${orderId.slice(-6).toUpperCase()}`);
      console.log(`[Notification] Email sent to ${user.email}: Detailed estimate summary for your ${device}.`);
      console.log(`[Notification] Admin Alert: New high-value trade-in request from ${customerInfo.name} (₹${estimatedVal})`);

      setStep(3);
    } catch (error) {
      console.error(error);
      alert('Could not submit trade-in estimate. Please check network and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="apple-card p-6 sm:p-12 text-center space-y-5 sm:space-y-6 max-w-lg w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-apple-blue rounded-full flex items-center justify-center mx-auto shadow-lg shadow-apple-blue/20">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-2.5xl sm:text-4xl font-bold">Trade-in Confirmed!</h2>
          <div className="p-3 sm:p-4 bg-apple-gray rounded-2xl">
            <p className="text-[9px] sm:text-[10px] font-bold text-apple-secondary uppercase tracking-widest">Reference Number</p>
            <p className="text-lg sm:text-xl font-bold font-mono">#{lastOrderId.slice(-8).toUpperCase()}</p>
          </div>
          
          <div className="w-full bg-white rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 text-left border border-apple-border shadow-sm">
             <h3 className="font-bold text-base sm:text-lg flex items-center">
                <Truck className="w-5 h-5 mr-3 text-apple-blue shrink-0" />
                How Pickup Works
             </h3>
             <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-start space-x-3 sm:space-x-4">
                   <div className="w-6 h-6 rounded-full bg-apple-gray flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0 mt-0.5">1</div>
                   <p className="text-xs sm:text-sm text-apple-secondary"><span className="font-bold text-apple-text">Verification Call:</span> An agent will call you within 2 hours to confirm your details and pick-up time.</p>
                </li>
                <li className="flex items-start space-x-3 sm:space-x-4">
                   <div className="w-6 h-6 rounded-full bg-apple-gray flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0 mt-0.5">2</div>
                   <p className="text-xs sm:text-sm text-apple-secondary"><span className="font-bold text-apple-text">On-site Inspection:</span> Our technician arrives and performs a 5-minute diagnostic on your {device}.</p>
                </li>
                <li className="flex items-start space-x-3 sm:space-x-4">
                   <div className="w-6 h-6 rounded-full bg-apple-gray flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0 mt-0.5">3</div>
                   <p className="text-xs sm:text-sm text-apple-secondary"><span className="font-bold text-apple-text">Instant Payout:</span> Once verified, we transfer the funds to your account before we leave with the device.</p>
                </li>
             </ul>
          </div>

          <p className="text-apple-secondary text-sm sm:text-lg">We've received your request for {device}. Our technician will contact you within 24 hours for verification and pickup.</p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link to="/track" className="apple-button-primary w-full py-4 text-center">Track Status</Link>
            <Link to="/" className="apple-button-secondary w-full py-4 text-center">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-24">
      <section className="relative h-[45vh] sm:h-[60vh] flex items-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1591337676887-a217a6970c8a?q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Trade-in Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/80 to-transparent" />
        
        <header className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
          <h1 className="text-4.5xl sm:text-5xl md:text-7xl font-bold tracking-tight">Trade in.<br/><span className="text-apple-secondary">Get credit.</span></h1>
          <p className="text-sm sm:text-lg md:text-xl text-apple-secondary max-w-xl">Turn your current device into credit toward a new one. Powered by our proprietary AI evaluation system.</p>
        </header>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="w-full lg:col-span-2 space-y-8 sm:space-y-12">
          {/* Step 0: Category & Device */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div 
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8 sm:space-y-12"
              >
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-apple-blue text-white flex items-center justify-center font-bold text-xs sm:text-sm">1</span>
                    <h2 className="text-xl sm:text-2xl font-bold">Select category</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setDevice(''); }}
                        className={`apple-card p-4 sm:p-6 flex flex-col items-center justify-center space-y-2 sm:space-y-3 border-2 transition-all ${category === cat.id ? 'border-apple-blue bg-apple-blue/5' : 'border-transparent'}`}
                      >
                        <cat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${category === cat.id ? 'text-apple-blue' : 'text-apple-secondary'}`} />
                        <span className={`font-semibold text-[11px] sm:text-xs text-center ${category === cat.id ? 'text-apple-blue' : ''}`}>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  {category && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-2">Select Model</label>
                        <select 
                          className="w-full h-14 sm:h-20 px-4 sm:px-8 rounded-[1.5rem] sm:rounded-[2rem] bg-apple-gray/50 border-none focus:ring-4 focus:ring-apple-blue/10 text-base sm:text-xl font-medium outline-hidden appearance-none"
                          value={device}
                          onChange={(e) => setDevice(e.target.value)}
                        >
                          <option value="">Choose your model...</option>
                          {(DEVICE_TREE[category as keyof typeof DEVICE_TREE] || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-2">Storage Capacity</label>
                        <div className="grid grid-cols-3 gap-2">
                           {CAPACITIES.map(cap => (
                             <button 
                               key={cap}
                               onClick={() => setCapacity(cap)}
                               className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all ${capacity === cap ? 'bg-apple-blue text-white' : 'bg-apple-gray'}`}
                             >
                               {cap}
                             </button>
                           ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end pt-4 sm:pt-8">
                   <button 
                     disabled={!device}
                     onClick={() => setStep(1)} 
                     className={`apple-button-primary w-full sm:w-auto px-8 sm:px-12 py-3.5 sm:py-5 text-base sm:text-lg flex items-center justify-center ${!device ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     Continue <ArrowRight className="ml-3 w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 sm:space-y-12"
              >
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-apple-blue text-white flex items-center justify-center font-bold text-xs sm:text-sm">2</span>
                    <h2 className="text-xl sm:text-2xl font-bold">Device Condition</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {CONDITIONS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCondition(c.id)}
                        className={`apple-card p-5 sm:p-8 flex flex-col items-start space-y-2 sm:space-y-3 border-2 transition-all ${condition === c.id ? 'border-apple-blue bg-apple-blue/5' : 'border-transparent'}`}
                      >
                        <p className={`font-bold text-base sm:text-lg ${condition === c.id ? 'text-apple-blue' : ''}`}>{c.id}</p>
                        <p className="text-xs sm:text-sm text-apple-secondary text-left">{c.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 sm:space-y-8 border-t border-apple-border/30 pt-8 sm:pt-12">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold">Battery Health</h2>
                      <p className="text-xs sm:text-sm text-apple-secondary">Tell us the current percentage.</p>
                    </div>
                    <span className="text-3xl sm:text-5xl font-bold text-apple-blue">{battery}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" max="100" 
                    value={battery} 
                    onChange={(e) => setBattery(parseInt(e.target.value))}
                    className="w-full h-3 bg-apple-gray rounded-full appearance-none cursor-pointer accent-apple-blue"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                   <button onClick={() => setStep(0)} className="apple-button-secondary w-full sm:flex-1 py-4 sm:py-6">Back</button>
                   <button 
                     disabled={!condition}
                     onClick={() => setStep(2)}
                     className="apple-button-primary w-full sm:flex-[2] py-4 sm:py-6 text-base sm:text-lg"
                   >
                     Continue to Contact Info
                   </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
               <motion.div 
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8 sm:space-y-12"
               >
                  <div className="space-y-6 sm:space-y-10">
                     <div className="flex items-center space-x-3 sm:space-x-4">
                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-apple-blue text-white flex items-center justify-center font-bold text-xs sm:text-sm">3</span>
                        <h2 className="text-xl sm:text-2xl font-bold">Contact Details</h2>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-2">Full Name</label>
                           <input 
                             type="text" 
                             placeholder="John Doe"
                             className="w-full h-14 sm:h-16 px-4 sm:px-6 rounded-2xl bg-apple-gray/50 border-none focus:ring-4 focus:ring-apple-blue/10 text-base sm:text-lg font-medium outline-hidden"
                             value={customerInfo.name}
                             onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-2">Phone Number</label>
                           <input 
                             type="tel" 
                             placeholder="+1 (555) 000-0000"
                             className="w-full h-14 sm:h-16 px-4 sm:px-6 rounded-2xl bg-apple-gray/50 border-none focus:ring-4 focus:ring-apple-blue/10 text-base sm:text-lg font-medium outline-hidden"
                             value={customerInfo.phone}
                             onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 sm:space-y-8 bg-apple-gray/30 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-apple-border/50">
                    <div className="flex items-center space-x-3 text-apple-text">
                       <Shield className="w-5 h-5 text-apple-blue" />
                       <h3 className="font-bold text-base sm:text-lg">Terms & Conditions</h3>
                    </div>
                    <div className="text-xs sm:text-sm text-apple-secondary space-y-4 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                       <section className="space-y-2">
                          <p className="font-bold text-apple-text">1. Preliminary Estimate</p>
                          <p>The value shown is a non-binding estimate based on your self-reported condition. Final value is determined only after physical inspection at our service center.</p>
                       </section>
                       <section className="space-y-2">
                          <p className="font-bold text-apple-text">2. Data Erasure & Privacy</p>
                          <p>You must disable "Find My {category}" and sign out of iCloud/Google accounts. We perform a military-grade data wipe upon receipt, and iResell is not responsible for any data not backed up by the user.</p>
                       </section>
                       <section className="space-y-2">
                          <p className="font-bold text-apple-text">3. Device Pickup & Verification</p>
                          <p>Our technician will verify the IMEI/Serial number, battery health, and display authenticity. If the device is found to have non-original parts or liquid damage not reported, the offer will be adjusted accordingly.</p>
                       </section>
                       <section className="space-y-2">
                          <p className="font-bold text-apple-text">4. Counterfeit & Stolen Property</p>
                          <p>We do not accept devices reported as lost or stolen. All serial numbers are checked against global databases. Attempting to trade in stolen property will result in immediate report to local authorities.</p>
                       </section>
                       <section className="space-y-2">
                          <p className="font-bold text-apple-text">5. Payout Terms</p>
                          <p>Payments are issued via Bank Transfer or Digital Wallet (WhatsApp Pay/UPI) immediately after the final price is approved by the user during the pickup inspection.</p>
                       </section>
                    </div>
                    <label className="flex items-start space-x-3 sm:space-x-4 cursor-pointer group p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-apple-border">
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-apple-border text-apple-blue focus:ring-apple-blue/20 mt-0.5 shrink-0" 
                         checked={termsAccepted}
                         onChange={e => setTermsAccepted(e.target.checked)}
                       />
                       <span className="text-xs sm:text-sm font-medium text-apple-text leading-relaxed">
                          I agree to the Terms & Conditions and understand that the final trade-in value is subject to professional inspection.
                       </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                     <button onClick={() => setStep(1)} className="apple-button-secondary w-full sm:flex-1 py-4 sm:py-6">Back</button>
                     <button 
                       disabled={!customerInfo.name || !customerInfo.phone || !termsAccepted || loading}
                       onClick={handleGetEstimate}
                       className="apple-button-primary w-full sm:flex-[2] py-4 sm:py-6 text-base sm:text-lg flex items-center justify-center"
                     >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-3" />
                            Get My Estimate
                          </>
                        )}
                     </button>
                  </div>
               </motion.div>
            )}

            {step === 3 && estimate && (
               <motion.div 
                 key="step3"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="apple-card bg-zinc-900 text-white p-6 sm:p-12 space-y-6 sm:space-y-10 relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-apple-blue/20 blur-[100px]" />
                 
                 <header className="space-y-2 sm:space-y-4 relative">
                    <div className="flex items-center space-x-3 text-apple-blue">
                       <Sparkles className="w-5 h-5" />
                       <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Evaluation Complete</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Your trade-in estimate.</h2>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center relative z-10">
                    <div className="space-y-6 sm:space-y-8">
                       <div className="space-y-2">
                          <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest">Device Details</p>
                          <p className="text-xl sm:text-2xl font-bold">{device} ({capacity})</p>
                          <p className="text-zinc-400 text-xs sm:text-sm">{condition} Condition • {battery}% Battery</p>
                       </div>

                       <div className="pt-2 sm:pt-4">
                          <p className="text-zinc-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Verification Status</p>
                          <p className="text-apple-blue font-bold text-xs sm:text-sm">Ready for physical inspection</p>
                       </div>
                    </div>

                    <div className="apple-card bg-white text-black p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-2xl">
                       <div className="space-y-1">
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-apple-secondary">Estimated Credit</span>
                          <p className="text-5xl sm:text-7xl font-bold tracking-tighter">₹{estimate.estimatedPrice}</p>
                       </div>
                       
                       <div className="space-y-4">
                          <button 
                            onClick={() => setStep(4)}
                            className="apple-button-primary w-full py-4 sm:py-6 text-base sm:text-lg hover:scale-[1.02] active:scale-95"
                          >
                            Accept & Confirm
                          </button>
                          <p className="text-center text-[9px] sm:text-[10px] text-apple-secondary font-bold uppercase tracking-widest">Reference: #{lastOrderId.slice(-6).toUpperCase()}</p>
                       </div>
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: Contextual Info */}
        <div className="space-y-6 sm:space-y-8 w-full">
          <div className="apple-card bg-apple-blue text-white p-6 sm:p-10 space-y-4 sm:space-y-6 shadow-xl shadow-apple-blue/25">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
             </div>
             <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold">Global Standards</h3>
                <p className="text-xs sm:text-sm text-apple-blue-light/80 leading-relaxed font-medium">Our trade-in values are aligned with global fair market standards and professional refurbishment costs.</p>
             </div>
          </div>
          
          <div className="apple-card p-6 sm:p-8 bg-apple-gray/50 border border-apple-border/50 space-y-3 sm:space-y-4">
             <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-apple-blue" />
                <span className="font-bold text-xs sm:text-sm">Safe & Secure</span>
             </div>
             <p className="text-xs text-apple-secondary leading-relaxed">Your data is wiped using industrial tools. We provide a Certificate of Destruction upon request.</p>
          </div>
        </div>
      </div>

      {/* Live Trade-in Catalog Sheet */}
      {tradeInPrices.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="apple-card p-6 sm:p-10 bg-apple-gray/20 border border-apple-border/50 space-y-6 sm:space-y-8 mt-10 sm:mt-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="space-y-1">
                <span className="text-apple-blue font-bold text-xs uppercase tracking-widest flex items-center">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" /> Live Reference Trade-In Value Catalog
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Current Valuation Matrices</h3>
              </div>
              <p className="text-xs text-apple-secondary md:text-right font-medium max-w-md">Our base trade-in matrices synced live across all pages via InsForge. Select any model above to run your specific diagnostic evaluation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
             {tradeInPrices.map((tp) => (
                <div key={tp.id} className="apple-card p-5 sm:p-6 bg-white border border-apple-border shadow-xs hover:shadow-md transition-all space-y-3 sm:space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base text-apple-text">{tp.deviceName}</span>
                      <Sparkles className="w-4 h-4 text-apple-blue" />
                   </div>
                   <div className="border-t border-apple-border/30 pt-3 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                         <span className="text-apple-secondary">Flawless</span>
                         <span className="text-green-600 font-bold font-mono">₹{tp.prices?.Flawless || 'Estimate Only'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                         <span className="text-apple-secondary">Good</span>
                         <span className="text-green-600 font-bold font-mono">₹{tp.prices?.Good || 'Estimate Only'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                         <span className="text-apple-secondary">Fair</span>
                         <span className="text-green-600 font-bold font-mono">₹{tp.prices?.Fair || 'Estimate Only'}</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </motion.div>
      )}
    </div>
    </div>
  );
}
