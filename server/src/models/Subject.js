const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  code: { type: String, default: '' },
  examDate: { type: Date, required: true },
  targetScore: { type: Number, default: 85 },
  currentPerformance: { type: Number, default: 60 },
  syllabusText: { type: String, default: '' },
  unitsCount: { type: Number, default: 0 },
  topicsCount: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
