import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';
import ScheduleNotificationBanner from '../components/ScheduleNotificationBanner';
import {
  Calendar, Sparkles, ArrowRight, BookOpen, Plus,
  Bot, RotateCcw, CheckCircle2, Flame, Target, Send
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [quickAi, setQuickAi] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); setData(await api.getDashboard()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toast_ = (type, title, msg) => {
    setToast({ type, title, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleComplete = async (id) => {
    try { await api.completeTask(id); toast_('ok', 'Completed', 'Revision scheduled.'); load(); }
    catch (e) { alert(e.message); }
  };
  const handleSkip = async (id) => {
    try { const r = await api.skipTask(id); toast_('warn', 'Rescheduled', r.message); load(); }
    catch (e) { alert(e.message); }
  };
  const handleQuiz = (task) => navigate('/quiz', { state: { topicId: task.topicId, topicName: task.topicName, subjectName: task.subjectName } });
  const handleAsk = (e) => { e.preventDefault(); if (quickAi.trim()) navigate('/ai-coach', { state: { initialQuery: quickAi } }); };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 spinner" />
    </div>
  );

  const kpis     = data?.kpis || {};
  const today    = data?.todayPlan || [];
  const exams    = data?.upcomingExams || [];
  const revise   = data?.revisionsDue || [];
  const done     = today.filter(t => t.status === 'completed').length;
  const pct      = today.length > 0 ? Math.round((done / today.length) * 100) : 0;

  return (
    <div className="space-y-6 page-enter">
      {/* Toast */}
      {toast && (
        <div className={`card p-3.5 flex items-center justify-between anim-down ${
          toast.type === 'ok' ? 'border-green-500/30' : 'border-amber-500/30'
        }`}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{toast.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--t2)' }}>{toast.msg}</p>
          </div>
          <button onClick={() => setToast(null)} className="btn btn-ghost text-xs p-1.5 rounded">✕</button>
        </div>
      )}

      {/* AI Engine strip */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag tag-muted live-dot text-[11px]">3-Cloud AI Active</span>
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--t3)' }}>
            Gemini · Groq 70B · OpenRouter
          </span>
        </div>
        <Link to="/settings" className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'var(--t3)' }}>
          Configure <ArrowRight size={11} />
        </Link>
      </div>

      {/* Welcome banner */}
      <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 anim-up">
        <div className="space-y-3 flex-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--t1)' }}>
              Hey, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>
              {kpis.nextExam
                ? <>Next exam: <strong style={{ color: 'var(--t1)' }}>{kpis.nextExam.subjectName}</strong> — <span className="font-semibold" style={{ color: 'var(--warn)' }}>{kpis.nextExam.daysLeft} days left</span></>
                : 'Add your subjects and exam dates to get a tailored revision plan.'}
            </p>
          </div>
          {today.length > 0 && (
            <div className="max-w-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--t3)' }}>
                <span>Today's progress</span>
                <span className="mono" style={{ color: 'var(--t2)' }}>{done}/{today.length} tasks</span>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/subjects" className="btn btn-primary text-xs">
            <Plus size={14} /> Add Subject
          </Link>
          <button
            onClick={() => document.getElementById('ai-coach-fab')?.click()}
            className="btn btn-ghost text-xs"
          >
            <Bot size={14} /> AI Coach
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { icon: Flame,        label: 'Streak',     value: `${kpis.streakDays || 5}d`,     sub: 'Days consistent', color: 'var(--warn)' },
          { icon: Target,       label: 'Readiness',  value: `${kpis.readinessScore || 84}%`, sub: 'Syllabus coverage', color: 'var(--p-text)' },
          { icon: Calendar,     label: 'Next Exam',  value: kpis.nextExam ? `${kpis.nextExam.daysLeft}d` : '—', sub: kpis.nextExam?.subjectName || 'Not set', color: 'var(--t1)' },
          { icon: CheckCircle2, label: 'Topics Done',value: kpis.topicsCompleted || 0,       sub: 'Total completed', color: 'var(--ok)' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card p-4 space-y-2 card-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--t3)' }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-bold mono" style={{ color }}>{value}</p>
            <p className="text-[11px] truncate" style={{ color: 'var(--t3)' }}>{sub}</p>
          </div>
        ))}
      </div>

      <ScheduleNotificationBanner todayPlan={today} onNotificationSent={load} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
              <Calendar size={15} style={{ color: 'var(--p-text)' }} />
              Today's Schedule & Tasks
            </h2>
            <button onClick={load} className="btn btn-ghost btn-sm text-xs gap-1">
              <RotateCcw size={12} /> Refresh
            </button>
          </div>

          {today.length === 0 ? (
            <div className="card p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: 'var(--p-dim)', color: 'var(--p-text)' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>No tasks for today</p>
                <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--t2)' }}>
                  Add subjects and exam dates to get a personalized daily plan.
                </p>
              </div>
              <Link to="/subjects" className="btn btn-primary text-xs inline-flex">
                <Plus size={13} /> Add your first subject
              </Link>
            </div>
          ) : (
            <div className="space-y-3 stagger">
              {today.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleComplete} onSkip={handleSkip} onStartQuiz={handleQuiz} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Ask AI Coach card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bot size={14} style={{ color: 'var(--p-text)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--t1)' }}>Quick AI Query</span>
              <span className="tag tag-muted text-[10px] ml-auto">Consensus</span>
            </div>
            <form onSubmit={handleAsk} className="space-y-2">
              <input
                value={quickAi}
                onChange={e => setQuickAi(e.target.value)}
                placeholder="e.g. Explain AVL tree rotations..."
                className="input text-xs"
              />
              <button type="submit" className="btn btn-primary w-full text-xs gap-1.5">
                <Send size={13} /> Ask AI
              </button>
            </form>
          </div>

          {/* Upcoming Exams */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                <Calendar size={13} style={{ color: 'var(--p-text)' }} /> Upcoming Exams
              </span>
              <Link to="/subjects" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--t3)' }}>
                Manage →
              </Link>
            </div>
            {exams.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--t3)' }}>No exams set yet.</p>
            ) : (
              exams.map(ex => (
                <div key={ex.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--t1)' }}>{ex.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{new Date(ex.examDate).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: 'var(--warn)' }}>{ex.daysLeft}d</span>
                </div>
              ))
            )}
          </div>

          {/* Revisions Due */}
          {revise.length > 0 && (
            <div className="card p-4 space-y-3">
              <span className="text-xs font-semibold flex items-center gap-2" style={{ color: 'var(--t1)' }}>
                <Sparkles size={13} style={{ color: 'var(--p-text)' }} /> Revisions Due
              </span>
              {revise.slice(0, 3).map(r => (
                <div key={r._id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--t1)' }}>{r.topicName}</p>
                    <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{r.subjectName}</p>
                  </div>
                  <Link
                    to="/quiz"
                    state={{ topicName: r.topicName, subjectName: r.subjectName }}
                    className="tag tag-purple cursor-pointer hover:opacity-80 transition"
                  >
                    Quiz
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
