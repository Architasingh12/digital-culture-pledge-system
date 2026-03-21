const jwt = require('jsonwebtoken');

const ADMIN_ROLES = ['admin', 'super_admin', 'company_admin'];

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        const decoded = jwt.verify(token, 'archita_digital_pledge_secure_2026_key');
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

// Allows any admin-level role (admin, super_admin, company_admin)
const adminMiddleware = (req, res, next) => {
    if (req.user && ADMIN_ROLES.includes(req.user.role)) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
};

// Super admin only
const superAdminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Super admin only.' });
    }
};

// Company admin only
const companyAdminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'company_admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Company admin only.' });
    }
};

// Participant only
const participantMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'participant') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied. Participants only.' });
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    superAdminMiddleware,
    companyAdminMiddleware,
    participantMiddleware,
};

