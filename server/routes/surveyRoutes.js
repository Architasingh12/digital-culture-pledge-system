const express = require('express');
const router = express.Router();
const {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getMyInstances,
    getSurveyInstance,
    submitSurveyResponse,
    getAllInstances,
} = require('../controllers/surveyController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/schedules', authMiddleware, adminMiddleware, getSchedules);
router.post('/schedules', authMiddleware, adminMiddleware, createSchedule);
router.put('/schedules/:id', authMiddleware, adminMiddleware, updateSchedule);
router.delete('/schedules/:id', authMiddleware, adminMiddleware, deleteSchedule);
router.get('/all-instances', authMiddleware, adminMiddleware, getAllInstances);

// ── Participant routes ────────────────────────────────────────────────────────
router.get('/my-instances', authMiddleware, getMyInstances);
router.get('/instances/:id', authMiddleware, getSurveyInstance);
router.post('/instances/:id/submit', authMiddleware, submitSurveyResponse);

module.exports = router;
