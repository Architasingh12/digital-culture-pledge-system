const express = require('express');
const router = express.Router();
const { getDashboardStats, createProgramWithPractices, getDetailedReport, getReportPdf } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);
router.post('/create-program-with-practices', authMiddleware, adminMiddleware, createProgramWithPractices);
router.get('/report/pdf', authMiddleware, adminMiddleware, getReportPdf);
router.get('/report', authMiddleware, adminMiddleware, getDetailedReport);

module.exports = router;
