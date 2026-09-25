const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  topicId: { type: String, required: true },
  topicName: { type: String, required: true },
  subjectId: { type: String, required: true },
  subjectName: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  type: { type: String, enum: ['learning', 'revision', 'quiz', 'remedial', 'practice'], default: 'learning' },
  priority: { type: Number, default: 50 },
  difficulty: { type: Number, default: 3 },
  weaknessScore: { type: Number, default: 50 },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
  reason: { type: String, default: '' },
  timeSlot: { type: String, default: '09:00 - 10:00' }
});

const DayPlanSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  dayName: { type: String, required: true },
  totalMinutes: { type: Number, default: 0 },
  tasks: [TaskSchema]
});

const StudyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date, default: Date.now },
  days: [DayPlanSchema],
  activeAdaptationLog: [{
    timestamp: { type: Date, default: Date.now },
    trigger: { type: String },
    changeDescription: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.models.StudyPlan || mongoose.model('StudyPlan', StudyPlanSchema);
