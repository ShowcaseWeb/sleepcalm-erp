/**
 * Middleware de Auditoria - Registra todas as ações no sistema
 */
const { prisma } = require('../utils/prisma');
const { logger } = require('../utils/logger');

const auditMiddleware = (entity, action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const startTime = Date.now();

    res.json = function (data) {
      // Registra auditoria apenas em sucesso
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userRole: req.user.role,
            action,
            entity,
            entityId: req.params.id || data?.data?.id || null,
            newValues: req.method !== 'GET' ? (req.body || null) : null,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            endpoint: req.originalUrl,
            method: req.method,
            success: true,
          },
        }).catch(err => logger.error('Erro ao registrar auditoria:', err));
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = { auditMiddleware };
