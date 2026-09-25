const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  subjectName: { type: String, required: true },
  topicName: { type: String },
  type: { type: String, enum: ['exam_marks', 'quiz_score', 'mock_test', 'study_session'], default: 'quiz_score' },
  score: { type: Number, required: true }, // 0 to 100
  accuracy: { type: Number },
  timeSpentMinutes: { type: Number, default: 45 },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Performance || mongoose.model('Performance', PerformanceSchema);
