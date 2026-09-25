const express = require('express');
const router = express.Router();
const revisionController = require('../controllers/revisionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', revisionController.getRevisions);
router.post('/:id/complete', revisionController.completeRevision);

module.exports = router;
