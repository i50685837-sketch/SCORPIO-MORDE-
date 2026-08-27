const mongoose = require("mongoose");

const botSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        template: {
            type: String,
            required: true
        },

        cost: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "active",
                "stopped"
            ],
            default: "stopped"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Bot", botSchema);
