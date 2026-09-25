const express = require('express');
const router = express.Router();
const academicMarksController = require('../controllers/academicMarksController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/data', academicMarksController.getAcademicData);
router.post('/profile', academicMarksController.saveAcademicProfile);
router.post('/record', academicMarksController.addPreviousMark);
router.delete('/record/:id', academicMarksController.deletePreviousMark);
router.post('/analyze', academicMarksController.analyzeAcademicAndMarks);

module.exports = router;
