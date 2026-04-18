const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verificationCode: { type: String },
    isVerified: { type: Boolean, default: false },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    location: { type: String },
    role: { type: String, enum: ['Need Help', 'Can Help', 'Both'] },
    trustScore: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    
    // Using a simpler one-line hash to avoid "Illegal arguments" error with genSalt
    // bcrypt.hash(data, rounds) returns a promise in bcryptjs
    if (typeof this.password === 'string') {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
