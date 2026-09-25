const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  course: { type: String, default: 'Computer Science & Engineering' },
  semester: { type: String, default: '6th Semester' },
  dailyAvailableHours: { type: Number, default: 3.5 },
  preferredStudyTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], default: 'morning' },
  learningPreferences: {
    focusSessionDuration: { type: Number, default: 45 },
    breakDuration: { type: Number, default: 10 },
    learningStyle: { type: String, default: 'visual_and_practice' },
    adaptiveFrequency: { type: String, default: 'high' }
  },
  onboardingCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
