import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, Clock, CheckCircle2, ChevronRight, Wrench, Smartphone, Laptop, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const REPAIR_STATUS_ORDER = [
  "Device Received",
  "Diagnosis Started",
  "Waiting for Parts",
  "Repair In Progress",
  "Quality Check",
  "Ready for Pickup",
  "Delivered"
];

const SELL_STATUS_ORDER = [
  "Estimate Submitted",
  "Inspection Pending",
  "Inspection Completed",
  "Final Price Approved",
  "Pickup Scheduled",
  "Completed"
];

export default function Tracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    let isSubscribed = true;

    const fetchOrders = async () => {
      try {
        const [repairsRes, sellsRes] = await Promise.all([
          fetch(`/api/repair-orders?userId=${user.uid}`),
          fetch(`/api/sell-orders?userId=${user.uid}`)
        ]);

        if (repairsRes.ok && sellsRes.ok) {
          const repairsData = await repairsRes.json();
          const sellsData = await sellsRes.json();

          const repairs = repairsData.map((o: any) => ({ ...o, orderType: 'repair' }));
          const sells = sellsData.map((o: any) => ({ ...o, orderType: 'sell' }));

          const combined = [...repairs, ...sells].sort((a, b) => 
            new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
          );

          if (isSubscribed) {
            setOrders(combined);
            setSelectedOrder((prevSelected: any) => {
              if (!prevSelected && combined.length > 0) return combined[0];
              if (prevSelected) {
                const refreshed = combined.find(o => o.id === prevSelected.id);
                return refreshed || prevSelected;
              }
              return null;
            });
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[Tracking] Error loading user orders:', err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user]);

  if (!user) return <div className="h-screen flex items-center justify-center text-xl font-bold">Please sign in to track your orders.</div>;
  if (loading) return <div className="h-screen flex items-center justify-center">Updating track status...</div>;

  const isRepair = selectedOrder?.orderType === 'repair';
  const statusOrder = isRepair ? REPAIR_STATUS_ORDER : SELL_STATUS_ORDER;
  const currentStatusIndex = statusOrder.indexOf(selectedOrder?.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-20 pb-40 space-y-8 sm:space-y-12">
      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">Track.</h1>
        <p className="text-lg sm:text-2xl text-apple-secondary">Real-time updates on your device journey.</p>
      </div>

      {orders.length === 0 ? (
        <div className="apple-card p-10 sm:p-20 text-center space-y-6">
          <Package className="w-12 h-12 sm:w-16 sm:h-16 text-apple-secondary/30 mx-auto" />
          <p className="text-base sm:text-xl text-apple-secondary">No active requests found. <br/>When you book a repair or start a trade-in, it will appear here.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link to="/repair" className="apple-button-primary py-3.5 px-6">Book a repair</Link>
            <Link to="/sell" className="apple-button-secondary py-3.5 px-6">Start Trade-in</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Order List */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-apple-secondary ml-2">Your Activity ({orders.length})</h3>
            <div className="space-y-2.5 sm:space-y-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full apple-card p-4 sm:p-6 flex items-center justify-between transition-all ${selectedOrder?.id === order.id ? 'ring-2 ring-apple-blue border-transparent' : ''}`}
                >
                  <div className="text-left flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2.5 sm:p-3 bg-apple-gray rounded-2xl">
                      {order.orderType === 'repair' ? <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-apple-secondary" /> : <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-apple-secondary" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base flex items-center">
                        {order.deviceType}
                        <span className={`ml-2 text-[8px] px-1.5 py-0.5 rounded-full border ${order.orderType === 'repair' ? 'border-apple-blue text-apple-blue' : 'border-green-500 text-green-500'} uppercase font-bold`}>
                          {order.orderType}
                        </span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-apple-blue font-bold uppercase mt-1">{order.status}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-apple-secondary" />
                </button>
              ))}
            </div>
          </div>

          {/* Details View */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedOrder && (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="apple-card p-5 sm:p-12 space-y-8 sm:space-y-12"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-apple-border pb-8 sm:pb-12">
                    <div className="space-y-1">
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-apple-secondary">{isRepair ? 'Repair' : 'Trade-in'} Reference</p>
                      <p className="text-xl sm:text-2xl font-bold font-mono tracking-tighter">#{selectedOrder.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-apple-secondary">{isRepair ? 'Est. Delivery' : 'Next Step'}</p>
                      <p className="text-xl sm:text-2xl font-bold">
                        {isRepair ? (selectedOrder.diagnosis?.estimatedTime || 'Pending') : 'Technician Review'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-8">
                    <div className="relative pt-4">
                      {/* Line */}
                      <div className="absolute top-7 left-0 right-0 h-1 bg-apple-gray" />
                      <div 
                        className="absolute top-7 left-0 h-1 bg-apple-blue transition-all duration-1000" 
                        style={{ width: `${Math.max(0, (currentStatusIndex / (statusOrder.length - 1))) * 100}%` }}
                      />
                      
                      <div className="flex justify-between relative px-2">
                        {statusOrder.map((s, i) => (
                          <div key={s} className="flex flex-col items-center group cursor-help" title={s}>
                            <div className={`w-3 h-3 rounded-full z-10 transition-colors duration-500 ${
                              currentStatusIndex >= i ? 'bg-apple-blue ring-4 ring-blue-100' : 'bg-apple-secondary/30'
                            }`} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl sm:text-3xl font-bold">{selectedOrder.status}</h2>
                      <p className="text-xs sm:text-sm text-apple-secondary mt-1 sm:mt-2">Update received on {new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Diagnosis & Cost / Estimate & Condition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 pt-6 sm:pt-8 border-t border-apple-border/50">
                    <div className="space-y-6 sm:space-y-8">
                       <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-apple-secondary flex items-center">
                          {isRepair ? <><Wrench className="w-3 h-3 mr-2" /> Diagnosis Brief</> : <><Smartphone className="w-3 h-3 mr-2" /> Device Info</>}
                        </h4>
                        <p className="text-sm font-medium leading-relaxed">
                          {isRepair ? selectedOrder.problem : `${selectedOrder.deviceType} (${selectedOrder.capacity})`}
                        </p>
                        {!isRepair && (
                          <div className="space-y-2 pt-2">
                             <div className="flex justify-between text-xs font-bold">
                               <span className="text-apple-secondary">CONDITION</span>
                               <span>{selectedOrder.condition}</span>
                             </div>
                             <div className="flex justify-between text-xs font-bold">
                               <span className="text-apple-secondary">BATTERY HEALTH</span>
                               <span>{selectedOrder.batteryHealth}%</span>
                             </div>
                          </div>
                        )}
                      </div>

                      {selectedOrder.notes && (
                        <div className="space-y-3 p-5 sm:p-6 bg-apple-blue/5 rounded-2xl border border-apple-blue/10">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-apple-blue flex items-center">Technician Note</h4>
                          <p className="text-sm font-medium leading-relaxed italic">"{selectedOrder.notes}"</p>
                        </div>
                      )}

                      {isRepair && (selectedOrder.partsUsed?.length > 0 || selectedOrder.diagnosis?.partsRequired?.length > 0) && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-apple-secondary">Parts Details</h4>
                          <div className="flex flex-wrap gap-2">
                            {(selectedOrder.partsUsed || selectedOrder.diagnosis?.partsRequired || []).map((p: string) => (
                              <span key={p} className="px-3 py-1.5 bg-apple-gray rounded-xl text-[10px] font-bold text-apple-secondary">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6 sm:space-y-8">
                      <div className="space-y-3 sm:space-y-4 bg-apple-gray/30 p-5 sm:p-8 rounded-3xl">
                        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-apple-secondary flex items-center"><Clock className="w-3 h-3 mr-2" /> {isRepair ? 'Service Charges' : 'Trade-in Estimate'}</h4>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-xs sm:text-sm text-apple-secondary">{isRepair ? 'Total Estimate' : 'Guaranteed Price'}</span>
                          <span className="text-2xl sm:text-4xl font-bold font-mono tracking-tighter">₹{isRepair ? selectedOrder.price : selectedOrder.estimate}</span>
                        </div>
                      </div>

                      {isRepair && selectedOrder.repairPhotos?.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-apple-secondary">Progress Photos</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedOrder.repairPhotos.map((url: string, i: number) => (
                              <motion.div 
                                key={i} 
                                whileHover={{ scale: 1.05 }}
                                className="aspect-[4/3] rounded-2xl overflow-hidden border border-apple-border cursor-pointer shadow-sm"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <img src={url} className="w-full h-full object-cover" alt={`Repair progress ${i+1}`} referrerPolicy="no-referrer" />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
