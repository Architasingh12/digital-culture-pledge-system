const express = require('express');
const router = express.Router();
const {
    getDashboardStats, createProgramWithPractices, getDetailedReport, getReportPdf,
    getCompanyAdmins, createCompanyAdmin, getSuperAdminStats,
    updateCompanyAdmin, deleteCompanyAdmin,
    getCompanyStatus, getGlobalStats,
    getParticipantsCSV, getPledgesCSV, getSurveysCSV,
    getParticipantsPDF, getPledgesPDF, getSurveysPDF,
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/super-dashboard-stats', authMiddleware, adminMiddleware, getSuperAdminStats);
router.post('/create-program-with-practices', authMiddleware, adminMiddleware, createProgramWithPractices);
router.get('/report/pdf', authMiddleware, adminMiddleware, getReportPdf);
router.get('/report', authMiddleware, adminMiddleware, getDetailedReport);

// Company Admin CRUD
router.get('/company-admins', authMiddleware, adminMiddleware, getCompanyAdmins);
router.post('/company-admins', authMiddleware, adminMiddleware, createCompanyAdmin);
router.put('/company-admins/:id', authMiddleware, adminMiddleware, updateCompanyAdmin);
router.delete('/company-admins/:id', authMiddleware, adminMiddleware, deleteCompanyAdmin);

// Company Status
router.get('/company-status', authMiddleware, adminMiddleware, getCompanyStatus);

// Global Stats (for Analytics enhancements)
router.get('/global-stats', authMiddleware, adminMiddleware, getGlobalStats);

// Global Reports — CSV downloads
router.get('/global-reports/participants/csv', authMiddleware, adminMiddleware, getParticipantsCSV);
router.get('/global-reports/pledges/csv', authMiddleware, adminMiddleware, getPledgesCSV);
router.get('/global-reports/surveys/csv', authMiddleware, adminMiddleware, getSurveysCSV);

// Global Reports — PDF downloads
router.get('/global-reports/participants/pdf', authMiddleware, adminMiddleware, getParticipantsPDF);
router.get('/global-reports/pledges/pdf', authMiddleware, adminMiddleware, getPledgesPDF);
router.get('/global-reports/surveys/pdf', authMiddleware, adminMiddleware, getSurveysPDF);

module.exports = router;
