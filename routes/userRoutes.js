const express = require('express');
const { updateProfile, getLeaderboard, suggestSkills } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/leaderboard', getLeaderboard);
router.post('/suggest-skills', protect, suggestSkills);

module.exports = router;
