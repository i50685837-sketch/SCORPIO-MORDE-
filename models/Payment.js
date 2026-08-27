const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
            min: 1
        },

        phone: {
            type: String,
            required: true
        },

        currency: {
            type: String,
            default: "KES"
        },

        apiRef: {
            type: String,
            required: true,
            unique: true
        },

        invoiceId: {
            type: String,
            default: null
        },

        trackingId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "PROCESSING",
                "COMPLETE",
                "FAILED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        provider: {
            type: String,
            default: "INTASEND"
        },

        rawResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        callbackData: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
