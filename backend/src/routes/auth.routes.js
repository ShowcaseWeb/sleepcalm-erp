/**
 * Rotas de Autenticação
 */
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getMe);

// PATCH /api/v1/auth/me
router.patch('/me', authenticate, authController.updateProfile);

// PATCH /api/v1/auth/change-password
router.patch('/change-password', authenticate, authController.changePassword);

module.exports = router;
