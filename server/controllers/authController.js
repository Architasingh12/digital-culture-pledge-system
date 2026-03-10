const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Password strength regex: ≥8 chars, uppercase, lowercase, digit, special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, email, designation, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
        });
    }

    try {
        // Check if user already exists
        const existing = await pool.query('SELECT id, password FROM users WHERE email = $1', [email.toLowerCase().trim()]);

        if (existing.rows.length > 0 && existing.rows[0].password) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, designation, password)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) DO UPDATE
               SET name        = COALESCE(EXCLUDED.name, users.name),
                   designation = COALESCE(EXCLUDED.designation, users.designation),
                   password    = EXCLUDED.password
             RETURNING id, name, email, designation, role, created_at`,
            [name.trim(), email.toLowerCase().trim(), designation?.trim() || '', passwordHash]
        );

        const user = result.rows[0];

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, designation: user.designation },
        });
    } catch (error) {
        console.error('register error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, name, email, designation, role, password FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        if (!user.password) {
            return res.status(401).json({ success: false, message: 'This account has no password set. Please contact your administrator.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

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
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, designation: user.designation },
        });
    } catch (error) {
        console.error('login error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, designation, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('getMe error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, getMe, logout };
