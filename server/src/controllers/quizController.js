const store = require('../data/store');
const { generateQuizWithAI } = require('../services/aiService');
const { handleQuizResultAdaptation } = require('../services/adaptivePlanner');
const { calculateWeaknessScore, calculatePriority } = require('../services/priorityAlgorithm');

exports.generateQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { topicId, difficulty, questionCount } = req.body;

    let topic = null;
    if (topicId) {
      topic = store.findById('topics', topicId);
    }

    const topicName = topic ? topic.name : (req.body.topicName || 'Normalization');
    const subjectName = topic ? (topic.subjectName || 'General') : (req.body.subjectName || 'DBMS');
    const diff = difficulty ? parseInt(difficulty) : (topic ? topic.difficulty : 3);

    const quizData = await generateQuizWithAI(topicName, subjectName, diff, questionCount || 5);

    const savedQuiz = store.insert('quizzes', {
      userId,
      topicId: topic ? topic._id : 'custom',
      topicName,
      subjectName,
      difficulty: diff,
      questions: quizData.questions
    });

    res.json({
      success: true,
      quiz: savedQuiz
    });
  } catch (error) {
    next(error);
  }
};

exports.submitQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { quizId } = req.params;
    const { answers } = req.body; // map of questionIndex -> studentAnswer string

    const quiz = store.findById('quizzes', quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    let correctCount = 0;
    const analysis = [];

    quiz.questions.forEach((q, idx) => {
      const studentAns = (answers && answers[idx] !== undefined) ? answers[idx] : null;
      const isCorrect = studentAns && studentAns.toString().trim().toLowerCase() === q.correctAnswer.toString().trim().toLowerCase();

      if (isCorrect) correctCount++;

      analysis.push({
        questionText: q.questionText,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        concept: q.concept
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Save quiz attempt
    const attempt = store.insert('quizAttempts', {
      userId,
      quizId: quiz._id,
      topicId: quiz.topicId,
      topicName: quiz.topicName,
      subjectName: quiz.subjectName,
      score: correctCount,
      total: totalQuestions,
      percentage,
      submittedAnswers: answers,
      analysis,
      completedAt: new Date().toISOString()
    });

    // Record in Performance table
    store.insert('performances', {
      userId,
      subjectName: quiz.subjectName,
      topicName: quiz.topicName,
      type: 'quiz_score',
      score: percentage,
      accuracy: percentage,
      recordedAt: new Date().toISOString()
    });

    // Fetch topic & trigger Adaptive Replanning
    let topic = store.findById('topics', quiz.topicId);
    if (!topic) {
      topic = {
        _id: quiz.topicId || 'generic',
        name: quiz.topicName,
        subjectId: 'sub_1',
        subjectName: quiz.subjectName,
        difficulty: quiz.difficulty || 3,
        weaknessScore: percentage < 60 ? 85 : 35
      };
    }

    // 1. Recalculate topic metrics
    const newMistakeCount = percentage < 60 ? (topic.mistakeCount || 0) + 1 : Math.max(0, (topic.mistakeCount || 1) - 1);
    const newWeaknessScore = calculateWeaknessScore({
      accuracy: percentage,
      topicDifficulty: topic.difficulty || 3,
      daysUntilExam: 10,
      daysSinceLastRevision: 1,
      mistakeCount: newMistakeCount,
      confidenceLevel: percentage < 60 ? 'low' : percentage >= 85 ? 'high' : 'medium'
    });

    const newPriority = calculatePriority({
      weaknessScore: newWeaknessScore,
      daysUntilExam: 10,
      topicDifficulty: topic.difficulty || 3,
      daysSinceLastRevision: 0,
      revisionDue: percentage < 60,
      mistakeCount: newMistakeCount
    });

    store.update('topics', { _id: topic._id }, {
      accuracy: percentage,
      quizScore: percentage,
      weaknessScore: newWeaknessScore,
      priority: newPriority,
      mistakeCount: newMistakeCount,
      lastStudiedAt: new Date().toISOString()
    });

    // 2. ADAPTIVE REPLANNING TRIGGER
    const studyPlanDoc = store.findOne('studyPlans', { userId });
    let adaptiveReplanningResult = null;

    if (studyPlanDoc && studyPlanDoc.days) {
      const subjects = store.find('subjects', { userId });
      const topics = store.find('topics', { userId });

      adaptiveReplanningResult = handleQuizResultAdaptation({
        existingPlan: studyPlanDoc.days,
        topic: { ...topic, weaknessScore: newWeaknessScore, priority: newPriority },
        score: correctCount,
        percentage,
        topics,
        subjects
      });

      // Update study plan with adaptation
      studyPlanDoc.days = adaptiveReplanningResult.updatedPlan;
      studyPlanDoc.activeAdaptationLog.push({
        timestamp: new Date().toISOString(),
        trigger: `Quiz Result: ${quiz.topicName} (${percentage}%)`,
        changeDescription: `${adaptiveReplanningResult.adaptiveFeedback} -> ${adaptiveReplanningResult.actionTaken}`
      });

      store.update('studyPlans', { _id: studyPlanDoc._id }, {
        days: adaptiveReplanningResult.updatedPlan,
        activeAdaptationLog: studyPlanDoc.activeAdaptationLog
      });

      // Emit high-priority in-app notification
      store.insert('notifications', {
        userId,
        ...adaptiveReplanningResult.notification
      });
    }

    res.json({
      success: true,
      attempt,
      percentage,
      correctCount,
      totalQuestions,
      analysis,
      newWeaknessScore,
      newPriority,
      adaptiveReplanning: adaptiveReplanningResult
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentAttempts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const attempts = store.find('quizAttempts', { userId });
    attempts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    res.json({ success: true, attempts: attempts.slice(0, 10) });
  } catch (error) {
    next(error);
  }
};
