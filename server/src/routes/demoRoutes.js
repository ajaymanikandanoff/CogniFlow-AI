const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

router.post('/load', demoController.loadDemoData);

module.exports = router;
