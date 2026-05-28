const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/kpis', authorize('VIEW'), dashboardController.getKPIs);
router.get('/full', authorize('VIEW'), dashboardController.getDashboardFull);
router.get('/monthly-evolution', authorize('VIEW'), dashboardController.getMonthlyEvolution);
router.get('/reason-distribution', authorize('VIEW'), dashboardController.getReasonDistribution);
router.get('/top-skus', authorize('VIEW'), dashboardController.getTopSKUs);
router.get('/top-suppliers', authorize('VIEW'), dashboardController.getTopSuppliers);
router.get('/top-carriers', authorize('VIEW'), dashboardController.getTopCarriers);
router.get('/status-distribution', authorize('VIEW'), dashboardController.getStatusDistribution);
router.get('/channel-distribution', authorize('VIEW'), dashboardController.getChannelDistribution);
router.get('/sla-performance', authorize('VIEW'), dashboardController.getSLAPerformance);
router.get('/monthly-loss', authorize('VIEW'), dashboardController.getMonthlyLoss);
router.get('/operational-performance', authorize('VIEW'), dashboardController.getOperationalPerformance);

module.exports = router;
