const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['revision_due', 'exam_alert', 'study_reminder', 'plan_adapted', 'quiz_adaptive', 'achievement'],
    default: 'study_reminder'
  },
  read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
