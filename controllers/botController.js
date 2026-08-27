const Bot = require("../models/Bot");

/* =========================================
   GET BOTS
========================================= */

exports.getBots = async (req, res) => {
    try {
        const bots = await Bot.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            bots
        });

    } catch (error) {
        console.error("GET BOTS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load bots"
        });
    }
};


/* =========================================
   CREATE BOT
========================================= */

exports.createBot = async (req, res) => {
    try {
        const {
            name,
            template,
            cost
        } = req.body;

        if (!name || !template) {
            return res.status(400).json({
                success: false,
                message: "Bot name and template are required"
            });
        }

        const bot = await Bot.create({
            user: req.user.id,
            name,
            template,
            cost: Number(cost) || 0,
            status: "stopped"
        });

        res.status(201).json({
            success: true,
            message: "Bot created",
            bot
        });

    } catch (error) {
        console.error("CREATE BOT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create bot"
        });
    }
};
