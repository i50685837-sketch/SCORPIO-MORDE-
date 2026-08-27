const express = require('express');
const router = express.Router();
const { initiateStkPush, handleIntaSendWebhook, getUserTransactions } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public callback endpoint for IntaSend servers
router.post('/callback', handleIntaSendWebhook);

// Protected endpoints
router.post('/stk-push', protect, initiateStkPush);
router.get('/transactions', protect, getUserTransactions);

module.exports = router;
