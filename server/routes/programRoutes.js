const express = require('express');
const router = express.Router();
const { createProgram, getPrograms, getProgramById, updateProgram, deleteProgram } = require('../controllers/programController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getPrograms);
router.get('/:id', authMiddleware, getProgramById);

// Admin only
router.post('/', authMiddleware, adminMiddleware, createProgram);
router.put('/:id', authMiddleware, adminMiddleware, updateProgram);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProgram);

module.exports = router;
