const mongoose = require('mongoose');

const AIRecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  recommendationText: { type: String, required: true },
  targetTopic: { type: String },
  targetSubject: { type: String },
  suggestedAction: { type: String },
  recommendedDurationMinutes: { type: Number, default: 45 },
  metricsGrounding: {
    weakestTopicScore: Number,
    recentAccuracy: Number,
    examUrgencyDays: Number
  },
  applied: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.AIRecommendation || mongoose.model('AIRecommendation', AIRecommendationSchema);
