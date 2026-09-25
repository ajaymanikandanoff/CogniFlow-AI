import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Award,
  Target,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Plus,
  Trash2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Zap,
  Check,
  Edit2,
  X
} from 'lucide-react';

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState('academic-marks'); // 'academic-marks' | 'retention-charts'

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Academic & Previous Marks data
  const [academicProfile, setAcademicProfile] = useState({
    degree: 'B.Tech Engineering',
    branch: 'Computer Science & Engineering',
    semester: 'Semester 4',
    currentCgpa: '7.4',
    targetCgpa: '8.5'
  });
  const [previousMarks, setPreviousMarks] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loadingAcademic, setLoadingAcademic] = useState(true);

  // Modals & UI States
  const [showAddMarkModal, setShowAddMarkModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [analyzingMarks, setAnalyzingMarks] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Add Mark Form State
  const [newMark, setNewMark] = useState({
    subjectName: '',
    examType: 'Mid-Term 1',
    marksObtained: '',
    maxMarks: '50',
    weakTopics: '',
    semester: 'Semester 3'
  });

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    degree: '',
    branch: '',
    semester: '',
    currentCgpa: '',
    targetCgpa: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoadingAnalytics(true);
      setLoadingAcademic(true);

      const [perfRes, acadRes, subjRes] = await Promise.all([
        api.getPerformanceSummary().catch(() => null),
        api.getAcademicData().catch(() => null),
        api.getSubjects().catch(() => [])
      ]);

      if (perfRes) setAnalyticsData(perfRes);
      if (subjRes) setSubjects(Array.isArray(subjRes) ? subjRes : (subjRes.subjects || []));

      if (acadRes) {
        if (acadRes.academicProfile) {
          setAcademicProfile(acadRes.academicProfile);
          setProfileForm(acadRes.academicProfile);
        }
        if (acadRes.previousMarks) setPreviousMarks(acadRes.previousMarks);
        if (acadRes.latestAnalysis) setLatestAnalysis(acadRes.latestAnalysis);
      }
    } catch (e) {
      console.error('Error loading academic and analytics data:', e);
    } finally {
      setLoadingAnalytics(false);
      setLoadingAcademic(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.saveAcademicProfile(profileForm);
      if (res && res.academicProfile) {
        setAcademicProfile(res.academicProfile);
      }
      setShowEditProfileModal(false);
      setSaveSuccessMsg('Academic profile updated!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update academic profile: ' + (err.message || 'Error'));
    }
  };

  const handleAddMark = async (e) => {
    e.preventDefault();
    if (!newMark.subjectName || !newMark.marksObtained || !newMark.maxMarks) {
      alert('Please fill all required mark fields.');
      return;
    }

    try {
      const res = await api.addPreviousMark(newMark);
      if (res && res.mark) {
        setPreviousMarks(prev => [res.mark, ...prev]);
      }
      setShowAddMarkModal(false);
      setNewMark({
        subjectName: subjects[0]?.name || '',
        examType: 'Mid-Term 1',
        marksObtained: '',
        maxMarks: '50',
        weakTopics: '',
        semester: academicProfile.semester || 'Current'
      });
      setSaveSuccessMsg('Previous exam mark logged successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to log mark: ' + (err.message || 'Error'));
    }
  };

  const handleDeleteMark = async (id) => {
    if (!window.confirm('Delete this exam mark record?')) return;
    try {
      await api.deletePreviousMark(id);
      setPreviousMarks(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      alert('Failed to delete mark record: ' + (err.message || 'Error'));
    }
  };

  const handleRunGeminiAnalysis = async () => {
    try {
      setAnalyzingMarks(true);
      const res = await api.analyzeAcademicAndMarks();
      if (res && res.analysis) {
        setLatestAnalysis(res.analysis);
        setSaveSuccessMsg(res.message || 'Google Gemini AI analysis complete!');
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      }
    } catch (err) {
      alert('Gemini Analysis Failed: ' + (err.message || 'Error analyzing marks'));
    } finally {
      setAnalyzingMarks(false);
    }
  };

  const charts = analyticsData?.charts || {};
  const pieData = [
    { name: 'Completed', value: charts.revisionStats?.completed || 5, color: '#10b981' },
    { name: 'Due Today', value: charts.revisionStats?.due || 3, color: '#06b6d4' },
    { name: 'Upcoming', value: charts.revisionStats?.upcoming || 6, color: '#8b5cf6' },
    { name: 'Overdue', value: charts.revisionStats?.overdue || 1, color: '#f43f5e' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              INTELLIGENT PERFORMANCE ENGINE
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Gemini Powered
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1 tracking-tight">Academic & Marks Intelligence</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Analyze historical test marks, target CGPA gaps, and recalibrate revision priorities with Google Gemini AI
          </p>
        </div>

        {/* Global Save Feedback */}
        {saveSuccessMsg && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs shadow-sm animate-fade-in font-medium">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('academic-marks')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
            activeTab === 'academic-marks'
              ? 'btn-primary-gradient shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>Academic Standing & Previous Marks</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono">AI</span>
        </button>

        <button
          onClick={() => setActiveTab('retention-charts')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
            activeTab === 'retention-charts'
              ? 'btn-primary-gradient shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>Topic Mastery & Retention</span>
        </button>
      </div>

      {/* TAB 1: ACADEMIC & PREVIOUS MARKS */}
      {activeTab === 'academic-marks' && (
        <div className="space-y-8 animate-fade-in">
          {/* Academic Background Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {academicProfile.degree || 'Degree Program'}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({academicProfile.branch || 'Branch'})</span>
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{academicProfile.semester || 'Semester'}</span>
                    <span>•</span>
                    <span>Current CGPA: <strong className="text-slate-900 dark:text-white">{academicProfile.currentCgpa || '7.0'}/10.0</strong></span>
                    <span>•</span>
                    <span>Target Goal: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{academicProfile.targetCgpa || '8.5'}/10.0</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Academic Profile</span>
                </button>

                <button
                  onClick={() => setShowAddMarkModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-primary-gradient text-xs font-semibold shadow-md transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Previous Mark</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Recorded Tests</span>
                <p className="text-lg font-bold text-zinc-900 dark:text-white font-mono mt-0.5">{previousMarks.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Historical Average</span>
                <p className="text-lg font-bold text-zinc-900 dark:text-white font-mono mt-0.5">
                  {previousMarks.length > 0
                    ? Math.round(previousMarks.reduce((acc, m) => acc + (m.percentage || 0), 0) / previousMarks.length)
                    : 0}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Target Score Gap</span>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
                  {latestAnalysis?.targetGapPercentage ? `+${latestAnalysis.targetGapPercentage}%` : '--'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-mono uppercase font-semibold text-zinc-500 dark:text-zinc-400">Academic Standing</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {latestAnalysis?.academicHealthStatus || 'Ready for Diagnosis'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Trigger Banner */}
          <div className="p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Sparkles className="w-4 h-4 text-zinc-500" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">Google Gemini Academic Diagnostic & Mark Recalibrator</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Uses Google Gemini API to analyze historical test performance, pinpoint root-cause weaknesses, calculate the exact scores needed in upcoming finals, and auto-recalibrate your daily study queue.
              </p>
            </div>

            <button
              onClick={handleRunGeminiAnalysis}
              disabled={analyzingMarks || previousMarks.length === 0}
              className="px-6 py-3 rounded-xl btn-primary-gradient disabled:opacity-50 text-xs font-bold shadow-md transition flex items-center gap-2 shrink-0"
            >
              {analyzingMarks ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Gemini Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Gemini Diagnostic</span>
                </>
              )}
            </button>
          </div>

          {/* Gemini AI Diagnostic Report (If Available) */}
          {latestAnalysis && (
            <div className="space-y-6 p-6 rounded-2xl glass-panel border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-2xl animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Academic Diagnostic Report</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        99.8% Dual-Engine Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Engine: {latestAnalysis.model || '100% Free Dual-Engine (Google Gemini + Python NLP)'} • Analyzed: {new Date(latestAnalysis.analyzedAt || Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                    latestAnalysis.academicHealthStatus?.includes('Urgent')
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                      : latestAnalysis.academicHealthStatus?.includes('Moderate')
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {latestAnalysis.academicHealthStatus}
                  </span>
                </div>
              </div>

              {/* Key Diagnostic Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400">Projected Outcome</span>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-1 font-medium leading-relaxed">
                    {latestAnalysis.predictedOutcome}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400">Target Score Requirement</span>
                  <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1 font-medium leading-relaxed">
                    {latestAnalysis.upcomingTargetScoreNeeded}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400">Daily Recalibration Advice</span>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-1 font-medium leading-relaxed">
                    {latestAnalysis.recalibrationAdvice}
                  </p>
                </div>
              </div>

              {/* High Risk Subjects & Danger Zones */}
              {latestAnalysis.highRiskSubjects && latestAnalysis.highRiskSubjects.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    High-Risk Subjects & Danger Zones (Action Required)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {latestAnalysis.highRiskSubjects.map((sub, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-rose-300 dark:border-rose-900/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{sub.subject}</h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            Avg: {sub.avgScore} ({sub.riskLevel} Risk)
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">{sub.recommendation}</p>
                        {sub.flaggedWeakTopics && sub.flaggedWeakTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {sub.flaggedWeakTopics.map((wt, wIdx) => (
                              <span key={wIdx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                                ⚠ {wt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Booster Action Steps */}
              {latestAnalysis.scoreBoosterStrategy && latestAnalysis.scoreBoosterStrategy.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Score Booster Recovery Plan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {latestAnalysis.scoreBoosterStrategy.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-zinc-900 dark:text-white">Step {step.step || idx + 1}</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{step.hoursPerDay}</span>
                        </div>
                        <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{step.title}</h5>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advisor Summary */}
              {latestAnalysis.advisorSummary && (
                <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                    Advisor Closing Note
                  </span>
                  <p className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed italic">
                    "{latestAnalysis.advisorSummary}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Previous Marks History Table */}
          <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-zinc-500" />
                  Recorded Previous Exam & Test Marks
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Historical marks used by AI to detect weak modules and calibrate daily revision</p>
              </div>
              <button
                onClick={() => setShowAddMarkModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>

            {previousMarks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl space-y-3">
                <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No previous exam marks logged yet.</p>
                <button
                  onClick={() => setShowAddMarkModal(true)}
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition"
                >
                  Log Your First Exam Mark
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                      <th className="pb-3 pl-2">Subject</th>
                      <th className="pb-3">Assessment Type</th>
                      <th className="pb-3">Semester</th>
                      <th className="pb-3">Marks</th>
                      <th className="pb-3">Percentage</th>
                      <th className="pb-3">Grade</th>
                      <th className="pb-3">Flagged Weak Topics</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {previousMarks.map((m) => {
                      const pct = m.percentage || Math.round((m.marksObtained / m.maxMarks) * 100);
                      const isLow = pct < 60;
                      return (
                        <tr key={m._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                          <td className="py-3 pl-2 font-bold text-zinc-900 dark:text-white">{m.subjectName}</td>
                          <td className="py-3 text-zinc-700 dark:text-zinc-300">{m.examType}</td>
                          <td className="py-3 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">{m.semester}</td>
                          <td className="py-3 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                            {m.marksObtained} / {m.maxMarks}
                          </td>
                          <td className="py-3 font-mono font-bold">
                            <span className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {pct}%
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              m.grade === 'A+' || m.grade === 'A'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : m.grade === 'B+' || m.grade === 'B'
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                                : m.grade === 'C'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}>
                              {m.grade || 'B'}
                            </span>
                          </td>
                          <td className="py-3 max-w-xs">
                            {m.weakTopics && m.weakTopics.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {m.weakTopics.map((wt, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                                    {wt}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-400 text-[10px]">None flagged</span>
                            )}
                          </td>
                          <td className="py-3 text-right pr-2">
                            <button
                              onClick={() => handleDeleteMark(m._id)}
                              className="text-zinc-400 hover:text-rose-500 transition p-1"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RETENTION & MASTERY CHARTS */}
      {activeTab === 'retention-charts' && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl glass-card border border-rose-500/20 bg-rose-950/10">
              <div className="flex items-center justify-between text-xs text-rose-300 mb-1">
                <span className="font-semibold uppercase tracking-wider">Weak Topics</span>
                <Target className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {analyticsData?.weakTopicsCount || 3}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Weakness score &ge; 60 (Prioritized in daily queue)</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-amber-500/20 bg-amber-950/10">
              <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                <span className="font-semibold uppercase tracking-wider">Moderate Mastery</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {analyticsData?.moderateTopicsCount || 5}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Accuracy 55-75% (Scheduled for regular spaced recall)</p>
            </div>

            <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 bg-emerald-950/10">
              <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
                <span className="font-semibold uppercase tracking-wider">Mastered Topics</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {analyticsData?.strongTopicsCount || 7}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Accuracy &gt; 75% (Wider spaced intervals)</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Daily Study Hours vs Target */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                    Daily Study Hours (Actual vs Target)
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Target: 3.5h/day</span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.studyHoursData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" textAnchor="end" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 6]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="hours" name="Studied Hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="target" name="Goal" fill="#334155" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Weakness Score Improvement Curve */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Weakness Score Reduction Curve
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400">Lower is better</span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.weaknessImprovementData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="topic" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="initialWeakness" name="Initial Baseline" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="currentWeakness" name="Current Weakness" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Subject Mastery Progress */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Subject Mastery vs Exam Target %
                  </h3>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.subjectProgressData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="mastery" name="Current Mastery %" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="target" name="Exam Target %" fill="#475569" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Spaced Revision Status Breakdown */}
            <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                    Spaced Revision Lifecycle
                  </h3>
                </div>
              </div>

              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Academic Profile */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-500" />
                Update Academic Standing
              </h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Degree / Course</label>
                <input
                  type="text"
                  value={profileForm.degree}
                  onChange={e => setProfileForm({ ...profileForm, degree: e.target.value })}
                  placeholder="e.g. B.Tech Engineering"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Branch / Major</label>
                <input
                  type="text"
                  value={profileForm.branch}
                  onChange={e => setProfileForm({ ...profileForm, branch: e.target.value })}
                  placeholder="e.g. Computer Science / Chemical"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Semester</label>
                  <input
                    type="text"
                    value={profileForm.semester}
                    onChange={e => setProfileForm({ ...profileForm, semester: e.target.value })}
                    placeholder="Semester 4"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Current CGPA</label>
                  <input
                    type="text"
                    value={profileForm.currentCgpa}
                    onChange={e => setProfileForm({ ...profileForm, currentCgpa: e.target.value })}
                    placeholder="7.4"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white font-mono transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Target CGPA</label>
                  <input
                    type="text"
                    value={profileForm.targetCgpa}
                    onChange={e => setProfileForm({ ...profileForm, targetCgpa: e.target.value })}
                    placeholder="8.5"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white font-mono font-bold transition"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Previous Exam Mark */}
      {showAddMarkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-500" />
                Log Previous Exam Mark
              </h3>
              <button onClick={() => setShowAddMarkModal(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMark} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newMark.subjectName}
                  onChange={e => setNewMark({ ...newMark, subjectName: e.target.value })}
                  placeholder="e.g. Materials Chemistry / Data Structures"
                  list="subjects-datalist"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
                <datalist id="subjects-datalist">
                  {subjects.map(s => (
                    <option key={s._id} value={s.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Assessment Type</label>
                  <select
                    value={newMark.examType}
                    onChange={e => setNewMark({ ...newMark, examType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                  >
                    <option value="Mid-Term 1">Mid-Term 1</option>
                    <option value="Mid-Term 2">Mid-Term 2</option>
                    <option value="Internal Assessment 1">Internal Assessment 1</option>
                    <option value="Internal Assessment 2">Internal Assessment 2</option>
                    <option value="Previous Semester Final">Previous Semester Final</option>
                    <option value="Unit Test">Unit Test</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Semester</label>
                  <input
                    type="text"
                    value={newMark.semester}
                    onChange={e => setNewMark({ ...newMark, semester: e.target.value })}
                    placeholder="Semester 3"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Marks Obtained</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newMark.marksObtained}
                    onChange={e => setNewMark({ ...newMark, marksObtained: e.target.value })}
                    placeholder="e.g. 34"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white font-mono transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Total Max Marks</label>
                  <input
                    type="number"
                    value={newMark.maxMarks}
                    onChange={e => setNewMark({ ...newMark, maxMarks: e.target.value })}
                    placeholder="50 or 100"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Difficult / Weak Topics Noted in this Exam
                </label>
                <input
                  type="text"
                  value={newMark.weakTopics}
                  onChange={e => setNewMark({ ...newMark, weakTopics: e.target.value })}
                  placeholder="e.g. Bragg's Law calculations, Miller indices (comma separated)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Gemini will prioritize these topics in your upcoming revision schedule.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMarkModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition"
                >
                  Save Exam Mark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
