const express = require('express');
const router = express.Router();
const {
    createPledge,
    getMyPledges,
    getAllPledges,
    getPledgeById
} = require('../controllers/pledgeController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Public (authenticated)
router.post('/', authMiddleware, createPledge);
router.get('/my', authMiddleware, getMyPledges);
router.get('/:id', authMiddleware, getPledgeById);

// Admin only
router.get('/all', authMiddleware, adminMiddleware, getAllPledges);

module.exports = router;
