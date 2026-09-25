const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/summary', performanceController.getPerformanceSummary);
router.post('/record', performanceController.addPerformanceRecord);

module.exports = router;
