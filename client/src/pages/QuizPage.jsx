import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import {
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function QuizPage() {
  const location = useLocation();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [generating, setGenerating] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subjectsData, perf] = await Promise.all([
        api.getSubjects().catch(() => []),
        api.getPerformanceSummary().catch(() => ({ rankedTopics: [] }))
      ]);

      const subList = subjectsData.subjects || subjectsData || [];
      setSubjects(subList);
      setTopics(perf.rankedTopics || []);

      if (location.state?.topicName) {
        setSelectedTopic(location.state.topicName);
        handleGenerateQuiz(location.state.topicName);
      } else if (subList.length > 0) {
        setSelectedSubjectId(subList[0]._id);
        if (subList[0].topics && subList[0].topics.length > 0) {
          setSelectedTopic(subList[0].topics[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Get topics for selected subject
  const currentSubject = subjects.find(s => s._id === selectedSubjectId);
  const subjectTopics = currentSubject?.topics || [];

  const handleSubjectChange = (subjId) => {
    setSelectedSubjectId(subjId);
    const subj = subjects.find(s => s._id === subjId);
    if (subj && subj.topics && subj.topics.length > 0) {
      setSelectedTopic(subj.topics[0].name);
    } else {
      setSelectedTopic('');
    }
  };

  const handleGenerateQuiz = async (topicToUse) => {
    const topicName = (topicToUse || selectedTopic || '').trim();
    if (!topicName) {
      alert('Please select or enter a topic to generate quiz questions.');
      return;
    }
    setGenerating(true);
    setQuizResult(null);
    setUserAnswers({});
    try {
      const matched = subjectTopics.find(t => t.name?.toLowerCase() === topicName.toLowerCase())
        || topics.find(t => t.name?.toLowerCase() === topicName.toLowerCase());

      const res = await api.generateQuiz({
        topicId: matched?._id,
        topicName,
        subjectName: currentSubject?.name || matched?.subjectName || 'General Curriculum',
        difficulty
      });
      setActiveQuiz(res.quiz);
    } catch (err) {
      alert('Quiz generation error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: selectedOption
    });
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz._id, {
        answers: userAnswers
      });
      setQuizResult(res);
    } catch (err) {
      alert('Failed to submit quiz: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-enter">
      {/* Header */}
      <div className="anim-up">
        <span className="mono text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--p-text)' }}>
          Active Recall & Assessment
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight" style={{ color: 'var(--t1)' }}>
          Diagnostic Quiz Engine
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
          Choose your subject and topic to generate an instant adaptive diagnostic quiz.
        </p>
      </div>

      {/* Quiz Generator Control Panel */}
      {!activeQuiz || quizResult ? (
        <div className="card p-6 rounded-2xl space-y-5 anim-scale">
          <div className="flex items-center gap-2.5 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--p-dim)', color: 'var(--p-text)' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--t1)' }}>
                Generate New Diagnostic Quiz
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
                Powered by AI consensus testing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t2)' }}>
                <span className="flex items-center gap-1.5"><BookOpen size={13} /> Subject</span>
              </label>
              {subjects.length > 0 ? (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="input text-xs w-full font-sans"
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code || 'Curriculum'})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs italic py-2" style={{ color: 'var(--t3)' }}>No subjects added yet</p>
              )}
            </div>

            {/* Topic Selector / Custom Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t2)' }}>
                <span className="flex items-center gap-1.5"><Layers size={13} /> Topic</span>
              </label>
              {subjectTopics.length > 0 ? (
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="input text-xs w-full font-sans"
                >
                  {subjectTopics.map((t) => (
                    <option key={t._id || t.name} value={t.name}>
                      {t.name} (Diff: {t.difficulty || 3}/5)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Recursion, Thermodynamics..."
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="input text-xs w-full"
                />
              )}
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--t2)' }}>
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="input text-xs w-full"
              >
                <option value="1">1 - Foundational Basics</option>
                <option value="2">2 - Moderate</option>
                <option value="3">3 - University Standard</option>
                <option value="4">4 - Advanced Conceptual</option>
                <option value="5">5 - Rigorous & Tricky</option>
              </select>
            </div>
          </div>

          {/* Custom Topic write-in if desired */}
          {subjectTopics.length > 0 && (
            <div className="pt-2">
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--t3)' }}>
                Or enter a custom sub-topic:
              </label>
              <input
                type="text"
                placeholder="Optional: Type custom sub-topic name..."
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="input text-xs w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-end pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={() => handleGenerateQuiz()}
              disabled={generating || !selectedTopic.trim()}
              className="btn btn-primary text-xs font-bold gap-2 px-6 py-2.5 disabled:opacity-40"
            >
              <Sparkles size={14} />
              <span>{generating ? 'Generating Quiz Questions...' : 'Start Diagnostic Quiz'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* QUIZ RESULTS VIEW */}
      {quizResult && (
        <div className="space-y-6 anim-up">
          <div className="card p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="mono text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--p-text)' }}>
                  ASSESSMENT COMPLETE
                </span>
                <h2 className="text-xl font-bold mt-0.5" style={{ color: 'var(--t1)' }}>{quizResult.topicName}</h2>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black mono" style={{ color: quizResult.percentage >= 70 ? 'var(--ok)' : 'var(--warn)' }}>
                  {quizResult.percentage}%
                </span>
                <span className="text-xs mono block mt-0.5" style={{ color: 'var(--t3)' }}>
                  {quizResult.score} / {quizResult.totalQuestions} Correct
                </span>
              </div>
            </div>

            <div className="py-2 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--t1)' }}>
                <Award size={15} style={{ color: 'var(--p-text)' }} />
                <span>Adaptive Learning Recalibration Applied</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
                {quizResult.adaptationNote}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <button
                onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                className="btn btn-secondary text-xs"
              >
                Back to Quiz Setup
              </button>
              <button
                onClick={() => handleGenerateQuiz()}
                className="btn btn-primary text-xs"
              >
                Try Another Quiz
              </button>
            </div>
          </div>

          {/* Detailed Question Breakdown */}
          <div className="card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Question Breakdown & Explanations</h3>

            <div className="space-y-4">
              {quizResult.analysis.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border"
                  style={{ background: 'var(--bg-3)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="mono text-xs font-bold mt-0.5" style={{ color: 'var(--t3)' }}>Q{idx + 1}.</span>
                      <p className="text-xs font-semibold" style={{ color: 'var(--t1)' }}>{q.questionText}</p>
                    </div>
                    {q.isCorrect ? (
                      <span className="flex items-center gap-1 text-[11px] mono font-bold shrink-0" style={{ color: 'var(--ok)' }}>
                        <CheckCircle2 size={14} /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] mono font-bold shrink-0" style={{ color: 'var(--bad)' }}>
                        <XCircle size={14} /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded border" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                      <span className="text-[10px] mono block" style={{ color: 'var(--t3)' }}>Your Answer:</span>
                      <span className="font-medium" style={{ color: q.isCorrect ? 'var(--ok)' : 'var(--bad)' }}>
                        {q.studentAnswer || '(No answer provided)'}
                      </span>
                    </div>

                    <div className="p-2 rounded border" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                      <span className="text-[10px] mono block" style={{ color: 'var(--t3)' }}>Correct Answer:</span>
                      <span className="font-semibold" style={{ color: 'var(--ok)' }}>{q.correctAnswer}</span>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="mt-2.5 pt-2 border-t text-[11px] leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--t2)' }}>
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE QUIZ RUNNER */}
      {activeQuiz && !quizResult && (
        <div className="space-y-6 anim-up">
          <div className="card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="mono text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--p-text)' }}>
                DIAGNOSTIC TEST IN PROGRESS
              </span>
              <h2 className="text-xl font-bold mt-0.5" style={{ color: 'var(--t1)' }}>{activeQuiz.topicName}</h2>
              <span className="text-xs mono" style={{ color: 'var(--t3)' }}>
                {activeQuiz.subjectName} • Difficulty: {activeQuiz.difficulty}/5
              </span>
            </div>

            <span className="tag tag-p mono text-xs font-bold px-3 py-1.5">
              {activeQuiz.questions.length} Questions
            </span>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {activeQuiz.questions.map((q, qIdx) => (
              <div key={qIdx} className="card p-6 rounded-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold mono shrink-0"
                    style={{ background: 'var(--p-dim)', color: 'var(--p-text)' }}>
                    {qIdx + 1}
                  </span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>{q.questionText}</p>
                </div>

                {/* Options */}
                <div className="space-y-2 pl-9">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAnswers[qIdx] === opt;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleAnswerSelect(qIdx, opt)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'font-semibold'
                            : 'hover:border-[var(--p-mid)]'
                        }`}
                        style={{
                          background: isSelected ? 'var(--p-dim)' : 'var(--bg-3)',
                          borderColor: isSelected ? 'var(--p)' : 'var(--line)',
                          color: isSelected ? 'var(--p-text)' : 'var(--t2)'
                        }}
                      >
                        <span>{opt}</span>
                        {isSelected && <CheckCircle2 size={16} style={{ color: 'var(--p)' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="card p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs mono" style={{ color: 'var(--t3)' }}>
              Answered: <strong style={{ color: 'var(--p-text)' }}>{Object.keys(userAnswers).length}</strong> of{' '}
              <strong style={{ color: 'var(--t1)' }}>{activeQuiz.questions.length}</strong>
            </span>

            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="btn btn-primary text-xs font-bold gap-2 px-6 py-2.5 disabled:opacity-40"
            >
              <span>{submitting ? 'Analyzing Responses...' : 'Submit Answers'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
