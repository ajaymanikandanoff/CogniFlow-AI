const store = require('../data/store');
const { classifyTopic } = require('../services/priorityAlgorithm');

exports.getProfile = async (req, res, next) => {
  try {
    const profile = store.findOne('studentProfiles', { userId: req.user.id });
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    store.update('studentProfiles', { userId: req.user.id }, updates);
    const updated = store.findOne('studentProfiles', { userId: req.user.id });
    res.json({ success: true, profile: updated });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = store.findOne('studentProfiles', { userId }) || {
      name: req.user.name,
      dailyAvailableHours: 3.5
    };

    // 1. Subjects & Exams
    const subjects = store.find('subjects', { userId });
    subjects.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));

    // Nearest exam
    let nextExamInfo = null;
    const now = new Date();
    for (const sub of subjects) {
      const examD = new Date(sub.examDate);
      const diffDays = Math.ceil((examD - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        nextExamInfo = {
          subjectName: sub.name,
          examDate: sub.examDate,
          daysLeft: diffDays
        };
        break;
      }
    }

    // 2. Topics summary
    const topics = store.find('topics', { userId });
    const totalTopics = topics.length;
    const completedTopics = topics.filter(t => t.status === 'Completed').length;
    const inProgressTopics = topics.filter(t => t.status === 'In Progress').length;
    const remainingTopics = Math.max(0, totalTopics - completedTopics);

    // 3. Weak areas (classified by weakness score)
    const weakTopics = topics
      .filter(t => (t.weaknessScore || 50) >= 60)
      .sort((a, b) => (b.weaknessScore || 0) - (a.weaknessScore || 0))
      .slice(0, 5);

    // 4. Today's Study Plan Tasks
    const studyPlanDoc = store.findOne('studyPlans', { userId });
    const todayStr = new Date().toISOString().split('T')[0];
    let todayTasks = [];
    if (studyPlanDoc && studyPlanDoc.days) {
      const todayDay = studyPlanDoc.days.find(d => d.date === todayStr) || studyPlanDoc.days[0];
      if (todayDay) {
        todayTasks = todayDay.tasks;
      }
    }

    // 5. Revisions Due Today
    const revisions = store.find('revisions', { userId });
    const revisionsDueToday = revisions.filter(r => r.status === 'due' || r.dueDate <= todayStr);

    // 6. Recent Performance & Quiz Metrics
    const performances = store.find('performances', { userId });
    performances.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    
    const quizAttempts = store.find('quizAttempts', { userId });
    let avgQuizScore = 74;
    if (quizAttempts.length > 0) {
      const sum = quizAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      avgQuizScore = Math.round(sum / quizAttempts.length);
    }

    // 7. Active Recommendation
    const recommendations = store.find('recommendations', { userId });
    let activeRecommendation = null;
    if (recommendations.length > 0) {
      activeRecommendation = recommendations[recommendations.length - 1];
    } else if (weakTopics.length > 0) {
      const weakest = weakTopics[0];
      activeRecommendation = {
        title: `Priority Focus: ${weakest.name}`,
        recommendationText: `Your current weakness score in ${weakest.name} is ${weakest.weaknessScore}/100. Based on your upcoming exam, dedicating 45 minutes of active recall today will yield significant retention improvement.`,
        targetTopic: weakest.name,
        suggestedAction: 'Start Diagnostic Quiz'
      };
    } else {
      activeRecommendation = {
        title: 'Maintain Spaced Revision Rhythm',
        recommendationText: 'Great consistency! Your topic mastery is well-distributed. Spend 30 minutes reinforcing core definitions today.',
        targetTopic: 'General Review',
        suggestedAction: 'Review Study Plan'
      };
    }

    // 8. In-app Notifications
    let notifications = store.find('notifications', { userId });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Auto-generate schedule reminder notification if none exists for today
    const todayDateStr = new Date().toISOString().split('T')[0];
    const hasTodayScheduleNotif = notifications.some(n => 
      n.type === 'schedule_reminder' && n.createdAt && n.createdAt.startsWith(todayDateStr)
    );

    if (!hasTodayScheduleNotif && todayTasks.length > 0) {
      const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
      if (pendingTasks.length > 0) {
        const firstTask = pendingTasks[0];
        const newNotif = store.insert('notifications', {
          userId,
          title: `⏰ Study Schedule: ${pendingTasks.length} Task${pendingTasks.length > 1 ? 's' : ''} Due Today`,
          message: `Your timetable has scheduled "${firstTask.topicName}" (${firstTask.subjectName}) for ${firstTask.duration || 45} mins. High focus boosts exam retention!`,
          type: 'schedule_reminder',
          isRead: false,
          createdAt: new Date().toISOString()
        });
        notifications.unshift(newNotif);
      }
    }

    // Auto-generate revision reminder notification
    const hasRevisionNotif = notifications.some(n => 
      n.type === 'revision_alert' && n.createdAt && n.createdAt.startsWith(todayDateStr)
    );
    if (!hasRevisionNotif && revisionsDueToday.length > 0) {
      const revNotif = store.insert('notifications', {
        userId,
        title: `🔄 Spaced Recall Due: ${revisionsDueToday.length} Topic${revisionsDueToday.length > 1 ? 's' : ''}`,
        message: `High-yield retention alert: Quick 15-minute spaced review for "${revisionsDueToday[0].topicName}" is scheduled for today.`,
        type: 'revision_alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      notifications.unshift(revNotif);
    }

    res.json({
      success: true,
      profile,
      kpis: {
        nextExam: nextExamInfo,
        studyHoursCompleted: 14.5,
        topicsCompleted: completedTopics,
        topicsRemaining: remainingTopics,
        totalTopics,
        currentStreak: 4,
        avgQuizScore
      },
      todayPlan: todayTasks,
      upcomingExams: subjects.map(s => ({
        id: s._id,
        name: s.name,
        examDate: s.examDate,
        daysLeft: Math.max(0, Math.ceil((new Date(s.examDate) - now) / (1000 * 60 * 60 * 24))),
        completion: s.completionPercentage || 0,
        targetScore: s.targetScore || 85
      })),
      weakAreas: weakTopics.map(t => ({
        id: t._id,
        name: t.name,
        subjectName: t.subjectName || 'General',
        weaknessScore: t.weaknessScore || 70,
        difficulty: t.difficulty || 3,
        accuracy: t.accuracy || 55,
        status: classifyTopic(t.weaknessScore, t.accuracy)
      })),
      revisionsDue: revisionsDueToday,
      recentPerformance: performances.slice(0, 5),
      aiRecommendation: activeRecommendation,
      notifications: notifications.slice(0, 8)
    });
  } catch (error) {
    next(error);
  }
};

exports.createScheduleNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, message, taskName, subjectName } = req.body;

    const notif = store.insert('notifications', {
      userId,
      title: title || `⏰ Study Reminder: ${taskName || 'Scheduled Session'}`,
      message: message || `Time to focus on ${taskName || 'your topic'} (${subjectName || 'Current Subject'}).`,
      type: 'schedule_reminder',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      notification: notif
    });
  } catch (error) {
    next(error);
  }
};

exports.clearNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    store.delete('notifications', { userId });
    res.json({
      success: true,
      message: 'All notifications cleared.'
    });
  } catch (error) {
    next(error);
  }
};
