const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const { authenticate, requireRole } = require('../middlewares/auth');
router.use(authenticate);
router.use(requireRole('OWNER', 'ADMIN', 'SUPERVISOR'));
router.get('/', ctrl.list);
router.get('/summary', ctrl.getSummary);
module.exports = router;
