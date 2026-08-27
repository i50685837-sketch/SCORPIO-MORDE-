const express = require("express");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const {
    sendStkPush
} = require("../services/intasend");

const router = express.Router();


/* =====================================================
   NORMALIZE KENYAN PHONE NUMBER
===================================================== */

function normalizePhone(phone) {

    phone = String(phone || "")
        .trim()
        .replace(/\s+/g, "");

    if (phone.startsWith("+254")) {
        phone = phone.substring(1);
    }

    if (phone.startsWith("0")) {
        phone = "254" + phone.substring(1);
    }

    if (!/^2547\d{8}$/.test(phone)) {
        throw new Error(
            "Invalid Kenyan M-Pesa phone number"
        );
    }

    return phone;
}


/* =====================================================
   POST /api/payments/stk
===================================================== */

router.post("/stk", async (req, res) => {

    try {

        const {
            amount,
            phone
        } = req.body;

        /* -----------------------------
           VALIDATE AMOUNT
        ----------------------------- */

        const numericAmount =
            Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount < 10
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum deposit is KES 10."
            });
        }


        /* -----------------------------
           VALIDATE PHONE
        ----------------------------- */

        let mpesaPhone;

        try {

            mpesaPhone =
                normalizePhone(phone);

        } catch (error) {

            return res.status(400).json({
                success: false,
                message:
                    error.message
            });
        }


        /* -----------------------------
           CREATE UNIQUE REFERENCE
        ----------------------------- */

        const apiRef =
            "SCORPIO-" +
            Date.now() +
            "-" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();


        /* -----------------------------
           SAVE PAYMENT
        ----------------------------- */

        const payment =
            await Payment.create({

                amount:
                    numericAmount,

                phone:
                    mpesaPhone,

                currency:
                    "KES",

                apiRef:
                    apiRef,

                status:
                    "PENDING"
            });


        /* -----------------------------
           SEND STK
        ----------------------------- */

        let intasendResponse;

        try {

            intasendResponse =
                await sendStkPush({

                    amount:
                        numericAmount,

                    phone:
                        mpesaPhone,

                    apiRef:
                        apiRef,

                    host:
                        process.env.BASE_URL
                });

        } catch (intasendError) {

            console.error(
                "❌ IntaSend STK error:",
                intasendError?.response ||
                intasendError?.message ||
                intasendError
            );

            payment.status =
                "FAILED";

            payment.rawResponse =
                intasendError?.response ||
                intasendError?.message ||
                intasendError;

            await payment.save();

            return res.status(502).json({

                success: false,

                message:
                    "Unable to send M-Pesa STK Push."
            });
        }


        /* -----------------------------
           SAVE INTASEND RESPONSE
        ----------------------------- */

        payment.status =
            "PROCESSING";

        payment.rawResponse =
            intasendResponse;

        if (intasendResponse) {

            payment.invoiceId =
                intasendResponse.invoice_id ||
                intasendResponse.invoiceId ||
                null;

            payment.trackingId =
                intasendResponse.tracking_id ||
                intasendResponse.trackingId ||
                null;
        }

        await payment.save();


        /* -----------------------------
           RESPONSE TO FRONTEND
        ----------------------------- */

        return res.status(200).json({

            success: true,

            message:
                "STK Push sent. Check your M-Pesa phone.",

            paymentId:
                payment._id,

            apiRef:
                apiRef,

            status:
                payment.status

        });

    } catch (error) {

        console.error(
            "❌ STK route error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Server error while initiating payment."
        });
    }
});


/* =====================================================
   PAYMENT CALLBACK
   POST /api/payments/callback
===================================================== */

router.post("/callback", async (req, res) => {

    try {

        console.log(
            "📥 IntaSend callback:",
            JSON.stringify(
                req.body,
                null,
                2
            )
        );


        const data =
            req.body || {};


        /*
         * Try several common reference locations
         * because callback payloads can vary.
         */

        const apiRef =
            data.api_ref ||
            data.apiRef ||
            data.invoice?.api_ref ||
            data.invoice?.apiRef ||
            null;


        const invoiceId =
            data.invoice_id ||
            data.invoiceId ||
            data.invoice?.invoice_id ||
            null;


        const trackingId =
            data.tracking_id ||
            data.trackingId ||
            null;


        let payment = null;


        if (apiRef) {

            payment =
                await Payment.findOne({
                    apiRef: apiRef
                });
        }


        if (!payment && invoiceId) {

            payment =
                await Payment.findOne({
                    invoiceId: invoiceId
                });
        }


        if (!payment && trackingId) {

            payment =
                await Payment.findOne({
                    trackingId: trackingId
                });
        }


        /*
         * Always acknowledge callback.
         */

        if (!payment) {

            console.warn(
                "⚠️ Payment not found for callback"
            );

            return res.status(200).json({
                received: true
            });
        }


        /* -----------------------------
           SAVE CALLBACK
        ----------------------------- */

        payment.callbackData =
            data;


        /*
         * Detect payment status.
         */

        const statusText =
            String(
                data.state ||
                data.status ||
                data.invoice?.state ||
                data.invoice?.status ||
                ""
            ).toUpperCase();


        if (
            statusText.includes("COMPLETE") ||
            statusText.includes("SUCCESS")
        ) {

            payment.status =
                "COMPLETE";

        } else if (
            statusText.includes("FAILED") ||
            statusText.includes("FAIL")
        ) {

            payment.status =
                "FAILED";

        } else if (
            statusText.includes("CANCEL")
        ) {

            payment.status =
                "CANCELLED";

        } else {

            payment.status =
                "PROCESSING";
        }


        await payment.save();


        /*
         * IMPORTANT:
         *
         * Do NOT automatically add the amount
         * to a user's wallet here unless the payment
         * is confirmed successful and the payment
         * has not already been credited.
         *
         * We can add your Wallet model/crediting
         * logic once your existing wallet schema
         * is connected.
         */


        return res.status(200).json({

            received: true,

            status:
                payment.status

        });

    } catch (error) {

        console.error(
            "❌ Callback error:",
            error
        );

        /*
         * Return 200 so IntaSend knows that the
         * callback reached our server.
         */

        return res.status(200).json({
            received: true
        });
    }
});


/* =====================================================
   GET PAYMENT STATUS
   GET /api/payments/:id
===================================================== */

router.get("/:id", async (req, res) => {

    try {

        const payment =
            await Payment.findById(
                req.params.id
            );

        if (!payment) {

            return res.status(404).json({

                success: false,

                message:
                    "Payment not found."
            });
        }


        return res.json({

            success: true,

            payment: {

                id:
                    payment._id,

                amount:
                    payment.amount,

                phone:
                    payment.phone,

                status:
                    payment.status,

                createdAt:
                    payment.createdAt,

                updatedAt:
                    payment.updatedAt
            }

        });

    } catch (error) {

        console.error(
            "Payment status error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to retrieve payment."
        });
    }
});


module.exports = router;
