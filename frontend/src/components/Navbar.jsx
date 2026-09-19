import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gauge, PlusCircle, LayoutDashboard, LogIn, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-grey-950/80 backdrop-blur-md border-b border-grey-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-grey-800 to-grey-750 border border-grey-700 flex items-center justify-center group-hover:border-alice-400/60 transition-all shadow-inner">
            <Gauge className="w-5 h-5 text-alice-400 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Apex<span className="text-alice-400 font-extrabold">Poll</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-alice-100/10 text-alice-300 border border-alice-400/30 rounded tracking-wider uppercase">
                Realtime
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'text-alice-300 bg-grey-850' : 'text-slate-400 hover:text-slate-100 hover:bg-grey-900'
            }`}
          >
            Explore Polls
          </Link>
          <Link
            to="/create"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isActive('/create') ? 'text-alice-300 bg-grey-850' : 'text-slate-400 hover:text-slate-100 hover:bg-grey-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Poll
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/dashboard') ? 'text-alice-300 bg-grey-850' : 'text-slate-400 hover:text-slate-100 hover:bg-grey-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-grey-900 border border-grey-800 text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-alice-400" />
                <span className="font-medium text-slate-200">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-grey-900 border border-grey-800 transition-colors flex items-center gap-1.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-grey-900 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-alice-100 text-grey-950 hover:bg-alice-200 border border-alice-300/60 shadow-[0_0_15px_rgba(240,248,255,0.2)] transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
