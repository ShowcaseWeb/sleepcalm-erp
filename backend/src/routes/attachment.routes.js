const router = require('express').Router();
const ctrl = require('../controllers/attachment.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadAttachments } = require('../middlewares/upload');
router.use(authenticate);
router.get('/devolution/:devolutionId', ctrl.list);
router.post('/devolution/:devolutionId', uploadAttachments.array('files', 10), ctrl.upload);
router.delete('/:id', authorize('DELETE'), ctrl.remove);
module.exports = router;
