const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/generate', quizController.generateQuiz);
router.post('/:quizId/submit', quizController.submitQuiz);
router.get('/attempts', quizController.getRecentAttempts);

module.exports = router;
