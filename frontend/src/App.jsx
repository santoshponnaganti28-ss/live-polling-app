import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CarBackground } from './components/CarBackground';
import { Home } from './pages/Home';
import { CreatePoll } from './pages/CreatePoll';
import { PollDetail } from './pages/PollDetail';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Gauge, Heart, Activity } from 'lucide-react';

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e1116] text-slate-200 relative overflow-x-hidden selection:bg-alice-400 selection:text-grey-950 font-sans">
      {/* Aesthetic Automotive Background with Subtle Car Contours */}
      <CarBackground />

      {/* Main App Navigation */}
      <Navbar />

      {/* Page Views */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<PollDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-grey-800/80 bg-grey-950/60 backdrop-blur-md py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-alice-400" />
            <span className="font-semibold text-slate-300">ApexPoll System</span>
            <span>—</span>
            <span>Powered by Go (Gin), Redis Pub/Sub, MongoDB & React</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Engine Status: Active
            </span>
            <span>•</span>
            <Link to="/create" className="hover:text-alice-300 transition-colors">
              New Poll
            </Link>
            <span>•</span>
            <Link to="/dashboard" className="hover:text-alice-300 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
