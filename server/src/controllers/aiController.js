const store = require('../data/store');
const { answerChatWithAI } = require('../services/aiService');

exports.chatWithCoach = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // 1. Gather rich student context
    const profile = store.findOne('studentProfiles', { userId }) || { name: req.user.name };
    const academicProfile = store.findOne('academicProfiles', { userId }) || {
      degree: profile.course,
      semester: profile.semester
    };
    const previousMarks = store.find('previousMarks', { userId })
      .map(m => `${m.subjectName} (${m.examType || 'Exam'}): ${m.marksObtained}/${m.maxMarks} (${m.percentage}% - Grade ${m.grade || 'N/A'})${m.weakTopics?.length ? ` [Weak Topics: ${m.weakTopics.join(', ')}]` : ''}`);

    const topics = store.find('topics', { userId });
    const weakTopics = topics.filter(t => (t.weaknessScore || 50) >= 60);

    const studyPlanDoc = store.findOne('studyPlans', { userId });
    let currentPlanToday = [];
    if (studyPlanDoc && studyPlanDoc.days && studyPlanDoc.days.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = studyPlanDoc.days.find(d => d.date === todayStr) || studyPlanDoc.days[0];
      if (today) currentPlanToday = today.tasks;
    }

    // 2. Syllabus grounding: find relevant topics mentioned in message
    const matchedTopics = topics.filter(t => message.toLowerCase().includes(t.name.toLowerCase()));
    let syllabusContext = '';
    if (matchedTopics.length > 0) {
      syllabusContext = matchedTopics.map(t => 
        `Subject: ${t.subjectName}, Unit ${t.unitNumber}: ${t.unitName} - Topic: ${t.name} (Subtopics: ${(t.subtopics || []).join(', ')}; Key Concepts: ${(t.keyConcepts || []).join(', ')})`
      ).join('\n');
    }

    // 3. Generate response using Google Gemini AI
    const result = await answerChatWithAI({
      question: message,
      history: Array.isArray(history) ? history : [],
      studentProfile: profile,
      academicProfile,
      previousMarks,
      syllabusContext,
      weakTopics,
      currentPlanToday
    });

    const replyText = typeof result === 'object' && result.reply ? result.reply : (typeof result === 'object' && result.answer ? result.answer : result);
    const modelUsed = typeof result === 'object' && result.model ? result.model : '3-Cloud AI Consensus';
    const auditData = typeof result === 'object' ? (result.triCloudAudit || result._triEngineAudit) : null;

    res.json({
      success: true,
      reply: replyText,
      answer: replyText,
      model: modelUsed,
      triCloudAudit: auditData,
      groundedIn: matchedTopics.map(t => ({ topic: t.name, subject: t.subjectName }))
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailyRecommendation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const topics = store.find('topics', { userId });
    const weakTopics = topics.filter(t => (t.weaknessScore || 50) >= 60).sort((a, b) => b.weaknessScore - a.weaknessScore);

    let recommendation;
    if (weakTopics.length > 0) {
      const weakest = weakTopics[0];
      recommendation = {
        title: `Targeted Mastery: ${weakest.name}`,
        recommendationText: `Your calculated weakness score in ${weakest.name} is ${weakest.weaknessScore}/100. Due to exam proximity, spend 45 minutes on problem sets today.`,
        targetTopic: weakest.name,
        suggestedAction: 'Take Diagnostic Quiz',
        priorityScore: weakest.priority
      };
    } else {
      recommendation = {
        title: 'Retention Checkpoint',
        recommendationText: 'All primary topics are in good health. Allocate 30 minutes for a mixed revision session.',
        targetTopic: 'Mixed Concepts',
        suggestedAction: 'Review Upcoming Revisions',
        priorityScore: 40
      };
    }

    res.json({ success: true, recommendation });
  } catch (error) {
    next(error);
  }
};

exports.getDualEngineStatus = async (req, res, next) => {
  try {
    const { getTriEngineStatus } = require('../services/aiService');
    const status = getTriEngineStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    next(error);
  }
};

exports.testDualEngineKeys = async (req, res, next) => {
  try {
    const { geminiKey, groqKey, openRouterKey } = req.body || {};
    const { testTriEngineKeys } = require('../services/aiService');
    const results = await testTriEngineKeys({ geminiKey, groqKey, openRouterKey });
    res.json({ success: true, ...results });
  } catch (error) {
    next(error);
  }
};

exports.updateDualEngineKeys = async (req, res, next) => {
  try {
    const { geminiKey, groqKey, openRouterKey } = req.body || {};
    if (geminiKey !== undefined && geminiKey.trim()) {
      process.env.GEMINI_API_KEY = geminiKey.trim();
    }
    if (groqKey !== undefined) {
      process.env.GROQ_API_KEY = groqKey.trim();
    }
    if (openRouterKey !== undefined) {
      process.env.OPENROUTER_API_KEY = openRouterKey.trim();
    }

    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (geminiKey !== undefined && geminiKey.trim()) {
        if (/GEMINI_API_KEY=/.test(envContent)) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${geminiKey.trim()}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${geminiKey.trim()}`;
        }
      }
      if (groqKey !== undefined) {
        if (/GROQ_API_KEY=/.test(envContent)) {
          envContent = envContent.replace(/GROQ_API_KEY=.*/, `GROQ_API_KEY=${groqKey.trim()}`);
        } else {
          envContent += `\nGROQ_API_KEY=${groqKey.trim()}`;
        }
      }
      if (openRouterKey !== undefined) {
        if (/OPENROUTER_API_KEY=/.test(envContent)) {
          envContent = envContent.replace(/OPENROUTER_API_KEY=.*/, `OPENROUTER_API_KEY=${openRouterKey.trim()}`);
        } else {
          envContent += `\nOPENROUTER_API_KEY=${openRouterKey.trim()}`;
        }
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    const { getTriEngineStatus } = require('../services/aiService');
    const status = getTriEngineStatus();

    res.json({
      success: true,
      message: '3-Engine Cloud configuration updated and persisted to .env successfully.',
      ...status
    });
  } catch (error) {
    next(error);
  }
};
