import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Truck, ShieldCheck, RefreshCcw, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStorage, setSelectedStorage] = useState('128GB');
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToBag = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const list = await res.json();
          const p = list.find((item: any) => item.id === id);
          if (p) {
            setProduct(p);
          }
        }
      } catch (error) {
        console.error('fetchProduct error:', error);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12 sm:space-y-24">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
        {/* Left: Sticky Image Gallery */}
        <div className="w-full lg:w-3/5 lg:sticky lg:top-24 h-fit">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="apple-card p-6 sm:p-12 aspect-square flex items-center justify-center overflow-hidden bg-apple-gray/30"
          >
            <img 
              src={product.images?.[0] || 'https://via.placeholder.com/800'} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain transition-transform duration-1000 hover:scale-105"
            />
          </motion.div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-8">
            {product.images?.map((img: string, i: number) => (
              <div key={i} className="apple-card p-2 sm:p-4 aspect-square bg-apple-gray/20">
                <img src={img} className="w-full h-full object-contain" alt="" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info Panels */}
        <div className="w-full lg:w-2/5 space-y-8 sm:space-y-12">
          <div className="space-y-4">
            <span className="text-apple-blue font-bold text-sm tracking-widest uppercase flex items-center">
              <Sparkles className="w-4 h-4 mr-2" /> Certified Selection
            </span>
            <h1 className="text-3.5xl sm:text-5xl font-bold tracking-tight leading-tight">{product.name}</h1>
            <p className="text-2xl font-medium">₹{product.price}</p>
          </div>

          <p className="text-base sm:text-lg text-apple-secondary leading-relaxed">{product.description}</p>

          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Storage. <span className="text-apple-secondary font-medium">Pick a size.</span></h3>
              <div className="grid grid-cols-2 gap-4">
                {['128GB', '256GB', '512GB', '1TB'].map((size) => (
                  <button 
                    key={size}
                    onClick={() => setSelectedStorage(size)}
                    className={`p-4 sm:p-6 border-2 rounded-3xl text-left transition-all ${selectedStorage === size ? 'border-apple-blue bg-apple-blue/5' : 'border-apple-border/50 hover:border-apple-secondary'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-base sm:text-lg">{size}</span>
                      <span className="text-[10px] sm:text-xs text-apple-secondary mt-1 font-semibold uppercase tracking-widest">+₹{size === '128GB' ? 0 : size === '256GB' ? 100 : size === '512GB' ? 200 : 400}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="apple-card p-6 sm:p-10 bg-zinc-900 text-white space-y-4 sm:space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-apple-blue/20 blur-[60px]" />
               <h3 className="text-xl sm:text-2xl font-bold z-10 relative">Trade In.</h3>
               <p className="text-sm text-zinc-400 z-10 relative">Get up to ₹650 toward your new {product.name} when you trade in your current device.</p>
               <Link to="/sell" className="apple-button-primary bg-white text-black hover:bg-zinc-200 inline-block z-10 relative">Estimate Trade-In</Link>
            </div>

            <div className="space-y-8 border-t border-apple-border/30 pt-8 sm:pt-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold">₹{product.price}</p>
                  <p className="text-xs text-apple-secondary mt-1 font-semibold">Or approx. ₹{Math.round(product.price / 12)}/mo. for 12 mo.*</p>
                </div>
                <button 
                  onClick={handleAddToBag}
                  disabled={isAdded}
                  className={`apple-button-primary w-full sm:w-auto px-12 h-14 sm:h-16 text-base sm:text-lg transition-all flex items-center justify-center sm:min-w-[200px] ${isAdded ? 'bg-green-600' : ''}`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Added to Bag
                    </>
                  ) : 'Add to Bag'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 text-sm font-medium text-apple-secondary">
                <div className="flex items-center space-x-3 p-4 bg-apple-gray/30 rounded-2xl">
                  <Truck className="w-5 h-5 text-apple-text" />
                  <span>Free next-day delivery</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-apple-gray/30 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-apple-text" />
                  <span>1 Year Certified Warranty</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-apple-gray/30 rounded-2xl">
                  <RefreshCcw className="w-5 h-5 text-apple-text" />
                  <span>14-day free return</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
