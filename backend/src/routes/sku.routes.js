const router = require('express').Router();
const skuController = require('../controllers/sku.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', skuController.list);
router.get('/search', skuController.search);
router.get('/:id', skuController.getById);
router.post('/', authorize('MANAGE_SKUS'), skuController.create);
router.put('/:id', authorize('MANAGE_SKUS'), skuController.update);
router.delete('/:id', authorize('DELETE'), skuController.remove);

module.exports = router;
