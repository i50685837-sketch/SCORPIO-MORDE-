const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
    getWallet,
    getTransactions
} = require("../controllers/paymentController");

// Get logged-in user's wallet
router.get("/", auth, getWallet);

// Get payment history
router.get("/transactions", auth, getTransactions);

module.exports = router;
