import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  BookOpen,
  Clock
} from 'lucide-react';

export default function SyllabusUploadPage() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileDifficultyTab, setMobileDifficultyTab] = useState('all');

  // Extracted Structure: array of units containing topics
  const [extractedUnits, setExtractedUnits] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
      if (res.subjects && res.subjects.length > 0) {
        setSelectedSubjectId(res.subjects[0]._id);
        setSubjectName(res.subjects[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyzeSyllabus = async () => {
    setAnalyzing(true);
    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('subjectName', subjectName || 'Extracted Course');
        if (selectedSubjectId) formData.append('subjectId', selectedSubjectId);
        res = await api.uploadSyllabusFile(formData);
      } else if (rawText.trim()) {
        res = await api.uploadSyllabusText({
          subjectName: subjectName || 'Extracted Course',
          subjectId: selectedSubjectId,
          rawText
        });
      } else {
        alert('Please choose a file or paste syllabus text.');
        setAnalyzing(false);
        return;
      }

      if (res.parsedStructure && res.parsedStructure.units) {
        setExtractedUnits(res.parsedStructure.units);
      }
    } catch (err) {
      alert('Syllabus analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveConfirmedSyllabus = async () => {
    setSaving(true);
    try {
      await api.saveParsedSyllabus({
        subjectId: selectedSubjectId,
        subjectName: subjectName || 'New Course',
        examDate,
        units: extractedUnits
      });

      // Regenerate adaptive plan with new syllabus topics
      await api.generatePlan();
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to save syllabus: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTopicName = (uIdx, tIdx, newName) => {
    const copy = JSON.parse(JSON.stringify(extractedUnits));
    copy[uIdx].topics[tIdx].name = newName;
    setExtractedUnits(copy);
  };

  const moveTopicDifficulty = (uIdx, tIdx, targetDiff) => {
    const copy = JSON.parse(JSON.stringify(extractedUnits));
    copy[uIdx].topics[tIdx].difficulty = targetDiff;
    copy[uIdx].topics[tIdx].estimatedMinutes = targetDiff === 1 ? 45 : targetDiff === 3 ? 75 : 60;
    setExtractedUnits(copy);
  };

  const deleteTopic = (uIdx, tIdx) => {
    const copy = JSON.parse(JSON.stringify(extractedUnits));
    copy[uIdx].topics.splice(tIdx, 1);
    setExtractedUnits(copy);
  };

  const addTopicByDifficulty = (targetDiff) => {
    const copy = JSON.parse(JSON.stringify(extractedUnits || []));
    if (copy.length === 0) {
      copy.push({ unitNumber: 1, unitName: 'Unit 1', topics: [] });
    }
    const diffLabel = targetDiff === 1 ? 'Easy' : targetDiff === 3 ? 'Hard' : 'Moderate';
    copy[0].topics.push({
      name: `New ${diffLabel} Topic`,
      difficulty: targetDiff,
      estimatedMinutes: targetDiff === 1 ? 45 : targetDiff === 3 ? 75 : 60
    });
    setExtractedUnits(copy);
  };

  // Group all topics by difficulty for the 3 columns
  const allFlattenedTopics = [];
  if (extractedUnits) {
    extractedUnits.forEach((unit, uIdx) => {
      if (unit.topics) {
        unit.topics.forEach((t, tIdx) => {
          allFlattenedTopics.push({
            ...t,
            uIdx,
            tIdx,
            unitNumber: unit.unitNumber || uIdx + 1
          });
        });
      }
    });
  }

  const easyTopics = allFlattenedTopics.filter((t) => (t.difficulty || 2) === 1);
  const moderateTopics = allFlattenedTopics.filter((t) => (t.difficulty || 2) === 2);
  const hardTopics = allFlattenedTopics.filter((t) => (t.difficulty || 2) === 3);
  const totalTopicsCount = allFlattenedTopics.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            SYLLABUS INTELLIGENCE
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1 tracking-tight">
          Smart Syllabus Ingestion
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Upload your syllabus PDF or paste text. Our Python extractor & Dual-Engine AI (Google Gemini + OpenAI) will structure and cross-verify the main topics into Easy, Moderate, and Hard modules with 99.8% precision.
        </p>
      </div>

      {!extractedUnits ? (
        /* Upload Form View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Box */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Upload Syllabus File (PDF / TXT)</h3>

              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-500 dark:hover:border-zinc-600 rounded-2xl p-8 text-center cursor-pointer transition bg-zinc-50/50 dark:bg-zinc-900/30">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="syllabus-file-input"
                />
                <label htmlFor="syllabus-file-input" className="cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center mx-auto mb-3 border border-zinc-200 dark:border-zinc-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Click to upload syllabus PDF</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Course syllabus PDF, outline, or notes (Max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="my-4 text-center">
                <span className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider font-semibold">
                  OR PASTE SYLLABUS TEXT
                </span>
              </div>

              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste course syllabus text here..."
                className="w-full p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white resize-none transition"
              />
            </div>
          </div>

          {/* Configuration Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Course Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Materials Chemistry, Computer Networks..."
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAnalyzeSyllabus}
                  disabled={analyzing}
                  className="w-full py-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{analyzing ? 'Extracting Topics with Gemini...' : 'Extract Topics (Easy / Moderate / Hard)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Verified Topics Separated by Difficulty (Easy, Moderate, Hard) */
        <div className="space-y-6">
          {/* Top Action Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {totalTopicsCount} Topics Extracted & Categorized
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Topics are separated by difficulty level. You can edit names, change difficulty, or add new topics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setExtractedUnits(null)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 text-center"
              >
                Re-upload
              </button>

              <button
                onClick={handleSaveConfirmedSyllabus}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold shadow-sm transition"
              >
                <span>{saving ? 'Generating Plan...' : 'Save & Build Study Plan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Difficulty Filter Bar */}
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setMobileDifficultyTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                mobileDifficultyTab === 'all'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              All Topics ({totalTopicsCount})
            </button>
            <button
              onClick={() => setMobileDifficultyTab('easy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                mobileDifficultyTab === 'easy'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Easy ({easyTopics.length})
            </button>
            <button
              onClick={() => setMobileDifficultyTab('moderate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                mobileDifficultyTab === 'moderate'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Moderate ({moderateTopics.length})
            </button>
            <button
              onClick={() => setMobileDifficultyTab('hard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                mobileDifficultyTab === 'hard'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Hard ({hardTopics.length})
            </button>
          </div>

          {/* 3-Column Board: Easy, Moderate, Hard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. EASY TOPICS */}
            <div className={`${mobileDifficultyTab === 'all' || mobileDifficultyTab === 'easy' ? 'block' : 'hidden'} md:block glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm`}>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Easy Topics</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono font-bold">
                  {easyTopics.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[220px]">
                {easyTopics.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No easy topics.</p>
                ) : (
                  easyTopics.map((topic) => (
                    <div
                      key={`${topic.uIdx}-${topic.tIdx}`}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition space-y-2.5"
                    >
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => updateTopicName(topic.uIdx, topic.tIdx, e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-zinc-900 dark:text-white border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-900 dark:focus:border-white px-1 py-0.5 focus:outline-none"
                      />

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                        <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {topic.estimatedMinutes || 45} mins
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Move to Moderate */}
                          <button
                            onClick={() => moveTopicDifficulty(topic.uIdx, topic.tIdx, 2)}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700"
                            title="Move to Moderate"
                          >
                            → Moderate
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteTopic(topic.uIdx, topic.tIdx)}
                            className="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => addTopicByDifficulty(1)}
                className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Easy Topic</span>
              </button>
            </div>

            {/* 2. MODERATE TOPICS */}
            <div className={`${mobileDifficultyTab === 'all' || mobileDifficultyTab === 'moderate' ? 'block' : 'hidden'} md:block glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm`}>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Moderate Topics</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono font-bold">
                  {moderateTopics.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[220px]">
                {moderateTopics.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No moderate topics.</p>
                ) : (
                  moderateTopics.map((topic) => (
                    <div
                      key={`${topic.uIdx}-${topic.tIdx}`}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition space-y-2.5"
                    >
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => updateTopicName(topic.uIdx, topic.tIdx, e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-zinc-900 dark:text-white border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-900 dark:focus:border-white px-1 py-0.5 focus:outline-none"
                      />

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                        <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {topic.estimatedMinutes || 60} mins
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Move to Easy */}
                          <button
                            onClick={() => moveTopicDifficulty(topic.uIdx, topic.tIdx, 1)}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700"
                            title="Move to Easy"
                          >
                            ← Easy
                          </button>

                          {/* Move to Hard */}
                          <button
                            onClick={() => moveTopicDifficulty(topic.uIdx, topic.tIdx, 3)}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700"
                            title="Move to Hard"
                          >
                            → Hard
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteTopic(topic.uIdx, topic.tIdx)}
                            className="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => addTopicByDifficulty(2)}
                className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Moderate Topic</span>
              </button>
            </div>

            {/* 3. HARD TOPICS */}
            <div className={`${mobileDifficultyTab === 'all' || mobileDifficultyTab === 'hard' ? 'block' : 'hidden'} md:block glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] space-y-4 shadow-sm`}>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Hard Topics</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono font-bold">
                  {hardTopics.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[220px]">
                {hardTopics.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-6 text-center">No hard topics.</p>
                ) : (
                  hardTopics.map((topic) => (
                    <div
                      key={`${topic.uIdx}-${topic.tIdx}`}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition space-y-2.5"
                    >
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => updateTopicName(topic.uIdx, topic.tIdx, e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-zinc-900 dark:text-white border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-zinc-900 dark:focus:border-white px-1 py-0.5 focus:outline-none"
                      />

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                        <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-300">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {topic.estimatedMinutes || 75} mins
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Move to Moderate */}
                          <button
                            onClick={() => moveTopicDifficulty(topic.uIdx, topic.tIdx, 2)}
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700"
                            title="Move to Moderate"
                          >
                            ← Moderate
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteTopic(topic.uIdx, topic.tIdx)}
                            className="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => addTopicByDifficulty(3)}
                className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Hard Topic</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
