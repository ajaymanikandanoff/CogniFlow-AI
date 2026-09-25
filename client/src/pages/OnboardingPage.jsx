import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function OnboardingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [studyHours, setStudyHours] = useState(2.5);

  // Topics list: can be typed one by one or pasted
  const [topicsInput, setTopicsInput] = useState('');
  const [topicList, setTopicList] = useState([]);
  const [newTopicItem, setNewTopicItem] = useState('');

  const handleAddTopic = () => {
    if (!newTopicItem.trim()) return;
    setTopicList([...topicList, newTopicItem.trim()]);
    setNewTopicItem('');
  };

  const handleRemoveTopic = (idx) => {
    setTopicList(topicList.filter((_, i) => i !== idx));
  };

  const handleStep1Next = () => {
    setError('');
    if (!subjectName.trim()) {
      setError('Please enter your subject name to continue.');
      return;
    }
    setStep(2);
  };

  const handleCreatePlan = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Create the student's custom subject
      const subRes = await api.createSubject({
        name: subjectName.trim(),
        examDate,
        targetScore: 85,
        currentPerformance: 60
      });
      const createdSub = subRes.subject;

      // 2. Prepare syllabus units
      let rawTextToParse = '';
      if (topicList.length > 0) {
        rawTextToParse = topicList.map(t => `- ${t}`).join('\n');
      } else if (topicsInput.trim()) {
        rawTextToParse = topicsInput.trim();
      } else {
        rawTextToParse = `Unit 1: ${subjectName} Fundamentals\n- Key Concepts and Definitions\n- Basic Principles\n\nUnit 2: Advanced Topics\n- Practical Problem Solving\n- Core Applications`;
      }

      // 3. Upload & parse syllabus
      const parsed = await api.uploadSyllabusText({
        subjectName: createdSub.name,
        subjectId: createdSub._id,
        rawText: rawTextToParse
      });

      if (parsed.parsedStructure) {
        await api.saveParsedSyllabus({
          subjectId: createdSub._id,
          subjectName: createdSub.name,
          examDate: createdSub.examDate,
          units: parsed.parsedStructure.units
        });
      }

      // 4. Update study hours
      await api.updateProfile({
        dailyAvailableHours: parseFloat(studyHours),
        onboardingCompleted: true
      });

      // 5. Generate initial study plan
      await api.generatePlan();

      navigate('/dashboard');
    } catch (err) {
      setError('Could not generate plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Friendly Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white mb-3 shadow-md">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Create Your Study Plan in 1 Minute
        </h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
          Tell us your subject, exam date, and topics. We'll handle the daily schedule!
        </p>
      </div>

      {/* 2-Step Simple Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-2 text-xs font-semibold ${step === 1 ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 1 ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-emerald-600 text-white'
          }`}>
            {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
          </span>
          <span>Subject & Exam Date</span>
        </div>

        <div className="w-8 h-0.5 bg-zinc-200 dark:bg-zinc-800" />

        <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step === 2 ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}>
            2
          </span>
          <span>Topics to Study</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 shadow-2xl">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Subject, Exam Date, Hours */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                What subject are you studying for? <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Physics, Data Structures, Economics, Chemistry, Law..."
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStep1Next(); }}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-950 dark:focus:border-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>When is your exam?</span>
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-zinc-950 dark:focus:border-white transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>How many hours can you study each day?</span>
                </label>
                <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{studyHours} hrs/day</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                className="w-full accent-zinc-900 dark:accent-white"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                <span>1 Hour (Light)</span>
                <span>2.5 Hours (Standard)</span>
                <span>6+ Hours (Intense)</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleStep1Next}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold shadow-lg transition"
              >
                <span>Next: Add Topics</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Topics */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                Add Topics for <span className="text-zinc-950 dark:text-white font-bold">{subjectName}</span>
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
                Type topic names one by one, or paste your syllabus topics below.
              </p>

              {/* Quick Topic Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Type a topic (e.g. Thermodynamics, Recursion, Optics...)"
                  value={newTopicItem}
                  onChange={(e) => setNewTopicItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopic(); }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-950 dark:focus:border-white transition"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition"
                >
                  + Add
                </button>
              </div>

              {/* Topics Pills */}
              {topicList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                  {topicList.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(idx)}
                        className="text-zinc-400 hover:text-rose-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Or Paste Area */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1.5">
                  Or paste syllabus text directly:
                </span>
                <textarea
                  rows={4}
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="Unit 1: Introduction...&#10;Unit 2: Important Topics...&#10;(You can also leave this blank and AI will create standard topics!)"
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:border-zinc-950 dark:focus:border-white transition"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleCreatePlan}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold shadow-xl transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Creating Your Study Plan...' : '✨ Generate My Study Plan'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
