const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendOTP } = require('../utils/emailUtil');

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/request-otp
const requestOTP = async (req, res) => {
    const { email, name, department } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        // Upsert user
        const userResult = await pool.query(
            `INSERT INTO users (email, name, designation)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET name = COALESCE(EXCLUDED.name, users.name),
             designation = COALESCE(EXCLUDED.designation, users.designation)
       RETURNING *`,
            [email.toLowerCase().trim(), name || '', department || '']
        );

        const user = userResult.rows[0];

        // Invalidate previous OTPs
        await pool.query(
            "UPDATE otp_tokens SET used = true WHERE email = $1 AND used = false",
            [email.toLowerCase().trim()]
        );

        // Generate and hash OTP
        const otp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);
        const expiresAt = new Date(
            Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
        );

        await pool.query(
            "INSERT INTO otp_tokens (email, otp_hash, expires_at) VALUES ($1, $2, $3)",
            [email.toLowerCase().trim(), otpHash, expiresAt]
        );

        // Send OTP email
        await sendOTP(email, otp, user.name);

        return res.status(200).json({
            success: true,
            message: `OTP sent to ${email}. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.`,
        });
    } catch (error) {
        console.error('requestOTP error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    try {
        // Fetch valid, unexpired OTP token
        const tokenResult = await pool.query(
            `SELECT * FROM otp_tokens
       WHERE email = $1 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
            [email.toLowerCase().trim()]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        const tokenRow = tokenResult.rows[0];
        const isValid = await bcrypt.compare(otp, tokenRow.otp_hash);

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // Mark OTP as used
        await pool.query("UPDATE otp_tokens SET used = true WHERE id = $1", [tokenRow.id]);

        // Fetch user
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]
        );
        const user = userResult.rows[0];

        // Issue JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role, designation: user.designation },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, designation: user.designation },
        });
    } catch (error) {
        console.error('verifyOTP error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, designation, role, created_at FROM users WHERE id = $1",
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({ success: true, user: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// POST /api/auth/logout
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { requestOTP, verifyOTP, getMe, logout };
