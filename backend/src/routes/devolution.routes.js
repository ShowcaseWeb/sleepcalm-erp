/**
 * Rotas de Devoluções
 */
const router = require('express').Router();
const devolutionController = require('../controllers/devolution.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

// GET /api/v1/devolutions
router.get('/', devolutionController.list);

// GET /api/v1/devolutions/stats
router.get('/stats', devolutionController.getStats);

// GET /api/v1/devolutions/:id
router.get('/:id', devolutionController.getById);

// POST /api/v1/devolutions
router.post('/', authorize('CREATE'), devolutionController.create);

// PUT /api/v1/devolutions/:id
router.put('/:id', authorize('EDIT'), devolutionController.update);

// PATCH /api/v1/devolutions/:id/status
router.patch('/:id/status', authorize('EDIT'), devolutionController.updateStatus);

// PATCH /api/v1/devolutions/:id/assign
router.patch('/:id/assign', authorize('EDIT'), devolutionController.assign);

// DELETE /api/v1/devolutions/:id
router.delete('/:id', authorize('DELETE'), devolutionController.remove);

// GET /api/v1/devolutions/:id/timeline
router.get('/:id/timeline', devolutionController.getTimeline);

// POST /api/v1/devolutions/:id/comments
router.post('/:id/comments', authorize('CREATE'), devolutionController.addComment);

// GET /api/v1/devolutions/:id/comments
router.get('/:id/comments', devolutionController.getComments);

module.exports = router;
