import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowRight, Gauge } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(username.trim(), email.trim(), password);
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md car-card rounded-3xl p-8 sm:p-10 border border-grey-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-grey-850 border border-grey-750 flex items-center justify-center mx-auto mb-3">
            <Gauge className="w-6 h-6 text-alice-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">Join to create, manage, and stream live interactive polls.</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., alex_f1"
              className="w-full px-4 py-2.5 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password <span className="text-slate-500 font-normal">(Min 6 chars)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-grey-900 border border-grey-750 text-white placeholder-slate-500 focus:outline-none focus:border-alice-400 focus:ring-1 focus:ring-alice-400 text-sm transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-alice-100 text-grey-950 hover:bg-white transition-all shadow-[0_0_15px_rgba(240,248,255,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-grey-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-alice-300 hover:text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
