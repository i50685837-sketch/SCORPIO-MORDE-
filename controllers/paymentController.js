const Payment = require("../models/Payment");
const User = require("../models/User");
const intasend = require("../services/intasend");


/* =========================================
   STK PUSH
========================================= */

exports.stkPush = async (req, res) => {
    try {
        const userId = req.user.id;

        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({
                success: false,
                message: "Phone number and amount are required"
            });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const payment = await Payment.create({
            user: userId,
            phone,
            amount: numericAmount,
            status: "pending",
            provider: "intasend"
        });

        const response = await intasend.createSTKPush({
            phone,
            amount: numericAmount,
            reference: payment._id.toString(),
            narrative: "SCORPIO MORDE wallet top-up"
        });

        payment.checkoutRequestId =
            response.checkout_request_id ||
            response.id ||
            null;

        await payment.save();

        res.json({
            success: true,
            message: "STK Push sent",
            paymentId: payment._id,
            data: response
        });

    } catch (error) {
        console.error("STK ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Unable to send STK Push"
        });
    }
};


/* =========================================
   INTASEND CALLBACK
========================================= */

exports.paymentCallback = async (req, res) => {
    try {
        console.log("📥 IntaSend callback:", req.body);

        const data = req.body;

        const paymentId =
            data.reference ||
            data.metadata?.reference;

        if (!paymentId) {
            return res.status(200).json({
                success: true
            });
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const status = String(
            data.status || ""
        ).toLowerCase();

        if (
            status === "completed" ||
            status === "complete" ||
            status === "successful" ||
            status === "success"
        ) {
            if (payment.status !== "completed") {
                payment.status = "completed";
                await payment.save();

                await User.findByIdAndUpdate(
                    payment.user,
                    {
                        $inc: {
                            credits: payment.amount
                        }
                    }
                );
            }
        }

        res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error("CALLBACK ERROR:", error);

        res.status(500).json({
            success: false
        });
    }
};


/* =========================================
   GET WALLET
========================================= */

exports.getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("fullname email credits");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            wallet: {
                credits: user.credits || 0
            }
        });

    } catch (error) {
        console.error("WALLET ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load wallet"
        });
    }
};


/* =========================================
   TRANSACTIONS
========================================= */

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Payment.find({
            user: req.user.id
        })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            transactions
        });

    } catch (error) {
        console.error("TRANSACTIONS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load transactions"
        });
    }
};
