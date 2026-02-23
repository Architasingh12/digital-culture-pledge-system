const express = require('express');
const router = express.Router();
const { getDashboardStats, createProgramWithPractices } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);
router.post('/create-program-with-practices', authMiddleware, adminMiddleware, createProgramWithPractices);

module.exports = router;
