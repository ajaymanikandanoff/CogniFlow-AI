const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', plannerController.generatePlan);
router.get('/today', plannerController.getTodayPlan);
router.get('/upcoming', plannerController.getUpcomingPlan);
router.post('/tasks/:taskId/complete', plannerController.completeTask);
router.post('/tasks/:taskId/skip', plannerController.skipTask);

module.exports = router;
