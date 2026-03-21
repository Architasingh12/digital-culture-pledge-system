const express = require('express');
const router = express.Router();
const { createProgram, getPrograms, getProgramById, updateProgram, deleteProgram } = require('../controllers/programController');
const { authMiddleware, adminMiddleware, superAdminMiddleware } = require('../middleware/authMiddleware');

// Any admin role can read programs
router.get('/', authMiddleware, adminMiddleware, getPrograms);
router.get('/:id', authMiddleware, adminMiddleware, getProgramById);

// Super Admin only: create, edit, delete
router.post('/', authMiddleware, superAdminMiddleware, createProgram);
router.put('/:id', authMiddleware, superAdminMiddleware, updateProgram);
router.delete('/:id', authMiddleware, superAdminMiddleware, deleteProgram);

module.exports = router;
