import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PollCard } from '../components/PollCard';
import { Sparkles, Zap, ShieldCheck, Flame, PlusCircle, RefreshCw, BarChart2 } from 'lucide-react';

export const Home = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const categories = ['All', 'Automotive', 'Tech & Dev', 'Gaming', 'Design', 'General'];

  const fetchPolls = async (cat = '') => {
    try {
      setLoading(true);
      const res = await api.listPolls({ category: cat === 'All' ? '' : cat });
      setPolls(res.polls || []);
      setError('');
    } catch (err) {
      setError('Unable to load live polls. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls(category);
  }, [category]);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl car-card p-8 sm:p-12 mb-12 border border-grey-800 shadow-2xl">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-alice-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-grey-900 border border-grey-700 text-xs font-semibold text-alice-300 mb-6">
            <Zap className="w-3.5 h-3.5 text-alice-400 animate-pulse" />
            <span>Redis Pub/Sub Real-Time Engine • Gin WebSocket Pipeline</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Create. Share. <br />
            <span className="bg-gradient-to-r from-alice-100 via-alice-300 to-sky-400 bg-clip-text text-transparent">
              Watch Results Stream Live.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Every vote casts instantly through in-memory Redis atomic counters and streams in sub-millisecond real-time to all connected viewers without ever touching page refresh.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-alice-100 text-grey-950 hover:bg-white transition-all shadow-[0_0_20px_rgba(240,248,255,0.25)] hover:shadow-[0_0_25px_rgba(240,248,255,0.4)] transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-5 h-5 text-grey-950" />
              Create Live Poll
            </Link>

            <a
              href="#explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-grey-850 hover:bg-grey-800 text-slate-200 border border-grey-700 transition-colors"
            >
              <BarChart2 className="w-5 h-5 text-alice-400" />
              Browse Active Polls
            </a>
          </div>
        </div>

        {/* Realtime Badges */}
        <div className="mt-10 pt-8 border-t border-grey-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Redis <code className="text-alice-300">HINCRBY</code> Counter</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-alice-400" />
            <span>WebSocket Live Broadcast</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-sky-400" />
            <span>MongoDB Durability</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Single-Vote Deduplication</span>
          </div>
        </div>
      </div>

      {/* Category Pills & Filter Header */}
      <div id="explore" className="scroll-mt-24 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-alice-400" />
            Active Live Polls
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Pick a poll, cast your vote, and witness the real-time vote distribution update instantly.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isSelected = (category === '' && cat === 'All') || category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat === 'All' ? '' : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-alice-100 text-grey-950 shadow-[0_0_12px_rgba(240,248,255,0.3)]'
                    : 'bg-grey-900 text-slate-400 hover:text-slate-200 border border-grey-800 hover:border-grey-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
          <button
            onClick={() => fetchPolls(category)}
            className="p-2 rounded-lg bg-grey-900 text-slate-400 hover:text-alice-300 border border-grey-800 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-alice-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-300 text-sm mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchPolls(category)} className="underline hover:text-white">
            Try again
          </button>
        </div>
      )}

      {/* Polls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="car-card rounded-2xl p-6 h-64 animate-pulse">
              <div className="w-20 h-5 bg-grey-800 rounded-full mb-4" />
              <div className="w-3/4 h-6 bg-grey-800 rounded mb-2" />
              <div className="w-1/2 h-4 bg-grey-800 rounded mb-6" />
              <div className="space-y-2">
                <div className="w-full h-8 bg-grey-800 rounded-lg" />
                <div className="w-full h-8 bg-grey-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="car-card rounded-2xl p-12 text-center border border-grey-800">
          <Sparkles className="w-12 h-12 text-alice-400/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No polls found in this category</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Be the first to launch a live audience poll in this category!
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-alice-100 text-grey-950 hover:bg-white text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create First Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
};
