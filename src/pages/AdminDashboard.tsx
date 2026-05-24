import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ShoppingBag, Wrench, Smartphone, Settings, Plus, X, Edit, Trash2, Camera, TrendingUp, Users, RefreshCcw, DollarSign, ArrowRight, Eye, EyeOff, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DEVICE_TREE, IPHONES } from '../constants/deviceList';
import { updateAppConfig, subscribeToConfig, AppConfig, DEFAULT_CONFIG } from '../services/configService';
import InsForgePanel from '../components/InsForgePanel';

const CAPACITIES = ['64GB', '128GB', '256GB', '512GB', '1TB'];
const CONDITIONS = ['Flawless', 'Good', 'Fair', 'Broken'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [products, setProducts] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [sells, setSells] = useState<any[]>([]);
  const [tradeInPrices, setTradeInPrices] = useState<any[]>([]);
  const [repairPrices, setRepairPrices] = useState<any[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [pricingSubTab, setPricingSubTab] = useState<'Trade-in' | 'Repair'>('Trade-in');
  const [selectedTradeInModel, setSelectedTradeInModel] = useState({ category: 'iPhone', model: IPHONES[0] });
  const [selectedRepairModel, setSelectedRepairModel] = useState({ category: 'iPhone', model: IPHONES[0] });
  const [priceMatrix, setPriceMatrix] = useState<any>({});
  const [repairPriceMatrix, setRepairPriceMatrix] = useState<any>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [repairEditData, setRepairEditData] = useState({ notes: '', photos: '', parts: '' });
  const [selectedSell, setSelectedSell] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [sellEditData, setSellEditData] = useState({ notes: '', suggestions: '', warrantyNotes: '' });
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    category: 'iPhone', 
    price: 0, 
    description: '', 
    stock: 10, 
    images: '' // Comma separated
  });

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        const [pRes, rRes, sRes, tRes, rpRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/repair-orders'),
          fetch('/api/sell-orders'),
          fetch('/api/trade-in-prices'),
          fetch('/api/repair-prices')
        ]);

        if (pRes.ok && rRes.ok && sRes.ok && tRes.ok && rpRes.ok) {
          const [p, r, s, t, rp] = await Promise.all([
            pRes.json(),
            rRes.json(),
            sRes.json(),
            tRes.json(),
            rpRes.json()
          ]);
          if (isSubscribed) {
            setProducts(p);
            setRepairs(r);
            setSells(s);
            setTradeInPrices(t);
            setRepairPrices(rp);
          }
        }
      } catch (e) {
        console.error('[AdminDashboard] Error polling live data:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    const unsubConfig = subscribeToConfig(setConfig);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      unsubConfig();
    };
  }, []);

  useEffect(() => {
    // Load price matrix for selected model
    const existing = tradeInPrices.find(p => p.id === selectedTradeInModel.model.replace(/\s+/g, '-').toLowerCase());
    if (existing) {
      setPriceMatrix(existing.prices || {});
    } else {
      setPriceMatrix({});
    }
  }, [selectedTradeInModel, tradeInPrices]);

  useEffect(() => {
    // Load repair price matrix for selected model
    const existing = repairPrices.find(p => p.id === selectedRepairModel.model.replace(/\s+/g, '-').toLowerCase());
    if (existing) {
      setRepairPriceMatrix(existing.prices || {});
    } else {
      setRepairPriceMatrix({});
    }
  }, [selectedRepairModel, repairPrices]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imgList = newProduct.images.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const productToSave = {
        ...newProduct,
        images: imgList.length > 0 ? imgList : ['https://images.unsplash.com/photo-1707018042456-4258c49e77f0?q=80&w=2070&auto=format&fit=crop'],
        createdAt: new Date().toISOString()
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSave)
      });
      if (!res.ok) throw new Error();

      setShowAddModal(false);
      setNewProduct({ name: '', category: 'iPhone', price: 0, description: '', stock: 10, images: '' });
    } catch (error) {
      console.error('[AdminDashboard] Error adding product:', error);
      alert('Failed to add product.');
    }
  };

  const updateRepairStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/repair-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      console.error('[AdminDashboard] Error updating repair status:', error);
    }
  };

  const handleUpdateRepairDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;

    try {
      const photosList = repairEditData.photos.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const partsList = repairEditData.parts.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      const res = await fetch(`/api/repair-orders/${selectedRepair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: repairEditData.notes,
          repairPhotos: photosList,
          partsUsed: partsList,
          updatedAt: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error();
      setSelectedRepair(null);
    } catch (error) {
      console.error('[AdminDashboard] Error updating repair details:', error);
    }
  };

  const updateSellStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/sell-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
    } catch (error) {
      console.error('[AdminDashboard] Error updating sell status:', error);
    }
  };

  const handleUpdateSellDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSell || !selectedOrder) return;

    try {
      const res = await fetch(`/api/sell-orders/${selectedSell.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: sellEditData.notes,
          finalPrice: selectedOrder.finalPrice || selectedSell.estimate,
          suggestions: sellEditData.suggestions || '',
          warrantyNotes: sellEditData.warrantyNotes || '',
          updatedAt: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error();
      setSelectedSell(null);
      setSelectedOrder(null);
    } catch (error) {
      console.error('[AdminDashboard] Error updating sell details:', error);
    }
  };

  const data = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 6000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 4390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const handleSavePrices = async () => {
    const docId = selectedTradeInModel.model.replace(/\s+/g, '-').toLowerCase();
    try {
      const res = await fetch(`/api/trade-in-prices/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docId,
          deviceName: selectedTradeInModel.model,
          prices: priceMatrix,
          updatedAt: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error();
      alert('Prices updated!');
    } catch (e) {
      console.error(e);
      alert('Error updating trade-in prices.');
    }
  };

  const handleSaveRepairPrices = async () => {
    const docId = selectedRepairModel.model.replace(/\s+/g, '-').toLowerCase();
    try {
      const res = await fetch(`/api/repair-prices/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docId,
          deviceName: selectedRepairModel.model,
          prices: repairPriceMatrix,
          updatedAt: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error();
      alert('Repair prices updated!');
    } catch (e) {
      console.error(e);
      alert('Error saving repair prices.');
    }
  };

  const SIDEBAR = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Products', icon: ShoppingBag },
    { name: 'Repairs', icon: Wrench },
    { name: 'Trade-ins', icon: RefreshCcw },
    { name: 'Pricing', icon: DollarSign },
    { name: 'InsForge Database', icon: Database },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-apple-gray overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-apple-border flex flex-col">
        <div className="p-8 pb-12">
          <h2 className="text-xl font-bold flex items-center"><Smartphone className="mr-2 w-5 h-5 text-apple-blue" /> {config.storeName} Admin</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {SIDEBAR.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.name ? 'bg-apple-blue text-white shadow-lg' : 'text-apple-secondary hover:bg-apple-gray'}`}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold">{activeTab}</h1>
            <div className="flex space-x-4">
              {activeTab === 'Overview' && (
                <button 
                  onClick={async () => {
                    const sampleProducts = [
                      {
                        id: 'iphone-16-pro-max',
                        name: 'iPhone 16 Pro Max',
                        category: 'iPhone',
                        price: 144900,
                        description: 'Featuring a stunning titanium design, the new Camera Control, and the powerful A18 Pro chip. Built for Apple Intelligence.',
                        stock: 25,
                        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d25fa?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'iphone-16-pro',
                        name: 'iPhone 16 Pro',
                        category: 'iPhone',
                        price: 119900,
                        description: 'A massive leap in battery life, stunning titanium finishes, and advanced professional camera systems with Camera Control.',
                        stock: 30,
                        images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'iphone-16',
                        name: 'iPhone 16',
                        category: 'iPhone',
                        price: 79900,
                        description: 'With the all-new Action button, Camera Control, A18 chip, and stunning new color-infused glass back finishes.',
                        stock: 45,
                        images: ['https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'iphone-15-pro-max',
                        name: 'iPhone 15 Pro Max',
                        category: 'iPhone',
                        price: 134900,
                        description: 'The ultimate Pro. Precision titanium chassis, 5x Telephoto optical zoom camera, customizable Action button.',
                        stock: 15,
                        images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'iphone-15',
                        name: 'iPhone 15',
                        category: 'iPhone',
                        price: 69900,
                        description: 'Dynamic Island comes to iPhone 15. High-resolution 48MP main camera and modern frosted glass design.',
                        stock: 50,
                        images: ['https://images.unsplash.com/photo-1695048133142-1a20484d25fa?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'macbook-pro-16-m4-max',
                        name: 'MacBook Pro 16" (M4 Max)',
                        category: 'MacBook',
                        price: 349900,
                        description: 'Designed for extreme workflows. Up to 128GB unified memory support, Liquid Retina XDR screen, and the industry-redefining M4 Max chip.',
                        stock: 10,
                        images: ['https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'macbook-pro-14-m4',
                        name: 'MacBook Pro 14" (M4)',
                        category: 'MacBook',
                        price: 169900,
                        description: 'The standard of performance. A brilliant Liquid Retina XDR display, up to 24 hours of battery life, and high bandwidth M4 power.',
                        stock: 20,
                        images: ['https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'macbook-air-13-m3',
                        name: 'MacBook Air 13-inch (M3)',
                        category: 'MacBook',
                        price: 114900,
                        description: 'Incredibly thin and fast. The world’s most popular laptop, powered by the cutting-edge 3nm M3 chip.',
                        stock: 40,
                        images: ['https://images.unsplash.com/photo-1517336714460-4c740608544a?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'ipad-pro-13-m4',
                        name: 'iPad Pro 13" (M4)',
                        category: 'iPad',
                        price: 129900,
                        description: 'Thinpossible. Groundbreaking Tandem OLED display, blistering performance from the next-generation M4 chip.',
                        stock: 15,
                        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'ipad-air-m2',
                        name: 'iPad Air 11" (M2)',
                        category: 'iPad',
                        price: 59900,
                        description: 'Light. Bright. Full of might. Perfect for student work, graphics rendering, and everyday multimedia with Apple Pencil support.',
                        stock: 25,
                        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'apple-watch-ultra-2',
                        name: 'Apple Watch Ultra 2',
                        category: 'Watch',
                        price: 89900,
                        description: 'The ultimate sports and adventure watch. Featuring a majestic titanium casing, 3000-nits screen, and dual-frequency GPS.',
                        stock: 12,
                        images: ['https://images.unsplash.com/photo-1546868881-be0c937448b9?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'apple-watch-series-10',
                        name: 'Apple Watch Series 10',
                        category: 'Watch',
                        price: 46900,
                        description: 'Our thinnest design yet, with our biggest display ever. Advanced health tracking, and fast-charge technology.',
                        stock: 35,
                        images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'airpods-pro-2',
                        name: 'AirPods Pro 2 (USB-C)',
                        category: 'AirPods',
                        price: 24900,
                        description: 'Intelligent noise cancellation. Immersive Adaptive Audio environment. Re-engineered acoustics with pristine crisp sounds.',
                        stock: 80,
                        images: ['https://images.unsplash.com/photo-1588423770574-9169244fd57b?q=80&w=600&auto=format&fit=crop']
                      },
                      {
                        id: 'airpods-max-usb-c',
                        name: 'AirPods Max (USB-C)',
                        category: 'AirPods',
                        price: 59900,
                        description: 'High-fidelity sensory dome over-ear audio experience. Optimal Active Noise Cancellation with Transparency mode.',
                        stock: 20,
                        images: ['https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600&auto=format&fit=crop']
                      }
                    ];
                    for (const p of sampleProducts) {
                      await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...p, id: p.id })
                      });
                    }
                    alert('Sample products seeded successfully!');
                  }}
                  className="apple-button-secondary py-2 px-4 text-sm"
                >
                  Seed Sample Data
                </button>
              )}
              {activeTab === 'Products' && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="apple-button-primary py-2 px-4 flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </button>
              )}
            </div>
          </div>

          {activeTab === 'Settings' && (
            <div className="max-w-2xl space-y-8 pb-20">
               <div className="apple-card p-10 space-y-8">
                  <div className="space-y-1">
                     <h2 className="text-2xl font-bold">General Settings</h2>
                     <p className="text-sm text-apple-secondary">Configure your store identity and visibility.</p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Store Name</label>
                        <input 
                          type="text" 
                          className="w-full apple-card p-4 bg-apple-gray border-none font-bold"
                          value={config.storeName}
                          onChange={e => updateAppConfig({...config, storeName: e.target.value})}
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Hidden Sections</label>
                        <div className="grid grid-cols-2 gap-4">
                           {['Store', 'Sell', 'Repair', 'About'].map(section => {
                              const isHidden = config.hiddenSections.includes(section);
                              return (
                                <button 
                                  key={section}
                                  onClick={() => {
                                    const next = isHidden 
                                      ? config.hiddenSections.filter(s => s !== section)
                                      : [...config.hiddenSections, section];
                                    updateAppConfig({...config, hiddenSections: next});
                                  }}
                                  className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${isHidden ? 'border-red-500 bg-red-50' : 'border-apple-border hover:border-apple-blue'}`}
                                >
                                   <div className="flex items-center space-x-3">
                                      {isHidden ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-apple-blue" />}
                                      <span className={`font-bold text-sm ${isHidden ? 'text-red-500' : ''}`}>{section}</span>
                                   </div>
                                   <div className={`w-10 h-5 rounded-full relative transition-colors ${isHidden ? 'bg-red-500' : 'bg-apple-gray'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isHidden ? 'right-1' : 'left-1'}`} />
                                   </div>
                                </button>
                              );
                           })}
                        </div>
                        <p className="text-[10px] text-apple-secondary font-medium">Hiding a section will remove its link from the navigation bar.</p>
                     </div>
                  </div>
               </div>
               
               <div className="apple-card p-10 bg-zinc-900 text-white space-y-6">
                  <h3 className="text-xl font-bold">System Information</h3>
                  <div className="space-y-4 text-sm text-zinc-400">
                     <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Database Environment</span>
                        <span className="text-apple-blue font-bold">Production</span>
                     </div>
                     <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Total Products</span>
                        <span className="text-white font-bold">{products.length}</span>
                     </div>
                     <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>Active Repairs</span>
                        <span className="text-white font-bold">{repairs.filter(r => r.status !== 'Delivered').length}</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'Overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: '₹128,430', trend: '+12.5%', icon: TrendingUp, color: 'text-green-500' },
                  { label: 'Repair Orders', value: repairs.length, trend: '4 Pending', icon: Wrench, color: 'text-orange-500' },
                  { label: 'Trade-in Credits', value: '₹12,400', trend: '8 This Week', icon: RefreshCcw, color: 'text-blue-500' },
                  { label: 'New Customers', value: '1,240', trend: '+15%', icon: Users, color: 'text-purple-500' },
                ].map((stat) => (
                  <div key={stat.label} className="apple-card p-6 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-apple-secondary mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-[10px] mt-2 font-bold ${stat.color}`}>{stat.trend}</p>
                    </div>
                    <stat.icon className={`w-5 h-5 ${stat.color} opacity-40`} />
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="apple-card p-8 h-[400px] flex flex-col">
                  <h3 className="font-bold mb-8">Revenue Forecast</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#0071E3" strokeWidth={4} dot={false} animationDuration={2000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="apple-card p-8 h-[400px] flex flex-col">
                  <h3 className="font-bold mb-8">Category Distribution</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'iPhone', sales: 400 },
                        { name: 'Mac', sales: 300 },
                        { name: 'iPad', sales: 200 },
                        { name: 'Watch', sales: 278 },
                        { name: 'Accessories', sales: 189 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Bar dataKey="sales" fill="#0071E3" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Products' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="apple-card p-6 flex items-center space-x-4">
                  <img src={p.images?.[0]} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-apple-secondary">₹{p.price} • Stock: {p.stock}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button className="text-apple-blue hover:opacity-70"><Edit className="w-4 h-4" /></button>
                    <button onClick={async () => {
                      if (confirm('Are you sure you want to delete this product?')) {
                        const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
                        if (!res.ok) alert('Failed to delete product.');
                      }
                    }} className="text-red-500 hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Repairs' && (
            <div className="space-y-4">
              {repairs.map(r => (
                <div key={r.id} className="apple-card p-6 flex items-center justify-between group">
                  <div className="flex items-center space-x-6">
                    <div className="p-4 bg-apple-gray rounded-2xl cursor-pointer hover:bg-apple-border transition-colors" onClick={() => {
                        setSelectedRepair(r);
                        setRepairEditData({ 
                          notes: r.notes || '', 
                          photos: (r.repairPhotos || []).join(', '), 
                          parts: (r.partsUsed || []).join(', ') 
                        });
                      }}>
                      <Wrench className="w-6 h-6 text-apple-secondary" />
                    </div>
                    <div>
                      <p className="font-bold flex items-center">
                        {r.deviceType}
                        {r.notes && <span className="ml-2 w-2 h-2 bg-apple-blue rounded-full" title="Has notes" />}
                      </p>
                      <p className="text-xs text-apple-secondary">{r.problem}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <select 
                      defaultValue={r.status}
                      onChange={(e) => updateRepairStatus(r.id, e.target.value)}
                      className="bg-apple-gray text-xs font-bold border-none rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-apple-blue"
                    >
                      {['Device Received', 'Diagnosis Started', 'Waiting for Parts', 'Repair In Progress', 'Quality Check', 'Ready for Pickup', 'Delivered'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <p className="text-sm font-bold min-w-[60px] text-right">₹{r.price}</p>
                    <button 
                      onClick={() => {
                        setSelectedRepair(r);
                        setRepairEditData({ 
                          notes: r.notes || '', 
                          photos: (r.repairPhotos || []).join(', '), 
                          parts: (r.partsUsed || []).join(', ') 
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-apple-blue transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Trade-ins' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="apple-card p-6 bg-apple-blue/5 border border-apple-blue/10">
                    <p className="text-xs font-bold text-apple-blue uppercase tracking-widest">Pending Evaluations</p>
                    <p className="text-4xl font-bold mt-2">{sells.filter(s => s.status === 'Estimate Submitted').length}</p>
                 </div>
                 <div className="apple-card p-6">
                    <p className="text-xs font-bold text-apple-secondary uppercase tracking-widest">In Inspection</p>
                    <p className="text-4xl font-bold mt-2">{sells.filter(s => s.status === 'Inspection Pending' || s.status === 'Final Inspection').length}</p>
                 </div>
                 <div className="apple-card p-6">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Monthly Trade-ins</p>
                    <p className="text-4xl font-bold mt-2">{sells.filter(s => s.status === 'Completed').length}</p>
                 </div>
              </div>

              <div className="space-y-4">
                {sells.map(s => (
                  <div key={s.id} className="apple-card p-8 flex flex-col md:flex-row md:items-center justify-between group gap-6 border border-apple-border/50 hover:border-apple-blue/30 transition-all">
                     <div className="flex items-start space-x-6">
                        <div className="p-4 bg-apple-gray rounded-2xl cursor-pointer hover:bg-apple-border transition-colors grow-0" onClick={() => {
                          setSelectedOrder(s); // Update global selectedOrder for price logic
                          setSelectedSell(s);
                          setSellEditData({ 
                            notes: s.notes || '',
                            suggestions: s.suggestions || '',
                            warrantyNotes: s.warrantyNotes || ''
                          });
                        }}>
                          <RefreshCcw className="w-8 h-8 text-apple-secondary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-lg flex items-center">
                            {s.deviceType} ({s.capacity})
                            {s.notes && <span className="ml-2 w-2 h-2 bg-apple-blue rounded-full" />}
                          </p>
                          <div className="flex flex-wrap gap-2 items-center text-sm text-apple-secondary">
                             <span className="font-medium text-apple-text">{s.customerName}</span>
                             <span className="opacity-30">•</span>
                             <span className="font-mono">{s.phoneNumber}</span>
                             <span className="opacity-30">•</span>
                             <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                               s.condition === 'Flawless' ? 'bg-green-100 text-green-600' : 
                               s.condition === 'Broken' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                             }`}>{s.condition}</span>
                          </div>
                        </div>
                     </div>

                     <div className="flex items-center space-x-8">
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">Est. Payout</p>
                           <p className="text-2xl font-bold font-mono tracking-tighter">₹{s.estimate}</p>
                        </div>
                        
                        <div className="space-y-2">
                           <select 
                            defaultValue={s.status}
                            onChange={(e) => updateSellStatus(s.id, e.target.value)}
                            className={`text-[10px] font-bold border-none rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-apple-blue appearance-none cursor-pointer ${
                              s.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-apple-gray'
                            }`}
                          >
                            {["Estimate Submitted", "Inspection Pending", "Inspection Completed", "Final Price Approved", "Pickup Scheduled", "Completed"].map(st => (
                              <option key={st} value={st} className="bg-white text-black">{st}</option>
                            ))}
                          </select>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedOrder(s);
                            setSelectedSell(s);
                            setSellEditData({ 
                              notes: s.notes || '',
                              suggestions: s.suggestions || '',
                              warrantyNotes: s.warrantyNotes || ''
                            });
                          }}
                          className="p-3 rounded-full hover:bg-apple-gray text-apple-blue transition-colors"
                          title="Manage Trade-in"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Pricing' && (
            <div className="space-y-8">
              <div className="apple-card p-4 bg-white/50 border border-apple-border flex space-x-2">
                <button 
                  onClick={() => setPricingSubTab('Trade-in')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${pricingSubTab === 'Trade-in' ? 'bg-apple-blue text-white' : 'text-apple-secondary hover:bg-white'}`}
                >
                  Trade-in Pricing
                </button>
                <button 
                  onClick={() => setPricingSubTab('Repair')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${pricingSubTab === 'Repair' ? 'bg-apple-blue text-white' : 'text-apple-secondary hover:bg-white'}`}
                >
                  Repair Pricing
                </button>
              </div>

              {pricingSubTab === 'Trade-in' ? (
                <div className="apple-card p-10 space-y-10">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold">Trade-in Price Matrix</h3>
                      <p className="text-sm text-apple-secondary">Configure trade-in estimates for devices based on storage and condition.</p>
                    </div>
                    <div className="flex gap-4">
                      <select 
                        className="apple-card p-4 bg-apple-gray border-none font-bold"
                        value={selectedTradeInModel.category}
                        onChange={(e) => setSelectedTradeInModel({ ...selectedTradeInModel, category: e.target.value, model: (DEVICE_TREE[e.target.value as keyof typeof DEVICE_TREE] || [])[0] })}
                      >
                        {Object.keys(DEVICE_TREE).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select 
                        className="apple-card p-4 bg-apple-gray border-none font-bold"
                        value={selectedTradeInModel.model}
                        onChange={(e) => setSelectedTradeInModel({ ...selectedTradeInModel, model: e.target.value })}
                      >
                        {(DEVICE_TREE[selectedTradeInModel.category as keyof typeof DEVICE_TREE] || []).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-4 text-[10px] uppercase tracking-widest text-apple-secondary">Capacity</th>
                          {CONDITIONS.map(c => (
                            <th key={c} className="text-center p-4 text-[10px] uppercase tracking-widest text-apple-secondary">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CAPACITIES.map(cap => (
                          <tr key={cap} className="border-t border-apple-border/30">
                            <td className="p-4 font-bold">{cap}</td>
                            {CONDITIONS.map(cond => (
                              <td key={cond} className="p-4">
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary font-bold text-xs">₹</span>
                                  <input 
                                    type="number"
                                    className="w-full apple-card p-3 pl-8 bg-apple-gray/50 border-none text-center font-mono font-bold"
                                    value={priceMatrix[cap]?.[cond] || ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setPriceMatrix({
                                        ...priceMatrix,
                                        [cap]: {
                                          ...(priceMatrix[cap] || {}),
                                          [cond]: val
                                        }
                                      });
                                    }}
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
  
                  <div className="flex justify-end pt-6">
                    <button onClick={handleSavePrices} className="apple-button-primary px-12">Update Store Estimates</button>
                  </div>
                </div>
              ) : (
                <div className="apple-card p-10 space-y-10">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold">Repair Price Matrix</h3>
                      <p className="text-sm text-apple-secondary">Set standard repair prices for any device model.</p>
                    </div>
                    <div className="flex gap-4">
                      <select 
                        className="apple-card p-4 bg-apple-gray border-none font-bold"
                        value={selectedRepairModel.category}
                        onChange={(e) => setSelectedRepairModel({ ...selectedRepairModel, category: e.target.value, model: (DEVICE_TREE[e.target.value as keyof typeof DEVICE_TREE] || [])[0] })}
                      >
                        {Object.keys(DEVICE_TREE).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select 
                        className="apple-card p-4 bg-apple-gray border-none font-bold"
                        value={selectedRepairModel.model}
                        onChange={(e) => setSelectedRepairModel({ ...selectedRepairModel, model: e.target.value })}
                      >
                        {(DEVICE_TREE[selectedRepairModel.category as keyof typeof DEVICE_TREE] || []).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Screen Replacement', 'Battery Replacement', 'Camera Repair', 'Charging Port', 'Back Glass', 'Logic Board', 'Liquid Damage Service', 'Other Service'].map(service => (
                      <div key={service} className="space-y-2">
                        <label className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest px-1">{service}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-secondary font-bold text-xs">₹</span>
                          <input 
                            type="number"
                            className="w-full apple-card p-4 pl-10 bg-apple-gray/50 border-none font-mono font-bold"
                            value={repairPriceMatrix[service] || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setRepairPriceMatrix({
                                ...repairPriceMatrix,
                                [service]: val
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-6">
                    <button onClick={handleSaveRepairPrices} className="apple-button-primary px-12">Update Repair Prices</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'InsForge Database' && (
            <InsForgePanel />
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <motion.form 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleAddProduct}
            className="apple-card p-10 w-full max-w-lg space-y-6 relative z-[101]"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">New Product</h3>
              <button type="button" onClick={() => setShowAddModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Product Category</label>
                 <select className="w-full apple-card p-4 bg-apple-gray/50 border-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value, name: ''})}>
                    {Object.keys(DEVICE_TREE).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Specific Model</label>
                 <select className="w-full apple-card p-4 bg-apple-gray/50 border-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}>
                    <option value="">Select model...</option>
                    {(DEVICE_TREE[newProduct.category as keyof typeof DEVICE_TREE] || []).map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
              </div>
              <div className="flex gap-4">
                <input type="number" placeholder="Price" className="flex-1 apple-card p-4 bg-apple-gray/50 border-none" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})}/>
                <input type="number" placeholder="Stock" className="w-1/3 apple-card p-4 bg-apple-gray/50 border-none" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}/>
              </div>
              <textarea placeholder="Description" className="w-full apple-card p-4 bg-apple-gray/50 border-none min-h-[100px]" required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              <div className="space-y-2">
                <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Images (Comma separated URLs)</label>
                <textarea 
                  placeholder="https://image1.jpg, https://image2.jpg" 
                  className="w-full apple-card p-4 bg-apple-gray/50 border-none min-h-[80px]" 
                  value={newProduct.images} 
                  onChange={e => setNewProduct({...newProduct, images: e.target.value})} 
                />
              </div>
            </div>
            <button type="submit" className="w-full apple-button-primary">Create Product</button>
          </motion.form>
        </div>
      )}

      {/* Sell Details Modal */}
      {selectedSell && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSell(null)} />
          <motion.form 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleUpdateSellDetails}
            className="apple-card p-10 w-full max-w-lg space-y-6 relative z-[101]"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Trade-in Details</h3>
                <p className="text-sm text-apple-secondary font-medium mt-1">{selectedSell.deviceType} • {selectedSell.customerName}</p>
              </div>
              <button type="button" onClick={() => setSelectedSell(null)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-apple-gray/30 rounded-2xl">
                     <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">User Email</p>
                     <p className="text-sm font-semibold">{selectedSell.userEmail}</p>
                  </div>
                  <div className="p-4 bg-apple-gray/30 rounded-2xl">
                     <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">Phone</p>
                     <p className="text-sm font-semibold">{selectedSell.phoneNumber}</p>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Internal Notes</label>
                  <textarea 
                    placeholder="Technician observation, payout info, etc..." 
                    className="w-full apple-card p-4 bg-apple-gray/50 border-none min-h-[150px]" 
                    value={sellEditData.notes} 
                    onChange={e => setSellEditData({...sellEditData, notes: e.target.value})} 
                  />
                </div>
                <div className="p-6 bg-apple-gray/30 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-apple-border">
                    <div>
                       <p className="text-[10px] font-bold text-apple-secondary uppercase tracking-widest">Initial Estimate</p>
                       <p className="text-lg font-bold">₹{selectedOrder.estimate}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-apple-secondary" />
                    <div>
                       <p className="text-[10px] font-bold text-apple-blue uppercase tracking-widest">Final Price</p>
                       <input 
                         type="number" 
                         className="w-24 bg-transparent border-none p-0 text-lg font-bold outline-hidden focus:ring-0"
                         defaultValue={selectedOrder.finalPrice || selectedOrder.estimate}
                         onChange={e => setSelectedOrder({...selectedOrder, finalPrice: parseInt(e.target.value)})}
                       />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                     <div className="space-y-1">
                        <span className="text-apple-secondary font-bold uppercase tracking-widest">Condition</span>
                        <p className="font-bold">{selectedOrder.condition}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-apple-secondary font-bold uppercase tracking-widest">Battery Health</span>
                        <p className="font-bold">{selectedOrder.batteryHealth}%</p>
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Repair Suggestions</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Screen replacement, Battery swap" 
                        className="w-full apple-card p-4 bg-apple-gray/50 border-none" 
                        value={sellEditData.suggestions || ''} 
                        onChange={e => setSellEditData({...sellEditData, suggestions: e.target.value})} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Warranty Notes</label>
                      <input 
                        type="text" 
                        placeholder="90-day technical warranty..." 
                        className="w-full apple-card p-4 bg-apple-gray/50 border-none" 
                        value={sellEditData.warrantyNotes || ''} 
                        onChange={e => setSellEditData({...sellEditData, warrantyNotes: e.target.value})} 
                      />
                   </div>
                </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setSelectedSell(null)} className="flex-1 apple-button-secondary font-bold">Discard</button>
              <button type="submit" className="flex-[2] apple-button-primary font-bold">
                Save & Update Estimate
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* Repair Details Modal */}
      {selectedRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRepair(null)} />
          <motion.form 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleUpdateRepairDetails}
            className="apple-card p-10 w-full max-w-2xl space-y-6 relative z-[101] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Repair Details</h3>
                <p className="text-sm text-apple-secondary font-medium mt-1">{selectedRepair.deviceType} • {selectedRepair.userEmail}</p>
              </div>
              <button type="button" onClick={() => setSelectedRepair(null)}><X className="w-6 h-6" /></button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Technician Notes</label>
                  <textarea 
                    placeholder="Describe the repair work, findings, or follow-up needed..." 
                    className="w-full apple-card p-4 bg-apple-gray/50 border-none min-h-[150px]" 
                    value={repairEditData.notes} 
                    onChange={e => setRepairEditData({...repairEditData, notes: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Parts Used (Comma separated)</label>
                  <textarea 
                    placeholder="Display, Battery, Adhesive..." 
                    className="w-full apple-card p-4 bg-apple-gray/50 border-none" 
                    value={repairEditData.parts} 
                    onChange={e => setRepairEditData({...repairEditData, parts: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-apple-secondary uppercase tracking-widest px-1">Repair Photos (URLs, comma separated)</label>
                  <textarea 
                    placeholder="https://image1.jpg, https://image2.jpg" 
                    className="w-full apple-card p-4 bg-apple-gray/50 border-none min-h-[80px]" 
                    value={repairEditData.photos} 
                    onChange={e => setRepairEditData({...repairEditData, photos: e.target.value})} 
                  />
                </div>

                {repairEditData.photos && (
                  <div className="grid grid-cols-2 gap-4">
                    {repairEditData.photos.split(',').map((url, i) => url.trim().startsWith('http') && (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-apple-border">
                        <img src={url.trim()} className="w-full h-full object-cover" alt={`Repair photo ${i+1}`} referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-6 bg-apple-gray/30 rounded-3xl space-y-2">
                  <p className="text-xs font-bold text-apple-secondary uppercase tracking-widest">Original Problem</p>
                  <p className="text-sm font-medium">{selectedRepair.problem}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setSelectedRepair(null)} className="flex-1 apple-button-secondary">Cancel</button>
              <button type="submit" className="flex-1 apple-button-primary">Save Changes</button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}

// No manual helper needed

