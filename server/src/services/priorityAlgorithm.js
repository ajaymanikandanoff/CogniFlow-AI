/**
 * Priority Algorithm & Weakness Score Engine
 * Deterministic calculation as specified:
 * priority = 0.30 * weaknessScore + 0.25 * examUrgency + 0.20 * topicDifficulty + 0.15 * revisionDueScore + 0.10 * historicalMistakeScore
 */

/**
 * Calculates weakness score (0 to 100)
 * Weakness Score = performance weakness + topic difficulty + exam urgency + low revision frequency + repeated mistakes
 */
function calculateWeaknessScore({
  accuracy = 70, // 0 to 100
  topicDifficulty = 3, // 1 to 5
  daysUntilExam = 14,
  daysSinceLastRevision = 0,
  mistakeCount = 0,
  confidenceLevel = 'medium' // 'low', 'medium', 'high'
}) {
  // 1. Performance weakness (lower accuracy => higher weakness)
  const performanceWeakness = Math.max(0, 100 - accuracy); // 0-100

  // 2. Normalized difficulty (1-5 scaled to 0-100)
  const diffScore = ((topicDifficulty - 1) / 4) * 100;

  // 3. Exam Urgency (closer exam => higher urgency factor)
  let examUrgency = 0;
  if (daysUntilExam <= 2) examUrgency = 100;
  else if (daysUntilExam <= 5) examUrgency = 85;
  else if (daysUntilExam <= 10) examUrgency = 70;
  else if (daysUntilExam <= 20) examUrgency = 50;
  else examUrgency = 25;

  // 4. Low revision frequency (longer since revised => higher weakness)
  const revisionLapseScore = Math.min(100, daysSinceLastRevision * 15);

  // 5. Repeated mistakes (more mistakes => higher weakness)
  const mistakeScore = Math.min(100, mistakeCount * 25);

  // 6. Confidence modifier
  let confidencePenalty = 0;
  if (confidenceLevel === 'low') confidencePenalty = 15;
  if (confidenceLevel === 'high') confidencePenalty = -10;

  // Weighted Weakness formula
  const rawWeakness = (
    0.35 * performanceWeakness +
    0.20 * diffScore +
    0.20 * examUrgency +
    0.15 * revisionLapseScore +
    0.10 * mistakeScore +
    confidencePenalty
  );

  return Math.min(100, Math.max(5, Math.round(rawWeakness)));
}

/**
 * Calculates priority score (0 to 100)
 */
function calculatePriority({
  weaknessScore = 50,
  daysUntilExam = 14,
  topicDifficulty = 3, // 1 to 5
  daysSinceLastRevision = 0,
  revisionDue = false,
  mistakeCount = 0
}) {
  // Exam urgency
  let examUrgency = 0;
  if (daysUntilExam <= 1) examUrgency = 100;
  else if (daysUntilExam <= 3) examUrgency = 90;
  else if (daysUntilExam <= 7) examUrgency = 75;
  else if (daysUntilExam <= 14) examUrgency = 60;
  else if (daysUntilExam <= 30) examUrgency = 40;
  else examUrgency = 20;

  // Topic difficulty scaled to 0-100
  const normalizedDifficulty = ((topicDifficulty - 1) / 4) * 100;

  // Revision due score
  let revisionDueScore = 0;
  if (revisionDue) {
    revisionDueScore = Math.min(100, 50 + (daysSinceLastRevision * 10));
  } else {
    revisionDueScore = Math.min(50, daysSinceLastRevision * 5);
  }

  // Historical mistake score
  const historicalMistakeScore = Math.min(100, mistakeCount * 20);

  // Core formula:
  // priority = 0.30 * weaknessScore + 0.25 * examUrgency + 0.20 * topicDifficulty + 0.15 * revisionDueScore + 0.10 * historicalMistakeScore
  const priority = (
    0.30 * weaknessScore +
    0.25 * examUrgency +
    0.20 * normalizedDifficulty +
    0.15 * revisionDueScore +
    0.10 * historicalMistakeScore
  );

  return Math.min(100, Math.max(10, Math.round(priority)));
}

/**
 * Classifies topic into Strong, Moderate, Weak
 */
function classifyTopic(weaknessScore, accuracy) {
  if (weaknessScore >= 65 || accuracy < 55) {
    return 'Weak';
  } else if (weaknessScore >= 40 || accuracy < 75) {
    return 'Moderate';
  } else {
    return 'Strong';
  }
}

module.exports = {
  calculateWeaknessScore,
  calculatePriority,
  classifyTopic
};
