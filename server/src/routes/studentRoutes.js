const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/dashboard', studentController.getDashboardSummary);
router.post('/schedule-notification', studentController.createScheduleNotification);
router.post('/notifications/clear', studentController.clearNotifications);

module.exports = router;
