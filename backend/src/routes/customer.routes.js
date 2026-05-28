const router = require('express').Router();
const ctrl = require('../controllers/customer.controller');
const { authenticate } = require('../middlewares/auth');
router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
module.exports = router;
