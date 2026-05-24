import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal, ArrowUpRight } from 'lucide-react';

export default function Store() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('cat');

  useEffect(() => {
    let isSubscribed = true;

    const fetchProducts = () => {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (isSubscribed) {
            if (category) {
              setProducts(data.filter((p: any) => p.category?.toLowerCase() === category.toLowerCase()));
            } else {
              setProducts(data);
            }
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('[Store] Error:', err);
          if (isSubscribed) setLoading(false);
        });
    };

    fetchProducts();
    const interval = setInterval(fetchProducts, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [category]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Store...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-10 sm:space-y-16">
      <header className="space-y-4 sm:space-y-6 max-w-3xl">
        <h1 className="text-3.5xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          {category ? category : "Store."}
          <span className="text-apple-secondary block text-lg sm:text-3xl md:text-5xl mt-2 font-medium"> The best way to buy the products you love.</span>
        </h1>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-apple-border/50 pb-6 sm:pb-8 gap-4">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
          {['All', 'iPhone', 'MacBook', 'Watch', 'iPad', 'AirPods'].map(c => (
            <Link 
              key={c}
              to={c === 'All' ? '/store' : `/store?cat=${c}`}
              className={`px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                (!category && c === 'All') || category === c 
                ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/10' 
                : 'bg-white border border-apple-border/50 hover:bg-apple-gray'
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
        <button className="flex items-center text-xs sm:text-sm font-semibold text-apple-secondary hover:text-apple-text transition-colors self-end sm:self-auto">
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        <AnimatePresence mode="popLayout">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link 
                to={`/product/${p.id}`}
                className="apple-card group block p-0 overflow-hidden h-full flex flex-col"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-apple-gray/30 p-12">
                  <img src={p.images?.[0]} alt={p.name} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-apple-text" />
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-4 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-apple-secondary uppercase tracking-widest">{p.category}</h4>
                        <h3 className="text-2xl font-bold mt-1">{p.name}</h3>
                      </div>
                      <p className="text-xl font-bold">₹{p.price}</p>
                    </div>
                    <p className="text-sm text-apple-secondary line-clamp-2 mt-4">{p.description}</p>
                  </div>
                  <div className="flex items-center pt-4 text-apple-blue font-bold text-sm">
                    View Details <ChevronRight className="ml-1 w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {products.length === 0 && (
        <div className="py-40 text-center space-y-4">
          <p className="text-2xl font-bold text-apple-secondary">No products found for this category.</p>
          <Link to="/store" className="text-apple-blue hover:underline font-bold">Clear all filters</Link>
        </div>
      )}
    </div>
  );
}
