const express = require('express');
const router = express.Router();
const { createPractice, getPracticesByProgram, updatePractice, deletePractice } = require('../controllers/practiceController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/program/:program_id', authMiddleware, getPracticesByProgram);

// Admin only
router.post('/', authMiddleware, adminMiddleware, createPractice);
router.put('/:id', authMiddleware, adminMiddleware, updatePractice);
router.delete('/:id', authMiddleware, adminMiddleware, deletePractice);

module.exports = router;
