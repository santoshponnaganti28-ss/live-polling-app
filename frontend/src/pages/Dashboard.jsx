import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  CheckCircle2,
  ExternalLink,
  Lock,
  Copy,
  BarChart3,
  Calendar
} from 'lucide-react';

export const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchMyPolls = async () => {
    try {
      setLoading(true);
      const res = await api.listPolls({ myPolls: 'true' });
      setPolls(res.polls || []);
    } catch (err) {
      setError('Failed to fetch your polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPolls();
    }
  }, [isAuthenticated]);

  const handleCopy = (id) => {
    const url = `${window.location.origin}/poll/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClose = async (id) => {
    if (!window.confirm('Are you sure you want to end voting for this poll?')) return;
    try {
      await api.closePoll(id);
      setPolls(polls.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
    } catch (err) {
      alert('Failed to close poll: ' + err.message);
    }
  };

  const totalVotesAcrossPolls = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-alice-400" />
            Creator Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your active polls, monitor live participation, and analyze results.
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-alice-100 text-grey-950 hover:bg-white transition-all shadow-[0_0_15px_rgba(240,248,255,0.25)]"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Poll
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="car-card rounded-2xl p-6 border border-grey-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Polls Created</span>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">{polls.length}</div>
        </div>
        <div className="car-card rounded-2xl p-6 border border-grey-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Live Audience Votes</span>
          <div className="mt-2 text-3xl font-extrabold text-alice-300 font-mono">{totalVotesAcrossPolls}</div>
        </div>
        <div className="car-card rounded-2xl p-6 border border-grey-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Stream Sessions</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400 font-mono">
            {polls.filter((p) => p.isActive).length}
          </div>
        </div>
      </div>

      {/* Polls List */}
      <div className="car-card rounded-3xl border border-grey-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-grey-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-alice-400" />
            Your Created Polls
          </h2>
          <span className="text-xs text-slate-400">{polls.length} total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-alice-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading your polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm mb-4">You haven't launched any live polls yet.</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-alice-100 text-grey-950 hover:bg-white"
            >
              <PlusCircle className="w-4 h-4" />
              Launch Your First Poll
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-grey-800">
            {polls.map((p) => (
              <div key={p.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-grey-900/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-grey-800 text-alice-300 border border-grey-750">
                      {p.category}
                    </span>
                    {p.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 bg-grey-800 px-2 py-0.5 rounded-full border border-grey-700">
                        Closed
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white truncate mb-1">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-alice-400" />
                      <strong className="text-slate-200">{p.totalVotes || 0}</strong> votes
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(p.id)}
                    className="p-2 rounded-lg bg-grey-850 hover:bg-grey-800 border border-grey-750 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                    title="Copy Share Link"
                  >
                    {copiedId === p.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-alice-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/poll/${p.id}`}
                    className="p-2 rounded-lg bg-grey-850 hover:bg-grey-800 border border-grey-750 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-alice-400" />
                    <span>View Live</span>
                  </Link>

                  {p.isActive && (
                    <button
                      onClick={() => handleClose(p.id)}
                      className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>End</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
