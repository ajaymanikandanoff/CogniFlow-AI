import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Lock, Mail, User, ArrowRight, Zap } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    course: '',
    semester: '',
    dailyAvailableHours: 3
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loadDemoAlex } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    try {
      await loadDemoAlex();
      navigate('/dashboard');
    } catch (err) {
      setError('Could not load demo: ' + err.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 mb-3 shadow-md">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Create your CogniFlow Account</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Get your personalized, continuously adaptive study plan</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Chen"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@university.edu"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-3">
            <button
              onClick={handleDemo}
              className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 transition"
            >
              <Zap className="w-3.5 h-3.5 text-zinc-500" />
              <span>Explore Demo Profile</span>
            </button>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-900 dark:text-white font-semibold underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
