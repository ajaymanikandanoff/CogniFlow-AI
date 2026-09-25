import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Lock, Mail, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, loadDemoAlex } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  const demo = async () => {
    try { await loadDemoAlex(); navigate('/dashboard'); }
    catch (err) { setError('Demo failed: ' + err.message); }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 page-enter">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand mark */}
        <div className="text-center space-y-3">
          <div className="w-11 h-11 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold txt-1">Welcome back</h1>
            <p className="text-sm txt-2 mt-1">Sign in to your CogniFlow account</p>
          </div>
        </div>

        {/* Form card */}
        <div className="card p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/8 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium txt-2">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 txt-3" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input pl-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium txt-2">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 txt-3" />
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-8 text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary w-full text-sm mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="divider" />

          <button onClick={demo} className="btn btn-secondary w-full text-xs">
            <Zap size={13} className="accent-txt" />
            Try demo account (pre-loaded plan)
          </button>

          <p className="text-center text-xs txt-3">
            No account?{' '}
            <Link to="/signup" className="accent-txt hover:underline font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
