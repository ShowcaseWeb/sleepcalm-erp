/**
 * Roteador Principal da API v1
 */
const router = require('express').Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const devolutionRoutes = require('./devolution.routes');
const dashboardRoutes = require('./dashboard.routes');
const financialRoutes = require('./financial.routes');
const skuRoutes = require('./sku.routes');
const supplierRoutes = require('./supplier.routes');
const carrierRoutes = require('./carrier.routes');
const customerRoutes = require('./customer.routes');
const technicalRoutes = require('./technical.routes');
const lalamoveRoutes = require('./lalamove.routes');
const donationRoutes = require('./donation.routes');
const reportRoutes = require('./report.routes');
const notificationRoutes = require('./notification.routes');
const auditRoutes = require('./audit.routes');
const attachmentRoutes = require('./attachment.routes');
const fiscalRoutes = require('./fiscal.routes');

// Informações da API
router.get('/', (req, res) => {
  res.json({
    name: 'SleepCalm ERP API',
    version: '1.0.0',
    description: 'Sistema de Gestão de Devoluções',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      devolutions: '/api/v1/devolutions',
      dashboard: '/api/v1/dashboard',
      financial: '/api/v1/financial',
      skus: '/api/v1/skus',
      suppliers: '/api/v1/suppliers',
      carriers: '/api/v1/carriers',
      customers: '/api/v1/customers',
      technical: '/api/v1/technical',
      lalamove: '/api/v1/lalamove',
      donations: '/api/v1/donations',
      reports: '/api/v1/reports',
      notifications: '/api/v1/notifications',
      audit: '/api/v1/audit',
      attachments: '/api/v1/attachments',
      fiscal: '/api/v1/fiscal',
    },
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/devolutions', devolutionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/financial', financialRoutes);
router.use('/skus', skuRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/carriers', carrierRoutes);
router.use('/customers', customerRoutes);
router.use('/technical', technicalRoutes);
router.use('/lalamove', lalamoveRoutes);
router.use('/donations', donationRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/fiscal', fiscalRoutes);

module.exports = router;
