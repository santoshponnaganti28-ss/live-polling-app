import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

export const PollCard = ({ poll }) => {
  return (
    <div className="car-card rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden border border-grey-800 hover:border-alice-400/40 transition-all duration-300">
      {/* Top subtle glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-alice-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-grey-800 text-alice-300 border border-grey-700">
            {poll.category || 'General'}
          </span>
          <div className="flex items-center gap-1.5">
            {poll.isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-grey-800 text-slate-400 border border-grey-700">
                Closed
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-alice-100 transition-colors line-clamp-2 mb-2">
          {poll.title}
        </h3>

        {/* Description */}
        {poll.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-4">
            {poll.description}
          </p>
        )}

        {/* Options Preview */}
        <div className="space-y-1.5 mb-5 mt-3">
          {poll.options?.slice(0, 3).map((opt) => {
            const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
            return (
              <div key={opt.id} className="relative overflow-hidden rounded-lg bg-grey-900/80 p-2 border border-grey-800/80 text-xs flex justify-between items-center">
                <div
                  className="absolute inset-y-0 left-0 bg-alice-400/10 transition-all duration-500 rounded-lg"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 text-slate-300 font-medium truncate pr-2">
                  {opt.text}
                </span>
                <span className="relative z-10 text-alice-300/80 font-mono text-[11px]">
                  {pct}%
                </span>
              </div>
            );
          })}
          {poll.options?.length > 3 && (
            <p className="text-[11px] text-slate-500 pl-1">
              +{poll.options.length - 3} more options
            </p>
          )}
        </div>
      </div>

      {/* Footer Info & CTA */}
      <div className="pt-4 border-t border-grey-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-400">
            <Users className="w-3.5 h-3.5 text-alice-400" />
            <strong className="text-slate-200">{poll.totalVotes || 0}</strong> votes
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 truncate max-w-[110px]">
            by {poll.creatorName || 'Anonymous'}
          </span>
        </div>

        <Link
          to={`/poll/${poll.id}`}
          className="inline-flex items-center gap-1 font-semibold text-alice-300 hover:text-white group/btn"
        >
          <span>Participate</span>
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
