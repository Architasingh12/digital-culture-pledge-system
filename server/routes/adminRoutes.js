const express = require('express');
const router = express.Router();
const { getDashboardStats, createProgramWithPractices, getDetailedReport, getReportPdf, getCompanyAdmins, createCompanyAdmin, getSuperAdminStats } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/super-dashboard-stats', authMiddleware, adminMiddleware, getSuperAdminStats);
router.post('/create-program-with-practices', authMiddleware, adminMiddleware, createProgramWithPractices);
router.get('/report/pdf', authMiddleware, adminMiddleware, getReportPdf);
router.get('/report', authMiddleware, adminMiddleware, getDetailedReport);

// Super Admin endpoints to manage companies (users with company_admin role)
router.get('/company-admins', authMiddleware, adminMiddleware, getCompanyAdmins);
router.post('/company-admins', authMiddleware, adminMiddleware, createCompanyAdmin);

module.exports = router;
