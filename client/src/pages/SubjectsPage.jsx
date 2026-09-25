import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  Upload,
  X
} from 'lucide-react';

export default function SubjectsPage() {
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Subject Form State
  const [newSub, setNewSub] = useState({
    name: '',
    examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    topicsText: ''
  });

  // Inline topic input
  const [newTopicName, setNewTopicName] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);

  useEffect(() => {
    loadSubjects();
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
    }
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
      if (res.subjects && res.subjects.length > 0) {
        handleSelectSubject(res.subjects[0]);
      } else {
        setSelectedSubject(null);
        setSubjectDetails(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    setLoadingDetails(true);
    try {
      const res = await api.getSubjectById(sub._id);
      setSubjectDetails(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSub.name.trim()) return;

    try {
      await api.createSubject({
        name: newSub.name.trim(),
        examDate: newSub.examDate,
        topics: newSub.topicsText
      });
      setShowAddModal(false);
      setNewSub({
        name: '',
        examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        topicsText: ''
      });
      await loadSubjects();
    } catch (err) {
      alert('Error creating subject: ' + err.message);
    }
  };

  const handleAddInlineTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedSubject) return;

    try {
      setAddingTopic(true);
      const res = await api.addTopicToSubject(selectedSubject._id, {
        name: newTopicName.trim(),
        difficulty: 2,
        estimatedMinutes: 45
      });
      setNewTopicName('');
      setSubjectDetails(res);
      await loadSubjects();
    } catch (err) {
      alert('Error adding topic: ' + err.message);
    } finally {
      setAddingTopic(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}" and all its topics?`)) return;
    try {
      await api.deleteSubject(id);
      loadSubjects();
    } catch (err) {
      alert('Failed to delete subject: ' + err.message);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await api.deleteTopic(selectedSubject._id, topicId);
      if (selectedSubject) {
        handleSelectSubject(selectedSubject);
      }
    } catch (err) {
      alert('Failed to delete topic: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">My Subjects & Topics</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Type your subjects, set exam dates, and list what you need to study.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/syllabus-upload"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-xs font-semibold transition shadow-xs"
          >
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Upload Syllabus PDF</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Subjects List on Left, Selected Topics on Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Subjects */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Subjects ({subjects.length})
          </h3>

          {loading ? (
            <div className="p-6 text-center text-xs text-zinc-400 glass-panel rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-6 rounded-2xl glass-panel text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-3 shadow-sm">
              <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">No Subjects Added</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                You haven't added any subjects yet. Click below to type in your first subject!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl btn-primary-gradient text-xs font-semibold shadow-md"
              >
                + Add Subject
              </button>
            </div>
          ) : (
            subjects.map((sub) => {
              const isSelected = selectedSubject?._id === sub._id;
              return (
                <div
                  key={sub._id}
                  onClick={() => handleSelectSubject(sub)}
                  className={`p-4 rounded-xl glass-card cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {sub.topicsCount || 0} topics registered
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                      {sub.daysLeft}d left
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span>Exam: {new Date(sub.examDate).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(sub._id, sub.name);
                      }}
                      className="text-zinc-400 hover:text-rose-500 transition"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Topics in Selected Subject */}
        <div className="md:col-span-2 space-y-4">
          {loadingDetails ? (
            <div className="p-10 text-center text-xs text-zinc-400 glass-panel rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              Loading topics...
            </div>
          ) : selectedSubject && subjectDetails ? (
            <div className="space-y-4">
              {/* Subject Title Banner */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedSubject.name}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                    Exam: {new Date(selectedSubject.examDate).toLocaleDateString()} ({selectedSubject.daysLeft} days left)
                  </p>
                </div>
                <Link
                  to="/quiz"
                  state={{ subjectName: selectedSubject.name }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold transition"
                >
                  Take Practice Quiz
                </Link>
              </div>

              {/* Inline Add Topic Box */}
              <form onSubmit={handleAddInlineTopic} className="glass-panel p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex gap-2 shadow-sm">
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Type a new topic to study (e.g. Newton's Laws, Derivatives)..."
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
                <button
                  type="submit"
                  disabled={addingTopic || !newTopicName.trim()}
                  className="px-4 py-2 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold transition shadow-sm"
                >
                  {addingTopic ? 'Adding...' : '+ Add Topic'}
                </button>
              </form>

              {/* Topics List */}
              <div className="space-y-2">
                {(!subjectDetails.topics || subjectDetails.topics.length === 0) ? (
                  <div className="p-8 rounded-xl glass-panel text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">No topics added for this subject yet.</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Use the box above to type in your first topic.</p>
                  </div>
                ) : (
                  subjectDetails.topics.map((t) => (
                    <div
                      key={t._id}
                      className="p-3.5 rounded-xl glass-card border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" />
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{t.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              {t.estimatedMinutes || 45} mins
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                              t.difficulty === 3
                                ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : t.difficulty === 1
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                            }`}>
                              {t.difficulty === 3 ? 'Hard' : t.difficulty === 1 ? 'Easy' : 'Moderate'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTopic(t._id)}
                        className="text-zinc-400 hover:text-rose-500 transition p-1"
                        title="Delete topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-zinc-400 glass-panel rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              Select a subject from the left column to view its topic checklist.
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-500" />
                Add New Subject
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                  placeholder="e.g. Mathematics, Machine Learning, World History..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={newSub.examDate}
                  onChange={(e) => setNewSub({ ...newSub, examDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Topics to Study (Optional - separate by commas or new lines)
                </label>
                <textarea
                  rows={4}
                  value={newSub.topicsText}
                  onChange={(e) => setNewSub({ ...newSub, topicsText: e.target.value })}
                  placeholder="e.g.&#10;Limits & Continuity&#10;Derivatives&#10;Integration&#10;Differential Equations"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white resize-none transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Have a syllabus PDF document?</span>
                <Link
                  to="/syllabus-upload"
                  className="text-zinc-900 dark:text-white font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Upload PDF instead</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold shadow-md transition"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
