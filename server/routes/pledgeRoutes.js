const express = require('express');
const router = express.Router();
const {
    createPledge,
    getMyPledges,
    getAllPledges,
    getPledgeById,
    downloadCertificate,
    getCertificateData,
} = require('../controllers/pledgeController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Public (authenticated)
router.post('/', authMiddleware, createPledge);
router.get('/my', authMiddleware, getMyPledges);

// Admin only — MUST be before /:id to avoid Express matching 'all' as an id
router.get('/all', authMiddleware, adminMiddleware, getAllPledges);

router.get('/:id', authMiddleware, getPledgeById);
// router.get('/:id/certificate', authMiddleware, downloadCertificate);
router.get('/:id/certificate-data', authMiddleware, getCertificateData);

module.exports = router;
