const mongoose = require('mongoose');

const RevisionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  topicName: { type: String, required: true },
  subjectName: { type: String, required: true },
  dueDate: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['due', 'upcoming', 'completed', 'overdue'], default: 'due' },
  previousScore: { type: Number, default: 70 },
  currentPriority: { type: Number, default: 75 },
  recommendedDurationMinutes: { type: Number, default: 30 },
  confidenceFeedback: { type: String, enum: ['low', 'medium', 'high', null], default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.Revision || mongoose.model('Revision', RevisionSchema);
