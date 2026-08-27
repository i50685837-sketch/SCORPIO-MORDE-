const axios = require('axios');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @route   POST /api/payments/stk-push
exports.initiateStkPush = async (req, res, next) => {
  try {
    const { phoneNumber, amount } = req.body;

    if (!phoneNumber || !amount) {
      res.statusCode = 400;
      throw new Error('Please provide phone number and payment amount');
    }

    const isTest = process.env.INTASEND_IS_TEST === 'true';
    const intasendEndpoint = isTest
      ? 'https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/'
      : 'https://payment.intasend.com/api/v1/payment/mpesa-stk-push/';

    const response = await axios.post(
      intasendEndpoint,
      {
        phone_number: phoneNumber,
        amount: Number(amount),
        api_ref: `topup_${req.user.id}`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTASEND_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const trackingId = response.data.invoice.invoice_id;

    const transaction = await Transaction.create({
      userId: req.user.id,
      trackingId,
      amount: Number(amount),
      phoneNumber,
      status: 'PENDING'
    });

    res.status(200).json({
      success: true,
      trackingId,
      message: 'M-Pesa STK push dispatched to mobile terminal',
      transaction
    });
  } catch (error) {
    if (error.response) {
      res.statusCode = error.response.status || 500;
      return next(new Error(error.response.data.detail || 'IntaSend gateway failed'));
    }
    next(error);
  }
};

// @route   POST /api/payments/callback (Public webhook)
exports.handleIntaSendWebhook = async (req, res, next) => {
  try {
    const { invoice_id, state, mpesa_receipt } = req.body;

    if (state === 'COMPLETE') {
      const transaction = await Transaction.findOne({ trackingId: invoice_id });

      if (transaction && transaction.status === 'PENDING') {
        transaction.status = 'COMPLETE';
        if (mpesa_receipt) transaction.mpesaReceipt = mpesa_receipt;
        await transaction.save();

        const user = await User.findById(transaction.userId);
        if (user) {
          user.credits += transaction.amount;
          await user.save();
        }
      }
    } else if (state === 'FAILED') {
      const transaction = await Transaction.findOne({ trackingId: invoice_id });
      if (transaction) {
        transaction.status = 'FAILED';
        await transaction.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('CALLBACK_PROCESSING_ERROR');
  }
};

// @route   GET /api/payments/transactions
exports.getUserTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};
