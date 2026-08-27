const express = require("express");
const router = express.Router();

const {
    stkPush,
    paymentCallback
} = require("../controllers/paymentController");

// Request M-Pesa STK Push
router.post("/stk", stkPush);

// IntaSend payment callback
router.post("/callback", paymentCallback);

module.exports = router;
