import { AuthProvider, useAuth } from './hooks/useAuth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Store from './pages/Store';
import ProductDetails from './pages/ProductDetails';
import Sell from './pages/Sell';
import Repair from './pages/Repair';
import Tracking from './pages/Tracking';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Profile from './pages/Profile';
import React from 'react';
import LoginGate from './components/LoginGate';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (role && profile?.role !== role) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function AppContent() {
  const { user, login, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
        <p className="mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Loading Ecosystem...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginGate onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-apple-bg selection:bg-apple-blue/30">
      <Navbar />
      <main className="pt-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/repair" element={<Repair />} />
          <Route path="/about" element={<About />} />
          <Route path="/track" element={<Tracking />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

