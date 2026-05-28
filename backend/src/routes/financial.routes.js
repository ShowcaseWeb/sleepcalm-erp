const router = require('express').Router();
const financialController = require('../controllers/financial.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('MANAGE_FINANCIAL'), financialController.list);
router.get('/summary', authorize('MANAGE_FINANCIAL'), financialController.getSummary);
router.get('/flow', authorize('MANAGE_FINANCIAL'), financialController.getFlow);
router.get('/:id', authorize('MANAGE_FINANCIAL'), financialController.getById);
router.post('/', authorize('CREATE'), financialController.create);
router.patch('/:id/approve', authorize('APPROVE'), financialController.approve);
router.delete('/:id', authorize('DELETE'), financialController.remove);

module.exports = router;
