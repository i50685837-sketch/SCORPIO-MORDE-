const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Bot = require('../models/Bot');
const Transaction = require('../models/Transaction');

// --- PROTECTED ROUTES (Require Authorization Header) ---

// 1. GET User Profile
router.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({
      email: user.email,
      credits: user.credits,
      apiKey: user.apiKey,
      webhookUrl: user.webhookUrl
    });
  } catch (err) {
    res.status(500).json({ message: 'USER_PROFILE_FETCH_FAILED', error: err.message });
  }
});

// 2. PATCH Update Webhook & Settings
router.patch('/user/settings', authMiddleware, async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const user = await User.findById(req.user.id);
    
    if (webhookUrl !== undefined) {
      user.webhookUrl = webhookUrl;
      await user.save();
    }
    
    res.status(200).json({ success: true, webhookUrl: user.webhookUrl });
  } catch (err) {
    res.status(500).json({ message: 'SETTINGS_UPDATE_FAILED', error: err.message });
  }
});

// 3. GET All User Bots
router.get('/bots', authMiddleware, async (req, res) => {
  try {
    const bots = await Bot.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(bots);
  } catch (err) {
    res.status(500).json({ message: 'BOTS_FETCH_FAILED', error: err.message });
  }
});

// 4. POST Deploy New Bot
router.post('/bots/deploy', authMiddleware, async (req, res) => {
  try {
    const { name, cost } = req.body;
    
    if (!name || cost === undefined) {
      return res.status(400).json({ message: 'MISSING_NAME_OR_COST' });
    }

    const user = await User.findById(req.user.id);

    if (user.credits < cost) {
      return res.status(400).json({ message: 'ERR_INSUFFICIENT_CREDITS' });
    }

    user.credits -= cost;
    await user.save();

    const newBot = await Bot.create({
      userId: user._id,
      name,
      cost,
      status: 'active'
    });

    res.status(201).json(newBot);
  } catch (err) {
    res.status(500).json({ message: 'BOT_DEPLOYMENT_FAILED', error: err.message });
  }
});

// 5. PATCH Toggle Bot Status
router.patch('/bots/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'BOT_NOT_FOUND' });
    }

    bot.status = bot.status === 'active' ? 'stopped' : 'active';
    await bot.save();
    
    res.status(200).json(bot);
  } catch (err) {
    res.status(500).json({ message: 'STATUS_TOGGLE_FAILED', error: err.message });
  }
});

// 6. DELETE Terminate Bot
router.delete('/bots/:id', authMiddleware, async (req, res) => {
  try {
    const bot = await Bot.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!bot) {
      return res.status(404).json({ message: 'BOT_NOT_FOUND' });
    }
    
    res.status(200).json({ success: true, message: 'Bot deployment terminated', botId: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'BOT_TERMINATION_FAILED', error: err.message });
  }
});

// 7. POST IntaSend M-Pesa STK Push Integration
router.post('/payments/stk-push', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    
    if (!phoneNumber || !amount) {
      return res.status(400).json({ success: false, message: 'MISSING_PHONE_OR_AMOUNT' });
    }

    const isTest = process.env.INTASEND_IS_TEST === 'true';
    const intasendEndpoint = isTest 
      ? 'https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/' 
      : 'https://payment.intasend.com/api/v1/payment/mpesa-stk-push/';

    const response = await axios.post(
      intasendEndpoint,
      {
        phone_number: phoneNumber,
        amount: amount,
        api_ref: `node_topup_${req.user.id}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const trackingId = response.data.invoice.invoice_id;

    await Transaction.create({
      userId: req.user.id,
      trackingId: trackingId,
      amount: amount,
      phoneNumber: phoneNumber,
      status: 'PENDING'
    });

    res.status(200).json({
      success: true,
      trackingId: trackingId,
      message: 'STK prompt dispatched to device'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.response?.data?.detail || 'IntaSend gateway communication failure'
    });
  }
});

// --- PUBLIC WEBHOOK ROUTE (Called directly by IntaSend servers) ---

// 8. POST IntaSend Webhook Callback Receiver
router.post('/payments/callback', async (req, res) => {
  try {
    const { invoice_id, state } = req.body;

    if (state === 'COMPLETE') {
      const transaction = await Transaction.findOne({ trackingId: invoice_id });
      
      if (transaction && transaction.status === 'PENDING') {
        transaction.status = 'COMPLETE';
        await transaction.save();

        const user = await User.findById(transaction.userId);
        if (user) {
          user.credits += transaction.amount;
          await user.save();
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('CALLBACK_PROCESSING_ERROR');
  }
});

module.exports = router;
