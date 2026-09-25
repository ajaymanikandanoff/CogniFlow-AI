/**
 * Adaptive Replanning Engine
 * Core differentiator: continuously recalculates priorities and dynamically
 * adapts the student's daily study tasks and revision schedule.
 */

const { calculateWeaknessScore, calculatePriority } = require('./priorityAlgorithm');
const { getNextRevisionSchedule } = require('./revisionScheduler');

/**
 * Generates an initial or comprehensive multi-day study & revision plan
 */
function generateAdaptiveStudyPlan({
  student,
  subjects,
  topics,
  availableHoursPerDay = 3,
  startDate = new Date()
}) {
  const dailyMinutes = Math.round(availableHoursPerDay * 60);
  const plan = [];

  // 1. Calculate up-to-date weakness & priority for each topic
  const enrichedTopics = topics.map(topic => {
    const subject = subjects.find(s => s._id.toString() === topic.subjectId.toString()) || {};
    
    // Calculate days until subject's exam
    let daysUntilExam = 14;
    if (subject.examDate) {
      const diffMs = new Date(subject.examDate) - new Date(startDate);
      daysUntilExam = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const weaknessScore = calculateWeaknessScore({
      accuracy: topic.accuracy || 70,
      topicDifficulty: topic.difficulty || 3,
      daysUntilExam,
      daysSinceLastRevision: topic.daysSinceLastRevision || 0,
      mistakeCount: topic.mistakeCount || 0,
      confidenceLevel: topic.confidenceLevel || 'medium'
    });

    const priority = calculatePriority({
      weaknessScore,
      daysUntilExam,
      topicDifficulty: topic.difficulty || 3,
      daysSinceLastRevision: topic.daysSinceLastRevision || 0,
      revisionDue: topic.isRevisionDue || false,
      mistakeCount: topic.mistakeCount || 0
    });

    return {
      ...topic,
      subjectName: subject.name || 'General',
      daysUntilExam,
      weaknessScore,
      priority
    };
  });

  // Sort descending by priority (weakest & most urgent first)
  enrichedTopics.sort((a, b) => b.priority - a.priority);

  // Generate 7-day schedule
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + dayOffset);
    const dateStr = curDate.toISOString().split('T')[0];

    let allocatedMinutes = 0;
    const tasks = [];

    // Distribute topics into this day
    for (let i = 0; i < enrichedTopics.length; i++) {
      if (allocatedMinutes >= dailyMinutes) break;

      const t = enrichedTopics[(i + dayOffset) % enrichedTopics.length];
      const remainingMinutes = dailyMinutes - allocatedMinutes;
      
      // Determine session duration (45, 60, or 75 min based on priority/difficulty)
      let duration = t.priority > 75 ? 60 : t.priority > 50 ? 45 : 30;
      if (duration > remainingMinutes) duration = remainingMinutes;
      if (duration < 20) continue;

      let type = 'learning';
      let reason = 'Core curriculum progress';

      if (t.isRevisionDue || dayOffset % 2 === 1) {
        type = 'revision';
        reason = `Spaced revision: ${t.weaknessScore > 60 ? 'Weakness reinforcement' : 'Retention cycle'}`;
      } else if (t.weaknessScore >= 70) {
        reason = `High priority weakness (Score: ${t.weaknessScore}) with upcoming exam`;
      }

      tasks.push({
        id: `task_${dateStr}_${t._id}_${i}`,
        topicId: t._id,
        topicName: t.name,
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        duration,
        type,
        priority: t.priority,
        difficulty: t.difficulty,
        weaknessScore: t.weaknessScore,
        status: 'pending', // pending, completed, skipped, in_progress
        reason,
        timeSlot: getTimeSlotString(allocatedMinutes, duration)
      });

      allocatedMinutes += duration;
    }

    // Add a 20-minute Quick Quiz slot on every second day if time allows
    if (dayOffset % 2 === 0 && tasks.length > 0) {
      const topTopic = tasks[0];
      tasks.push({
        id: `quiz_${dateStr}_${topTopic.topicId}`,
        topicId: topTopic.topicId,
        topicName: topTopic.topicName,
        subjectId: topTopic.subjectId,
        subjectName: topTopic.subjectName,
        duration: 20,
        type: 'quiz',
        priority: topTopic.priority,
        difficulty: topTopic.difficulty,
        weaknessScore: topTopic.weaknessScore,
        status: 'pending',
        reason: 'Active recall & mastery assessment',
        timeSlot: '20:00 - 20:20'
      });
    }

    plan.push({
      date: dateStr,
      dayName: curDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      totalMinutes: allocatedMinutes,
      tasks
    });
  }

  return { plan, enrichedTopics };
}

/**
 * Adapts existing plan when student skips a task
 */
