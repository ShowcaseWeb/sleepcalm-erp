const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth');
router.use(authenticate);
router.get('/devolutions', authorize('EXPORT'), ctrl.devolutionsReport);
router.get('/financial', authorize('EXPORT'), ctrl.financialReport);
router.get('/sla', authorize('EXPORT'), ctrl.slaReport);
router.get('/operational', authorize('EXPORT'), ctrl.operationalReport);
// Rota dinâmica — usada por reportAPI.generate(reportId, format)
// Ex: GET /reports/devolutions?format=pdf → ctrl.devolutionsReport
router.get('/:reportId', authorize('EXPORT'), (req, res) => {
  const map = {
    devolutions: ctrl.devolutionsReport,
    financial: ctrl.financialReport,
    sla: ctrl.slaReport,
    operational: ctrl.operationalReport,
  };
  const handler = map[req.params.reportId];
  if (!handler) return res.status(404).json({ error: 'Relatório não encontrado.' });
  return handler(req, res);
});
module.exports = router;
