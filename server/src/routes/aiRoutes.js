const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/chat', aiController.chatWithCoach);
router.get('/recommendation', aiController.getDailyRecommendation);
router.get('/dual-engine-status', aiController.getDualEngineStatus);
router.post('/test-keys', aiController.testDualEngineKeys);
router.post('/update-keys', aiController.updateDualEngineKeys);

module.exports = router;
