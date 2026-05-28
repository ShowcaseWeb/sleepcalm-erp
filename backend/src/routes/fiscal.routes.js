const router = require('express').Router();
const ctrl = require('../controllers/fiscal.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadFiscalDocs } = require('../middlewares/upload');
router.use(authenticate);
router.get('/devolution/:devolutionId', ctrl.list);
router.post('/devolution/:devolutionId', uploadFiscalDocs.single('file'), ctrl.upload);
router.delete('/:id', authorize('DELETE'), ctrl.remove);
module.exports = router;
