import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getVoterKey } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Users,
  Share2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Wifi,
  WifiOff,
  Copy,
  Lock,
  ArrowLeft,
  Flame,
  Award
} from 'lucide-react';

export const PollDetail = () => {
  const { id: pollId } = useParams();
  const { user } = useAuth();

  const [poll, setPoll] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Check if current user or browser has already voted for this poll locally
  useEffect(() => {
    const voterKey = getVoterKey();
    const votedLocal = localStorage.getItem(`voted_${pollId}_${voterKey}`);
    if (votedLocal) {
      setHasVoted(true);
      try {
        setSelectedOptions(JSON.parse(votedLocal));
      } catch (e) {
        // ignore
      }
    }
  }, [pollId]);

  // Initial Poll Fetch
  const fetchPoll = async () => {
    try {
      setLoading(true);
      const data = await api.getPoll(pollId);
      setPoll(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Poll not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  // WebSocket Connection Management
  useEffect(() => {
    if (!pollId) return;

    const connectWebSocket = () => {
      const wsUrl = api.getWebSocketUrl(pollId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'VOTE_UPDATE') {
            setPoll((prev) => {
              if (!prev) return prev;
              const updatedOptions = prev.options.map((opt) => ({
                ...opt,
                votes: msg.counts[opt.id] !== undefined ? msg.counts[opt.id] : opt.votes,
              }));
              return {
                ...prev,
                totalVotes: msg.totalVotes,
                options: updatedOptions,
              };
            });
          } else if (msg.type === 'POLL_CLOSED') {
            setPoll((prev) => (prev ? { ...prev, isActive: false } : prev));
          }
        } catch (e) {
          // ignore non-json messages
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        setWsConnected(false);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [pollId]);

  // Handle Option Selection
  const handleSelectOption = (optId) => {
    if (hasVoted || !poll?.isActive) return;

    if (poll.allowMultiple) {
      if (selectedOptions.includes(optId)) {
        setSelectedOptions(selectedOptions.filter((id) => id !== optId));
      } else {
        setSelectedOptions([...selectedOptions, optId]);
      }
    } else {
      setSelectedOptions([optId]);
    }
  };

  // Submit Vote
  const handleCastVote = async () => {
    if (selectedOptions.length === 0 || voting || !poll?.isActive) return;

    try {
      setVoting(true);
      setError('');
      const res = await api.castVote(pollId, selectedOptions);

      setHasVoted(true);
      const voterKey = getVoterKey();
      localStorage.setItem(`voted_${pollId}_${voterKey}`, JSON.stringify(selectedOptions));

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0F8FF', '#bae6fd', '#38bdf8', '#ffffff'],
      });

      if (res.result) {
        setPoll((prev) => {
          if (!prev) return prev;
          const updatedOptions = prev.options.map((opt) => ({
            ...opt,
            votes: res.result.counts[opt.id] !== undefined ? res.result.counts[opt.id] : opt.votes,
          }));
          return {
            ...prev,
            totalVotes: res.result.totalVotes,
            options: updatedOptions,
          };
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit vote.');
    } finally {
      setVoting(false);
    }
  };

  // Copy Poll Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Close Poll (Creator only)
  const handleClosePoll = async () => {
    if (!window.confirm('Are you sure you want to end voting for this poll?')) return;
    try {
      setClosing(true);
      await api.closePoll(pollId);
      setPoll((prev) => (prev ? { ...prev, isActive: false } : prev));
    } catch (err) {
      setError(err.message || 'Failed to close poll.');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-3 border-alice-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Connecting to realtime live stream...</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="p-8 car-card rounded-3xl border border-rose-900/60">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Poll Unavailable</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-grey-850 hover:bg-grey-800 text-slate-200 text-sm font-medium border border-grey-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Polls
          </Link>
        </div>
      </div>
    );
  }

  // Calculate highest voted option for leading highlight
  const highestVotes = Math.max(...(poll?.options?.map((o) => o.votes) || [0]));
  const isCreator = user && poll && user.id === poll.creatorId;

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Breadcrumb & Live Indicator */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Polls</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Realtime WebSocket Status Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              wsConnected
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-950/50 text-amber-300 border-amber-500/30'
            }`}
          >
            {wsConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-[11px]">Live WebSocket</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">Reconnecting...</span>
              </>
            )}
          </div>

          {/* Share Button */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-grey-850 text-slate-200 hover:text-white border border-grey-700 hover:border-alice-400/50 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-alice-400" />
                <span className="text-alice-300">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-alice-400" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Poll Container */}
      <div className="car-card rounded-3xl p-6 sm:p-10 border border-grey-800 shadow-2xl relative overflow-hidden">
        {/* Header Details */}
        <div className="border-b border-grey-800 pb-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-grey-850 text-alice-300 border border-grey-750">
              {poll.category || 'General'}
            </span>
            {poll.allowMultiple && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-alice-400/10 text-alice-300 border border-alice-400/20">
                Multiple Choice Allowed
              </span>
            )}
            {!poll.isActive && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800">
                Voting Closed
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-3">
            {poll.title}
          </h1>

          {poll.description && (
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
              {poll.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-alice-400" />
              <span>
                <strong className="text-white text-sm font-semibold">{poll.totalVotes || 0}</strong>{' '}
                total votes cast
              </span>
            </div>
            <span>Created by <strong className="text-slate-300">{poll.creatorName || 'Anonymous'}</strong></span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hasVoted && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Your vote has been cast. Watch the results stream live below as other audience members vote!</span>
          </div>
        )}

        {/* Live Voting & Results List */}
        <div className="space-y-4">
          {poll.options?.map((opt) => {
            const isSelected = selectedOptions.includes(opt.id);
            const voteCount = opt.votes || 0;
            const percentage = poll.totalVotes > 0 ? ((voteCount / poll.totalVotes) * 100).toFixed(1) : '0.0';
            const isLeading = highestVotes > 0 && voteCount === highestVotes;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-200 select-none ${
                  !poll.isActive || hasVoted
                    ? 'cursor-default'
                    : 'cursor-pointer hover:border-alice-300/80 hover:bg-grey-900/90'
                } ${
                  isSelected
                    ? 'border-alice-200 bg-grey-850 shadow-[0_0_15px_rgba(240,248,255,0.12)]'
                    : 'border-grey-800 bg-grey-900/60'
                }`}
              >
                {/* Live Animated Background Progress Fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-2xl ${
                    isLeading
                      ? 'bg-gradient-to-r from-alice-400/20 to-alice-200/15'
                      : 'bg-alice-400/10'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Option Content */}
                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Alice Blue Interactive Checkbox or Radio Button */}
                    <div className="flex-shrink-0">
                      {poll.allowMultiple ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={hasVoted || !poll.isActive}
                          className="alice-checkbox"
                        />
                      ) : (
                        <input
                          type="radio"
                          name="poll_selection"
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={hasVoted || !poll.isActive}
                          className="alice-radio"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm sm:text-base font-medium text-slate-100 group-hover:text-white truncate">
                        {opt.text}
                      </span>
                      {isLeading && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-alice-300 bg-alice-400/15 border border-alice-400/30 px-2 py-0.5 rounded-full">
                          <Award className="w-3 h-3 text-alice-400" />
                          Leading
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Percentage & Vote Count */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-base sm:text-lg font-bold text-alice-100">
                      {percentage}%
                    </span>
                    <span className="block text-[11px] text-slate-400 font-mono">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting Action CTA */}
        {poll.isActive && !hasVoted && (
          <div className="mt-8 pt-6 border-t border-grey-800">
            <button
              onClick={handleCastVote}
              disabled={selectedOptions.length === 0 || voting}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-alice-100 text-grey-950 hover:bg-white transition-all shadow-[0_0_20px_rgba(240,248,255,0.25)] hover:shadow-[0_0_25px_rgba(240,248,255,0.45)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {voting ? (
                <>
                  <div className="w-5 h-5 border-2 border-grey-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Vote to Redis...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    Submit {poll.allowMultiple ? 'Selections' : 'Vote'}
                  </span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              Votes are recorded atomically and broadcast instantaneously to all live viewers.
            </p>
          </div>
        )}

        {/* Creator Controls */}
        {isCreator && poll.isActive && (
          <div className="mt-8 pt-6 border-t border-grey-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              You are the creator of this poll.
            </div>
            <button
              onClick={handleClosePoll}
              disabled={closing}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800 transition-colors"
            >
              {closing ? 'Closing...' : 'Close Poll'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
