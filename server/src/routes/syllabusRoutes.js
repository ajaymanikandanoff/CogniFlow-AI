const express = require('express');
const router = express.Router();
const multer = require('multer');
const syllabusController = require('../controllers/syllabusController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authMiddleware);

router.post('/upload', upload.single('file'), syllabusController.uploadSyllabus);
router.post('/save', syllabusController.saveParsedSyllabus);

module.exports = router;
