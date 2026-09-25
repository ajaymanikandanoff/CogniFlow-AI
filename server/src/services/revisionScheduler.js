/**
 * Smart Revision Scheduler
 * Implements adaptive spaced repetition based on topic difficulty and retention.
 */

const INTERVALS = {
  easy: [3, 7, 14, 30],
  moderate: [2, 5, 10, 21],
  weak: [1, 2, 4, 7, 12, 20]
};

/**
 * Computes next revision date and schedule timeline
 */
function getNextRevisionSchedule({
  difficulty = 3,
  weaknessScore = 50,
  confidenceLevel = 'medium',
  lastScore = 70,
  currentIntervalIndex = 0,
  baseDate = new Date()
}) {
  let profile = 'moderate';
  if (weaknessScore >= 65 || difficulty >= 4 || lastScore < 60 || confidenceLevel === 'low') {
    profile = 'weak';
  } else if (weaknessScore < 40 && difficulty <= 2 && lastScore >= 80 && confidenceLevel === 'high') {
    profile = 'easy';
  }

  const intervalList = INTERVALS[profile];
  const safeIndex = Math.min(currentIntervalIndex, intervalList.length - 1);
  const daysToAdd = intervalList[safeIndex];

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return {
    profile,
    intervalDays: daysToAdd,
    nextRevisionDate: nextDate.toISOString().split('T')[0],
    nextIntervalIndex: safeIndex + 1,
    recommendedDurationMinutes: profile === 'weak' ? 45 : profile === 'moderate' ? 30 : 20
  };
}

/**
 * Adjusts revision priority based on revision performance & confidence rating
 */
function handleRevisionCompletion({
  topic,
  confidence, // 'low', 'medium', 'high'
  score = null,
  currentIntervalIndex = 0
}) {
  let newIntervalIndex = currentIntervalIndex;
  let priorityAdjustment = 0;
  let statusMessage = '';

  if (confidence === 'low' || (score !== null && score < 60)) {
    // Student struggled: reset interval or step back, increase priority
    newIntervalIndex = Math.max(0, currentIntervalIndex - 1);
    priorityAdjustment = +20;
    statusMessage = `Low confidence in ${topic.name}. Priority increased and revision scheduled earlier.`;
  } else if (confidence === 'high' && (score === null || score >= 80)) {
    // Great retention: step forward, reduce immediate frequency
    newIntervalIndex = currentIntervalIndex + 1;
    priorityAdjustment = -15;
    statusMessage = `Great grasp of ${topic.name}! Spaced revision moved to a wider interval.`;
  } else {
    // Moderate
    newIntervalIndex = currentIntervalIndex + 1;
    priorityAdjustment = 0;
    statusMessage = `Revision completed for ${topic.name}. Next checkpoint scheduled.`;
  }

  const nextSchedule = getNextRevisionSchedule({
    difficulty: topic.difficulty,
    weaknessScore: Math.max(10, Math.min(95, (topic.weaknessScore || 50) + priorityAdjustment)),
    confidenceLevel: confidence,
    lastScore: score,
    currentIntervalIndex: newIntervalIndex,
    baseDate: new Date()
  });

  return {
    newIntervalIndex,
    priorityAdjustment,
    statusMessage,
    ...nextSchedule
  };
}

module.exports = {
  getNextRevisionSchedule,
  handleRevisionCompletion
};
