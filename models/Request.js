const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    tags: { type: [String], default: [] },
    urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    helpers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'solved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