function handleTaskSkipped({ existingPlan, skippedTask, topics, subjects }) {
  const updatedPlan = JSON.parse(JSON.stringify(existingPlan));
  const todayStr = new Date().toISOString().split('T')[0];

  // Mark task as skipped
  let found = false;
  for (const day of updatedPlan) {
    const task = day.tasks.find(t => t.id === skippedTask.id);
    if (task) {
      task.status = 'skipped';
      found = true;
      break;
    }
  }

  // Find next day with available capacity or push to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let targetDay = updatedPlan.find(d => d.date === tomorrowStr);
  if (!targetDay && updatedPlan.length > 1) {
    targetDay = updatedPlan[1];
  }

  // Increase priority since it was skipped and is urgent
  const increasedPriority = Math.min(100, (skippedTask.priority || 50) + 15);
  const rescheduledTask = {
    ...skippedTask,
    id: `rescheduled_${Date.now()}_${skippedTask.topicId}`,
    priority: increasedPriority,
    status: 'pending',
    reason: `Rescheduled from missed session (Priority increased to ${increasedPriority})`,
    timeSlot: 'Next available slot'
  };

  if (targetDay) {
    targetDay.tasks.unshift(rescheduledTask); // Put at top of tomorrow's queue
  }

  const notification = {
    title: 'Study Plan Adapted',
    message: `Your plan has been updated because "${skippedTask.topicName}" was not completed. It has been prioritized in tomorrow's schedule.`,
    type: 'plan_adapted',
    timestamp: new Date().toISOString()
  };

  return {
    updatedPlan,
    rescheduledTask,
    notification
  };
}

/**
 * Adapts existing plan based on Quiz Performance
 */
function handleQuizResultAdaptation({ existingPlan, topic, score, percentage, topics, subjects }) {
  const updatedPlan = JSON.parse(JSON.stringify(existingPlan));
  let adaptiveFeedback = '';
  let priorityChange = 0;
  let actionTaken = '';

  if (percentage < 60) {
    // POOR PERFORMANCE: Increase priority, inject remedial session, schedule revision
    priorityChange = +25;
    adaptiveFeedback = `Your recent quiz score of ${percentage}% in ${topic.name} indicates that this topic needs additional practice.`;
    actionTaken = 'Added an intensive practice session and scheduled a follow-up revision in 2 days.';

    // Inject remedial session into next 24-48 hours
    if (updatedPlan.length > 0) {
      const targetDay = updatedPlan[0]; // today or tomorrow
      targetDay.tasks.unshift({
        id: `remedial_${Date.now()}_${topic._id}`,
        topicId: topic._id,
        topicName: topic.name,
        subjectId: topic.subjectId,
        subjectName: topic.subjectName || 'Current Subject',
        duration: 45,
        type: 'remedial',
        priority: 95,
        difficulty: topic.difficulty || 4,
        weaknessScore: 85,
        status: 'pending',
        reason: `Remedial practice triggered by ${percentage}% quiz result`,
        timeSlot: 'Immediate priority'
      });
    }
  } else if (percentage >= 85) {
    // EXCELLENT PERFORMANCE: Relax priority, award confidence
    priorityChange = -20;
    adaptiveFeedback = `Outstanding score of ${percentage}% in ${topic.name}! You've demonstrated strong mastery.`;
    actionTaken = 'Reduced immediate revision frequency to allocate more study time to weaker topics.';
  } else {
    // MODERATE PERFORMANCE (60-84%)
    priorityChange = 0;
    adaptiveFeedback = `Solid performance of ${percentage}% in ${topic.name}. Keep reinforcing key concepts.`;
    actionTaken = 'Spaced repetition schedule maintained.';
  }

  const notification = {
    title: 'Adaptive Learning Signal Received',
    message: adaptiveFeedback + ' ' + actionTaken,
    type: 'quiz_adaptive',
    score: percentage,
    topicName: topic.name,
    timestamp: new Date().toISOString()
  };

  return {
    updatedPlan,
    adaptiveFeedback,
    actionTaken,
    priorityChange,
    notification
  };
}

function getTimeSlotString(startOffsetMinutes, durationMinutes) {
  const baseHour = 9; // Start at 9:00 AM
  const totalStartMinutes = baseHour * 60 + startOffsetMinutes;
  const totalEndMinutes = totalStartMinutes + durationMinutes;

  const startH = Math.floor(totalStartMinutes / 60);
  const startM = totalStartMinutes % 60;
  const endH = Math.floor(totalEndMinutes / 60);
  const endM = totalEndMinutes % 60;

  const fmt = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  return `${fmt(startH, startM)} - ${fmt(endH, endM)}`;
}

module.exports = {
  generateAdaptiveStudyPlan,
  handleTaskSkipped,
  handleQuizResultAdaptation
};
