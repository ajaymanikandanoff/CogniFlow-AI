const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  unitNumber: { type: Number, default: 1 },
  unitName: { type: String, default: 'General Unit' },
  name: { type: String, required: true },
  subtopics: [{ type: String }],
  keyConcepts: [{ type: String }],
  difficulty: { type: Number, min: 1, max: 5, default: 3 }, // 1 easy to 5 very hard
  estimatedMinutes: { type: Number, default: 60 },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed', 'Needs Revision'], default: 'Not Started' },
  weaknessScore: { type: Number, min: 0, max: 100, default: 50 },
  priority: { type: Number, min: 0, max: 100, default: 50 },
  accuracy: { type: Number, min: 0, max: 100, default: 65 },
  mistakeCount: { type: Number, default: 0 },
  confidenceLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  lastStudiedAt: { type: Date, default: null },
  nextRevisionDate: { type: String, default: null },
  revisionIntervalIndex: { type: Number, default: 0 },
  isRevisionDue: { type: Boolean, default: false },
  quizScore: { type: Number, default: null }
}, { timestamps: true });

module.exports = mongoose.models.Topic || mongoose.model('Topic', TopicSchema);
