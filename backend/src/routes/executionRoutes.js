const express = require('express');
const executionController = require('../controllers/executionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', executionController.execute);
router.get('/summary', executionController.getSummary);
router.get('/history', executionController.getHistory);
router.get('/:id/export', executionController.export);
router.get('/:id', executionController.getResults);
router.post('/:id/stop', executionController.stop);

module.exports = router;
