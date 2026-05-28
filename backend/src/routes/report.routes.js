const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth');
router.use(authenticate);
router.get('/devolutions', authorize('EXPORT'), ctrl.devolutionsReport);
router.get('/financial', authorize('EXPORT'), ctrl.financialReport);
router.get('/sla', authorize('EXPORT'), ctrl.slaReport);
router.get('/operational', authorize('EXPORT'), ctrl.operationalReport);
module.exports = router;
