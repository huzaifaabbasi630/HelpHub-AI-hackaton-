const express = require('express');
const { createRequest, getRequests, getRequestById, helpOnRequest, solveRequest, getStats } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, createRequest);
router.get('/', getRequests);
router.get('/stats', protect, getStats);
router.get('/:id', getRequestById);
router.patch('/:id/help', protect, helpOnRequest);
router.patch('/:id/solve', protect, solveRequest);

module.exports = router;
