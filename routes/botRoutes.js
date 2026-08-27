const express = require('express');
const router = express.Router();
const { getBots, deployBot, toggleBotStatus, deleteBot } = require('../controllers/botController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all bot endpoints

router.get('/', getBots);
router.post('/deploy', deployBot);
router.patch('/:id/toggle', toggleBotStatus);
router.delete('/:id', deleteBot);

module.exports = router;
