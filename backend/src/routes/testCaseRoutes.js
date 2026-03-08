const express = require('express');
const testCaseController = require('../controllers/testCaseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', testCaseController.getAll);
router.get('/:id', testCaseController.getById);
router.post('/', testCaseController.create);
router.put('/:id', testCaseController.update);
router.delete('/:id', testCaseController.delete);

module.exports = router;
