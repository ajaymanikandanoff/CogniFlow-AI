import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';
import ScheduleNotificationBanner from '../components/ScheduleNotificationBanner';
import {
  Calendar,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
  Filter,
  Zap,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function StudyPlanPage() {
  const [studyPlanDoc, setStudyPlanDoc] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [adaptiveToast, setAdaptiveToast] = useState(null);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const res = await api.getUpcomingPlan();
      setStudyPlanDoc(res.plan || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.generatePlan();
      setStudyPlanDoc(res.plan);
      setAdaptiveToast({
        title: 'Plan Recalculated',
        message: 'AI re-balanced your schedule against current topic weakness scores and exam deadlines.'
      });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await api.completeTask(taskId);
      setAdaptiveToast({
        title: 'Session Completed',
        message: 'Topic mastered and spaced revision scheduled.'
      });
      loadPlan();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTaskSkip = async (taskId) => {
    try {
      const res = await api.skipTask(taskId);
      setAdaptiveToast({
        title: 'Adaptive Replanning Triggered',
        message: res.message
      });
      loadPlan();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading personalized study plan & revision schedule...</p>
      </div>
    );
  }

  const days = studyPlanDoc?.days || [];
  const currentDay = days[selectedDayIndex] || days[0];

  const tasks = (currentDay?.tasks || []).filter(t => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const adaptationLogs = studyPlanDoc?.activeAdaptationLog || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {adaptiveToast && (
        <div className="p-4 rounded-xl glass-panel border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-zinc-900 dark:text-white animate-pulse" />
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{adaptiveToast.title}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{adaptiveToast.message}</p>
            </div>
          </div>
          <button onClick={() => setAdaptiveToast(null)} className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">ADAPTIVE TIMELINE</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">Multi-Day Study Schedule</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Dynamic distribution weighted by topic difficulty, weakness scores, and upcoming exam deadlines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-md transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{regenerating ? 'Re-balancing Plan...' : 'Re-balance Plan with AI'}</span>
          </button>
        </div>
      </div>

      {/* Schedule Notifications & Reminders Banner */}
      <ScheduleNotificationBanner todayPlan={currentDay?.tasks || []} onNotificationSent={loadPlan} />

      {/* 7-Day Horizontal Calendar Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {days.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const taskCount = day.tasks?.length || 0;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-3.5 rounded-2xl min-w-[140px] text-left transition-all border shrink-0 ${
                isSelected
                  ? 'glass-panel border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800/80 shadow-lg'
                  : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
              }`}>
                {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `Day ${idx + 1}`}
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block mt-0.5">{day.dayName}</span>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400">
                <span>{taskCount} sessions</span>
                <span className="font-mono">{day.totalMinutes}m</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Schedule Content & Adaptation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 spans: Tasks for selected day */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {currentDay?.dayName} Sessions
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Total planned focus: {currentDay?.totalMinutes || 0} minutes
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              {['all', 'learning', 'revision', 'quiz'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    filterType === type
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                No sessions match the selected filter for this day.
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                  onSkip={handleTaskSkip}
                />
              ))
            )}
          </div>
        </div>

        {/* Right 1 span: Adaptation Audit Trail */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-zinc-900 dark:text-white" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                ADAPTIVE LEARNING LOG
              </h3>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Every skipped task, quiz outcome, and confidence rating actively reshapes your future timetable:
            </p>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {adaptationLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 pl-6">No dynamic adaptations recorded yet.</p>
              ) : (
                adaptationLogs.slice(-5).reverse().map((log, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white ring-4 ring-zinc-100 dark:ring-zinc-900" />
                    <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 block">{log.trigger}</span>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">{log.changeDescription}</p>
                    <span className="text-[9px] text-zinc-400 font-mono mt-1 block">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
