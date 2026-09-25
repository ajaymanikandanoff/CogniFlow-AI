import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BookOpen, Calendar, Bot, Zap, CheckCircle, Sparkles, Shield, Trophy } from 'lucide-react';

export default function LandingPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const handleQuickStart = async () => {
    const id = Math.floor(1000 + Math.random() * 9000);
    try {
      await register({ name: `Student #${id}`, email: `student${id}@study.app`, password: 'password123', studyHoursPerDay: 3 });
      navigate('/dashboard');
    } catch { navigate('/login'); }
  };

  return (
    <div className="min-h-[92vh] flex flex-col justify-center items-center px-4 sm:px-6 py-12 sm:py-20 page-enter relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full space-y-12 relative z-10">

        {/* Hero text */}
        <div className="text-center space-y-6 anim-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tag tag-purple shadow-sm">
            <span className="live-dot" />
            <span>3-Cloud AI Consensus · Gemini + Groq + OpenRouter</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--t1)' }}>
            Supercharge Your Studies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-300">CogniFlow AI</span>
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--t2)' }}>
            Upload your syllabus or type subjects. CogniFlow crafts an adaptive daily schedule, identifies retention gaps via spaced repetition, and powers instant diagnostic tests.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              id="landing-start-btn"
              onClick={handleQuickStart}
              className="btn btn-primary text-sm sm:text-base px-6 py-3 rounded-xl gap-2 shadow-lg hover:shadow-indigo-500/30"
            >
              <Zap size={17} />
              <span>Instant Demo (Alex Profile)</span>
              <ArrowRight size={17} />
            </button>
            <Link
              to="/login"
              id="landing-login-link"
              className="btn btn-secondary text-sm sm:text-base px-6 py-3 rounded-xl"
            >
              Sign in to Account
            </Link>
          </div>

          {/* Social Proof & Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-medium" style={{ color: 'var(--t3)' }}>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Free Forever</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Zero CPU / Local Load</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Mobile & Tablet Ready</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
          {[
            {
              icon: BookOpen,
              title: 'PDF & Topic Extraction',
              desc: 'Upload any exam syllabus or paste module topics — AI categorizes difficulty and schedules modules automatically.'
            },
            {
              icon: Calendar,
              title: 'Spaced Repetition Engine',
              desc: 'SM-2 algorithmic revision schedule prevents forgetting curve decay before critical exam dates.'
            },
            {
              icon: Bot,
              title: '3-Engine AI Consensus',
              desc: 'Gemini, Groq Llama-3.3, and OpenRouter cross-verify every diagnostic quiz and study query.'
            }
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 space-y-3 glass-card hover:border-[var(--p-mid)]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--p-dim)', color: 'var(--p-text)' }}>
                <Icon size={19} />
              </div>
              <div>
                <p className="text-base font-bold mb-1.5" style={{ color: 'var(--t1)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Model ensemble footer tag */}
        <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ background: 'var(--bg-2)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--p-text)' }} />
            <span className="font-semibold" style={{ color: 'var(--t1)' }}>Real-time 3-Cloud AI Architecture</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {['Google Gemini Flash', 'Groq Llama-3.3 70B', 'OpenRouter Free Cloud'].map((m) => (
              <span key={m} className="tag tag-muted text-[11px]">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
