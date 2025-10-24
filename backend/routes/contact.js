// routes/contact.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// URL: POST /api/contact/submit
router.post('/submit', contactController.submitMessage);

module.exports = router;