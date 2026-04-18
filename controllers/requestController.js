const Request = require('../models/Request');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { analyzeRequest } = require('../utils/gemini');

exports.createRequest = async (req, res) => {
    try {
        const { title, description, urgency } = req.body;
        
        // Role check
        if (req.user.role === 'Can Help') {
            return res.status(403).json({ message: 'Your role does not allow creating requests' });
        }

        // Real-time Gemini Analysis
        const aiAnalysis = await analyzeRequest(description);
        const { category, tags, summary } = aiAnalysis;

        const request = await Request.create({
            title,
            description,
            category,
            tags,
            urgency,
            aiSummary: summary,
            createdBy: req.user.id,
        });

        // NOTIFICATION: Alert all users about new request (Simplified)
        const allUsers = await User.find({ _id: { $ne: req.user.id } }).limit(5); // Limit for performance in demo
        for (const user of allUsers) {
            await Notification.create({
                user: user._id,
                message: `New request: ${title}`,
                type: 'new_request'
            });
        }

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { category, urgency, location } = req.query;
        let query = {};
        if (category) query.category = category;
        if (urgency) query.urgency = urgency;
        
        const requests = await Request.find(query).populate('createdBy', 'name location');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRequestById = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id).populate('createdBy', 'name').populate('helpers', 'name');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.helpOnRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Role check: Only "Can Help" or "Both" can offer help
        if (req.user.role === 'Need Help') {
            return res.status(403).json({ message: 'Your role does not allow offering help' });
        }

        if (request.helpers.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already offering help' });
        }

        request.helpers.push(req.user.id);
        await request.save();

        // Gamification: +10 points for help
        const user = await User.findById(req.user.id);
        user.trustScore += 10;
        await user.save();

        res.json({ message: 'Offer to help added' });

        // NOTIFICATION: Alert the creator that someone is helping
        await Notification.create({
            user: request.createdBy,
            message: `${req.user.name} offered to help with your request: ${request.title}`,
            type: 'help_offer'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.solveRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.createdBy.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: 'Only creator can mark as solved' });
        }

        request.status = 'solved';
        await request.save();

        // Gamification: +20 bonus for solvers (first helper for simplicity)
        if (request.helpers.length > 0) {
            const solver = await User.findById(request.helpers[0]);
            if (solver) {
                solver.trustScore += 20;
                await solver.save();
            }
        }

        // NOTIFICATION: Alert helpers that request is solved
        for (const helperId of request.helpers) {
            await Notification.create({
                user: helperId,
                message: `Request solved: ${request.title}. You earned trust points!`,
                type: 'solved'
            });
        }

        res.json({ message: 'Request marked as solved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await Request.countDocuments();
        const solved = await Request.countDocuments({ status: 'solved' });
        const contributions = await Request.countDocuments({ helpers: req.user.id });
        res.json({ total, solved, contributions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
