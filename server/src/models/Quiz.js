const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'short'], default: 'mcq' },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  concept: { type: String, default: '' }
});

const QuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  topicName: { type: String, required: true },
  subjectName: { type: String, default: 'General' },
  difficulty: { type: Number, default: 3 },
  questions: [QuestionSchema],
  lastAttempt: {
    score: { type: Number },
    total: { type: Number },
    percentage: { type: Number },
    submittedAnswers: [mongoose.Schema.Types.Mixed],
    completedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
