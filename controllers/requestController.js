const Request = require('../models/Request');
const User = require('../models/User');

exports.createRequest = async (req, res) => {
    try {
        const { title, description, urgency } = req.body;
        
        // AI Feature: Auto category
        let category = 'General';
        const desc = description.toLowerCase();
        if (desc.includes('error') || desc.includes('code') || desc.includes('programming')) {
            category = 'Programming';
        } else if (desc.includes('design') || desc.includes('ui') || desc.includes('color')) {
            category = 'Design';
        }

        // AI Feature: Tag suggestion (first 3 keywords or simple split)
        const tags = description.split(' ').filter(word => word.length > 4).slice(0, 3);

        const request = await Request.create({
            title,
            description,
            category,
            tags,
            urgency,
            createdBy: req.user.id,
        });

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
