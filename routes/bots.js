const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
    getBots,
    createBot
} = require("../controllers/botController");

// Get user's bots
router.get("/", auth, getBots);

// Deploy a bot
router.post("/", auth, createBot);

module.exports = router;
