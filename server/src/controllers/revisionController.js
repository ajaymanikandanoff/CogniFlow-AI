const store = require('../data/store');
const { handleRevisionCompletion } = require('../services/revisionScheduler');
const { calculatePriority, calculateWeaknessScore } = require('../services/priorityAlgorithm');

exports.getRevisions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const revisions = store.find('revisions', { userId });
    const todayStr = new Date().toISOString().split('T')[0];

    const dueToday = revisions.filter(r => r.status === 'due' || (r.dueDate === todayStr && r.status !== 'completed'));
    const overdue = revisions.filter(r => r.dueDate < todayStr && r.status !== 'completed');
    const upcoming = revisions.filter(r => r.dueDate > todayStr && r.status !== 'completed');
    const completed = revisions.filter(r => r.status === 'completed');

    res.json({
      success: true,
      dueToday,
      overdue,
      upcoming,
      completed,
      all: revisions
    });
  } catch (error) {
    next(error);
  }
};

exports.completeRevision = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { confidenceLevel, notes } = req.body; // 'low', 'medium', 'high'

    const revision = store.findById('revisions', id);
    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision item not found' });
    }

    const topic = store.findById('topics', revision.topicId) || {
      _id: revision.topicId,
      name: revision.topicName,
      difficulty: 3,
      weaknessScore: revision.currentPriority || 50
    };

    // Calculate dynamic spaced repetition adjustment based on confidence
    const adjustment = handleRevisionCompletion({
      topic,
      confidence: confidenceLevel || 'medium',
      currentIntervalIndex: topic.revisionIntervalIndex || 0
    });

    // Update topic with new revision index and weakness adjustment
    const newWeakness = Math.max(10, Math.min(95, (topic.weaknessScore || 50) + adjustment.priorityAdjustment));
    store.update('topics', { _id: topic._id }, {
      weaknessScore: newWeakness,
      confidenceLevel: confidenceLevel || 'medium',
      revisionIntervalIndex: adjustment.newIntervalIndex,
      lastStudiedAt: new Date().toISOString(),
      isRevisionDue: false
    });

    // Mark current revision completed
    store.update('revisions', { _id: id }, {
      status: 'completed',
      confidenceFeedback: confidenceLevel,
      completedAt: new Date().toISOString()
    });

    // Insert next scheduled revision
    const nextRev = store.insert('revisions', {
      userId,
      topicId: topic._id,
      topicName: topic.name,
      subjectName: revision.subjectName,
      dueDate: adjustment.nextRevisionDate,
      status: 'upcoming',
      previousScore: confidenceLevel === 'high' ? 90 : confidenceLevel === 'medium' ? 75 : 50,
      currentPriority: Math.round(newWeakness * 0.9),
      recommendedDurationMinutes: adjustment.recommendedDurationMinutes
    });

    // Notification
    store.insert('notifications', {
      userId,
      title: 'Revision Signal Recorded',
      message: adjustment.statusMessage,
      type: 'achievement'
    });

    res.json({
      success: true,
      message: adjustment.statusMessage,
      adjustment,
      nextRevision: nextRev
    });
  } catch (error) {
    next(error);
  }
};
