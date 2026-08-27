const Bot = require('../models/Bot');
const User = require('../models/User');

// @route   GET /api/bots
exports.getBots = async (req, res, next) => {
  try {
    const bots = await Bot.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bots.length,
      data: bots
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/bots/deploy
exports.deployBot = async (req, res, next) => {
  try {
    const { name, cost } = req.body;
    const botCost = cost || 50;

    if (!name) {
      res.statusCode = 400;
      throw new Error('Bot deployment requires a valid name');
    }

    const user = await User.findById(req.user.id);
    if (user.credits < botCost) {
      res.statusCode = 400;
      throw new Error('Insufficient credits balance to deploy bot instance');
    }

    user.credits -= botCost;
    await user.save();

    const bot = await Bot.create({
      userId: user._id,
      name,
      cost: botCost,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: bot,
      remainingCredits: user.credits
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/bots/:id/toggle
exports.toggleBotStatus = async (req, res, next) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, userId: req.user.id });
    if (!bot) {
      res.statusCode = 404;
      throw new Error('Bot instance not found');
    }

    bot.status = bot.status === 'active' ? 'stopped' : 'active';
    await bot.save();

    res.status(200).json({
      success: true,
      data: bot
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/bots/:id
exports.deleteBot = async (req, res, next) => {
  try {
    const bot = await Bot.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!bot) {
      res.statusCode = 404;
      throw new Error('Bot instance not found');
    }

    res.status(200).json({
      success: true,
      message: 'Bot instance terminated successfully',
      botId: req.params.id
    });
  } catch (error) {
    next(error);
  }
};
