const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { skills, interests, location, role } = req.body;
        user.skills = skills || user.skills;
        user.interests = interests || user.interests;
        user.location = location || user.location;
        user.role = role || user.role;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.find().sort({ trustScore: -1 }).limit(10);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { suggestSkillsForOnboarding } = require('../utils/gemini');

// Existing updateProfile...

// AI Suggest Skills Helper (Gemini Integrated)
exports.suggestSkills = async (req, res) => {
    try {
        const { interests } = req.body;
        const aiSuggestions = await suggestSkillsForOnboarding(interests);
        res.json(aiSuggestions); // Returns { canHelp, needHelp }
    } catch (error) {
        res.status(500).json({ message: 'Gemini could not suggest skills' });
    }
};
