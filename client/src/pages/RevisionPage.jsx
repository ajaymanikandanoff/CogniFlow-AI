import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  RotateCcw,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Check
} from 'lucide-react';

export default function RevisionPage() {
  const [revisionsData, setRevisionsData] = useState({
    dueToday: [],
    upcoming: [],
    completed: [],
    overdue: []
  });
  const [activeTab, setActiveTab] = useState('dueToday');
  const [loading, setLoading] = useState(true);

  // Active Revision Modal
  const [activeRevision, setActiveRevision] = useState(null);
  const [confidenceLevel, setConfidenceLevel] = useState('medium');
  const [completing, setCompleting] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState(null);

  useEffect(() => {
    loadRevisions();
  }, []);

  const loadRevisions = async () => {
    try {
      setLoading(true);
      const res = await api.getRevisions();
      setRevisionsData({
        dueToday: res.dueToday || [],
        upcoming: res.upcoming || [],
        completed: res.completed || [],
        overdue: res.overdue || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRevision = (rev) => {
    setActiveRevision(rev);
    setConfidenceLevel('medium');
    setRevisionFeedback(null);
  };

  const handleConfirmRevision = async () => {
    if (!activeRevision) return;
    setCompleting(true);
    try {
      const res = await api.completeRevision(activeRevision._id, {
        confidenceLevel
      });
      setRevisionFeedback(res.message);
      setTimeout(() => {
        setActiveRevision(null);
        setRevisionFeedback(null);
        loadRevisions();
      }, 1500);
    } catch (err) {
      alert('Error recording revision: ' + err.message);
    } finally {
      setCompleting(false);
    }
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'overdue':
        return revisionsData.overdue;
      case 'upcoming':
        return revisionsData.upcoming;
      case 'completed':
        return revisionsData.completed;
      default:
        return revisionsData.dueToday;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">SPACED REPETITION ENGINE</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">Smart Revision Coach</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
          Ebbinghaus-informed spaced retention cycles (Day 1 &rarr; 2 &rarr; 4 &rarr; 7 &rarr; 12) calibrated to your confidence
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        {[
          { id: 'dueToday', label: 'Due Today', count: revisionsData.dueToday.length, color: 'text-zinc-900 dark:text-white' },
          { id: 'overdue', label: 'Overdue', count: revisionsData.overdue.length, color: 'text-rose-500' },
          { id: 'upcoming', label: 'Upcoming', count: revisionsData.upcoming.length, color: 'text-zinc-500' },
          { id: 'completed', label: 'Completed', count: revisionsData.completed.length, color: 'text-emerald-500' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 glass-panel rounded-2xl">
            Loading spaced repetition checkpoints...
          </div>
        ) : getActiveList().length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            No items in {activeTab}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getActiveList().map((rev) => (
              <div key={rev._id} className="p-5 rounded-2xl glass-card border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {rev.subjectName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      Priority: {rev.currentPriority || 75}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{rev.topicName}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {rev.recommendedDurationMinutes || 30} mins
                    </span>
                    {rev.previousScore && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        Prev: {rev.previousScore}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Due: {new Date(rev.dueDate).toLocaleDateString()}
                  </span>

                  {rev.status !== 'completed' ? (
                    <button
                      onClick={() => handleStartRevision(rev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow transition"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Revision</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mastered ({rev.confidenceFeedback || 'Medium'})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Revision Modal with Confidence Feedback */}
      {activeRevision && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block mb-1">
              ACTIVE REVISION SESSION
            </span>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-1">{activeRevision.topicName}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{activeRevision.subjectName} • Recommended: {activeRevision.recommendedDurationMinutes || 30} mins</p>

            {/* Prompt for Confidence Rating */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 mb-6">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3 text-center">
                How confident do you feel after revising this topic?
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setConfidenceLevel('low')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    confidenceLevel === 'low'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  <Frown className="w-6 h-6 text-rose-500" />
                  <span className="text-xs font-bold">Low (😟)</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Increases priority, repeats sooner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfidenceLevel('medium')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    confidenceLevel === 'medium'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  <Meh className="w-6 h-6 text-amber-500" />
                  <span className="text-xs font-bold">Medium (😐)</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Keeps normal interval cadence</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfidenceLevel('high')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                    confidenceLevel === 'high'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  <Smile className="w-6 h-6 text-emerald-500" />
                  <span className="text-xs font-bold">High (🙂)</span>
                  <span className="text-[9px] text-zinc-400 leading-tight">Widens interval, lowers priority</span>
                </button>
              </div>
            </div>

            {revisionFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs mb-4 text-center">
                {revisionFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveRevision(null)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={completing}
                className="px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold shadow-lg transition"
              >
                {completing ? 'Recording Feedback...' : 'Complete & Update Adaptive Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
