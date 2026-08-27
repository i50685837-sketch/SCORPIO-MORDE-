const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        provider: {
            type: String,
            default: "intasend"
        },

        checkoutRequestId: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: [
                "pending",
                "completed",
                "failed",
                "cancelled"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
