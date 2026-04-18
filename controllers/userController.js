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

// AI Suggest Skills Helper
exports.suggestSkills = async (req, res) => {
    const { interests } = req.body;
    const suggestions = {
        coding: ['JavaScript', 'React', 'Node.js', 'Python'],
        design: ['Figma', 'Photoshop', 'UI/UX', 'Canva'],
        marketing: ['SEO', 'Content Writing', 'Social Media'],
    };

    let result = [];
    interests.forEach(interest => {
        const lowerInterest = interest.toLowerCase();
        if (suggestions[lowerInterest]) {
            result = [...new Set([...result, ...suggestions[lowerInterest]])];
        }
    });

    res.json(result);
};
