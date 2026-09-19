import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, Trash2, ArrowRight, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export const CreatePoll = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Automotive');
  const [options, setOptions] = useState([
    'Porsche 911 GT3 RS',
    'Ferrari SF90 XX Stradale',
    'McLaren 765LT Spider',
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Automotive', 'Tech & Dev', 'Gaming', 'Design', 'General'];

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/create');
      return;
    }

    if (!title.trim() || title.trim().length < 5) {
      setError('Poll title must be at least 5 characters long.');
      return;
    }

    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    try {
      setSubmitting(true);
      const newPoll = await api.createPoll({
        title: title.trim(),
        description: description.trim(),
        category,
        options: cleaned,
        allowMultiple,
      });

      // Navigate to the newly created live poll
      navigate(`/poll/${newPoll.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create poll. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="car-card rounded-3xl p-6 sm:p-10 border border-grey-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-grey-850 border border-grey-750 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-alice-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Create a Live Poll</h1>
            <p className="text-sm text-slate-400">Launch a real-time question and share the instant link with your audience.</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="my-6 p-4 rounded-xl bg-grey-900 border border-alice-400/30 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldAlert className="w-4 h-4 text-alice-400 flex-shrink-0" />
              <span>You must be signed in to create and manage polls.</span>
            </div>
            <button
              onClick={() => navigate('/login?redirect=/create')}
              className="px-3 py-1.5 rounded-lg bg-alice-100 text-grey-950 font-semibold text-xs hover:bg-white transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {error && (
          <div className="my-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Question / Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Poll Question / Title <span className="text-alice-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Which hypercar is your ultimate dream daily driver?"
              className="w-full px-4 py-3 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 transition-all text-base"
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Description <span className="text-slate-500 font-normal">(Optional context)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your audience any extra background or criteria..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 transition-all text-sm"
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    category === cat
                      ? 'bg-alice-100 text-grey-950 border-alice-200 shadow-[0_0_12px_rgba(240,248,255,0.25)]'
                      : 'bg-grey-900 text-slate-400 border-grey-800 hover:border-grey-700 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-200">
                Poll Options <span className="text-alice-400">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {options.length}/10 options
              </span>
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <span className="w-6 text-xs text-slate-500 font-mono text-center">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 transition-all text-sm"
                    maxLength={100}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-grey-900 rounded-lg transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-alice-300 hover:text-white bg-grey-900 hover:bg-grey-850 border border-grey-800 hover:border-alice-400/40 transition-colors"
              >
                <Plus className="w-4 h-4 text-alice-400" />
                Add Another Option
              </button>
            )}
          </div>

          {/* Alice Blue Checkbox Option: Allow Multiple Choices */}
          <div className="pt-4 border-t border-grey-800/80">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="alice-checkbox mt-0.5"
              />
              <div>
                <span className="text-sm font-semibold text-slate-200 group-hover:text-alice-100 transition-colors">
                  Allow multiple choices
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Voters can select more than one option concurrently.
                </p>
              </div>
            </label>
          </div>

          {/* Submit CTA */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-alice-100 text-grey-950 hover:bg-white transition-all shadow-[0_0_20px_rgba(240,248,255,0.25)] hover:shadow-[0_0_25px_rgba(240,248,255,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-grey-950 border-t-transparent rounded-full animate-spin" />
                  <span>Launching Live Poll...</span>
                </>
              ) : (
                <>
                  <span>Launch Live Poll</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
