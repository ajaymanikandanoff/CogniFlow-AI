const store = require('../data/store');
const { generateAdaptiveStudyPlan, handleTaskSkipped } = require('../services/adaptivePlanner');
const { getNextRevisionSchedule } = require('../services/revisionScheduler');

exports.generatePlanForUser = async function(userId) {
  const profile = store.findOne('studentProfiles', { userId }) || { dailyAvailableHours: 3.5 };
  const subjects = store.find('subjects', { userId });
  const topics = store.find('topics', { userId });

  if (topics.length === 0) {
    store.delete('studyPlans', { userId });
    return null;
  }

  const { plan, enrichedTopics } = generateAdaptiveStudyPlan({
    student: profile,
    subjects,
    topics,
    availableHoursPerDay: profile.dailyAvailableHours || 3.5
  });

  enrichedTopics.forEach(et => {
    store.update('topics', { _id: et._id }, {
      weaknessScore: et.weaknessScore,
      priority: et.priority
    });
  });

  store.delete('studyPlans', { userId });
  return store.insert('studyPlans', {
    userId,
    generatedAt: new Date().toISOString(),
    days: plan,
    activeAdaptationLog: [{
      timestamp: new Date().toISOString(),
      trigger: 'Adaptive Schedule Update',
      changeDescription: `Generated adaptive ${plan.length}-day schedule balancing ${topics.length} topics.`
    }]
  });
};

exports.generatePlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = store.findOne('studentProfiles', { userId }) || { dailyAvailableHours: 3.5 };
    const subjects = store.find('subjects', { userId });
    const topics = store.find('topics', { userId });

    if (topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No topics found. Please add subjects and upload or configure syllabus topics first.'
      });
    }

    const { plan, enrichedTopics } = generateAdaptiveStudyPlan({
      student: profile,
      subjects,
      topics,
      availableHoursPerDay: profile.dailyAvailableHours || 3.5
    });

    // Update topics with recalculated priorities & weakness
    enrichedTopics.forEach(et => {
      store.update('topics', { _id: et._id }, {
        weaknessScore: et.weaknessScore,
        priority: et.priority
      });
    });

    // Save or update active study plan
    store.delete('studyPlans', { userId });
    const savedPlan = store.insert('studyPlans', {
      userId,
      generatedAt: new Date().toISOString(),
      days: plan,
      activeAdaptationLog: [{
        timestamp: new Date().toISOString(),
        trigger: 'Initial AI Generation',
        changeDescription: `Generated adaptive ${plan.length}-day schedule balancing ${topics.length} topics.`
      }]
    });

    // Seed revisions if none exist
    const existingRevisions = store.find('revisions', { userId });
    if (existingRevisions.length === 0) {
      const weakTopics = enrichedTopics.filter(t => t.weaknessScore >= 60).slice(0, 3);
      weakTopics.forEach((wt, idx) => {
        const revSchedule = getNextRevisionSchedule({
          difficulty: wt.difficulty || 3,
          weaknessScore: wt.weaknessScore,
          currentIntervalIndex: 0
        });

        store.insert('revisions', {
          userId,
          topicId: wt._id,
          topicName: wt.name,
          subjectName: wt.subjectName,
          dueDate: idx === 0 ? new Date().toISOString().split('T')[0] : revSchedule.nextRevisionDate,
          status: idx === 0 ? 'due' : 'upcoming',
          previousScore: wt.accuracy || 65,
          currentPriority: wt.priority,
          recommendedDurationMinutes: revSchedule.recommendedDurationMinutes
        });
      });
    }

    res.json({
      success: true,
      message: 'Adaptive personalized study plan generated successfully.',
      plan: savedPlan
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodayPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const studyPlanDoc = store.findOne('studyPlans', { userId });
    if (!studyPlanDoc || !studyPlanDoc.days || studyPlanDoc.days.length === 0) {
      return res.json({ success: true, today: null, tasks: [] });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayPlan = studyPlanDoc.days.find(d => d.date === todayStr) || studyPlanDoc.days[0];

    res.json({
      success: true,
      day: todayPlan,
      tasks: todayPlan.tasks || []
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const studyPlanDoc = store.findOne('studyPlans', { userId });
    res.json({
      success: true,
      plan: studyPlanDoc || { days: [] }
    });
  } catch (error) {
    next(error);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const studyPlanDoc = store.findOne('studyPlans', { userId });

    if (!studyPlanDoc) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    let completedTask = null;
    studyPlanDoc.days.forEach(day => {
      day.tasks.forEach(t => {
        if (t.id === taskId) {
          t.status = 'completed';
          completedTask = t;
        }
      });
    });

    if (completedTask) {
      // Update topic status
      store.update('topics', { _id: completedTask.topicId }, {
        status: 'Completed',
        lastStudiedAt: new Date().toISOString()
      });

      // Schedule next revision
      const revSchedule = getNextRevisionSchedule({
        difficulty: completedTask.difficulty,
        weaknessScore: completedTask.weaknessScore,
        currentIntervalIndex: 0
      });

      store.insert('revisions', {
        userId,
        topicId: completedTask.topicId,
        topicName: completedTask.topicName,
        subjectName: completedTask.subjectName,
        dueDate: revSchedule.nextRevisionDate,
        status: 'upcoming',
        previousScore: 80,
        currentPriority: Math.max(20, completedTask.priority - 10),
        recommendedDurationMinutes: revSchedule.recommendedDurationMinutes
      });

      store.insert('notifications', {
        userId,
        title: 'Study Session Completed',
        message: `Awesome job! "${completedTask.topicName}" marked completed. Spaced revision scheduled for ${revSchedule.nextRevisionDate}.`,
        type: 'achievement'
      });
    }

    store.update('studyPlans', { _id: studyPlanDoc._id }, { days: studyPlanDoc.days });

    res.json({
      success: true,
      message: 'Task completed successfully',
      task: completedTask
    });
  } catch (error) {
    next(error);
  }
};

exports.skipTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const studyPlanDoc = store.findOne('studyPlans', { userId });

    if (!studyPlanDoc) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    let targetTask = null;
    for (const d of studyPlanDoc.days) {
      const found = d.tasks.find(t => t.id === taskId);
      if (found) {
        targetTask = found;
        break;
      }
    }

    if (!targetTask) {
      return res.status(404).json({ success: false, message: 'Task not found in plan' });
    }

    const topics = store.find('topics', { userId });
    const subjects = store.find('subjects', { userId });

    // Trigger Adaptive Replanning
    const { updatedPlan, rescheduledTask, notification } = handleTaskSkipped({
      existingPlan: studyPlanDoc.days,
      skippedTask: targetTask,
      topics,
      subjects
    });

    studyPlanDoc.days = updatedPlan;
    studyPlanDoc.activeAdaptationLog.push({
      timestamp: new Date().toISOString(),
      trigger: `Task Skipped: ${targetTask.topicName}`,
      changeDescription: notification.message
    });

    store.update('studyPlans', { _id: studyPlanDoc._id }, {
      days: updatedPlan,
      activeAdaptationLog: studyPlanDoc.activeAdaptationLog
    });

    store.insert('notifications', {
      userId,
      ...notification
    });

    res.json({
      success: true,
      message: notification.message,
      rescheduledTask,
      plan: studyPlanDoc
    });
  } catch (error) {
    next(error);
  }
};
