const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize, requireRole } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', authorize('MANAGE_USERS'), userController.list);
router.get('/:id', userController.getById);
router.post('/', requireRole('OWNER', 'ADMIN'), userController.create);
router.put('/:id', requireRole('OWNER', 'ADMIN'), userController.update);
router.patch('/:id/permissions', requireRole('OWNER', 'ADMIN'), userController.updatePermissions);
router.patch('/:id/activate', requireRole('OWNER', 'ADMIN'), userController.toggleActive);
router.delete('/:id', requireRole('OWNER'), userController.remove);

module.exports = router;
