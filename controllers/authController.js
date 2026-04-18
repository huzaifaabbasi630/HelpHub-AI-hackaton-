const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password,
            verificationCode,
        });

        const message = `Your verification code is: ${verificationCode}`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Verification',
                message,
            });
            return res.status(201).json({ message: 'Verification code sent to email' });
        } catch (mailError) {
            console.error('Nodemailer Error:', mailError);
            // Even if email fails, user is created. We might want to handle this differently.
            return res.status(500).json({ message: 'User created but email could not be sent. Please check your SMTP settings.' });
        }
    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.verificationCode === code) {
            user.isVerified = true;
            user.verificationCode = undefined;
            await user.save();
            return res.status(200).json({ message: 'Email verified successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
    } catch (error) {
        console.error('Verify Error:', error);
        return res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Please verify your email first' });
            }
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: error.message });
    }
};
