/**
 * Register Component
 * User registration form
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="bg-black border border-[#1a1a1a] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
            <p className="text-gray-400 mb-6">
              We've sent a verification link to <strong>{email}</strong>.
              Click the link to verify your account and start using Prolium.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Prolium" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-2">Prolium</h1>
          <p className="text-gray-500">Create your account</p>
        </div>

        <div className="bg-black border border-[#1a1a1a] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-sm text-rose-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#1a1a1a] rounded-xl text-white focus:outline-none focus:border-[#2a2a2a]"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#1a1a1a] rounded-xl text-white focus:outline-none focus:border-[#2a2a2a]"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#1a1a1a] rounded-xl text-white focus:outline-none focus:border-[#2a2a2a]"
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#1a1a1a] rounded-xl text-white focus:outline-none focus:border-[#2a2a2a]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Creating account...'
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-emerald-500 hover:text-emerald-400 font-bold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
