const express = require('express');
const router = express.Router();
const { authMiddleware, companyAdminMiddleware } = require('../middleware/authMiddleware');

const {
    getCompanyAdminStatus,
    getCompanyDownloads,
    getCompanyReminderConfig,
    saveCompanyReminderConfig,
    triggerCompanyReminders,
    addCompanyParticipant
} = require('../controllers/companyAdminController');

// Using authMiddleware to ensure user is logged in
// We should check that they are a company_admin. Wait, the existing routes use `adminMiddleware` for company admins. Let's use `adminMiddleware` to be consistent with how the app was working, as `admin` role is also a company_admin basically. Yes.
const { adminMiddleware } = require('../middleware/authMiddleware');

router.get('/status', authMiddleware, adminMiddleware, getCompanyAdminStatus);
router.get('/downloads/:type/:format', authMiddleware, adminMiddleware, getCompanyDownloads);
router.get('/reminders/config', authMiddleware, adminMiddleware, getCompanyReminderConfig);
router.post('/reminders/config', authMiddleware, adminMiddleware, saveCompanyReminderConfig);
router.post('/reminders/send', authMiddleware, adminMiddleware, triggerCompanyReminders);
router.post('/participants/add', authMiddleware, adminMiddleware, addCompanyParticipant);

module.exports = router;
