/**
 * Middlewares de Autenticação e Autorização JWT
 */
const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/prisma');

/**
 * Verifica token JWT e injeta usuário na requisição
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Sessão expirada. Faça login novamente.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Token inválido.',
        code: 'TOKEN_INVALID',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        permissions: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Conta desativada. Entre em contato com o administrador.',
      });
    }

    // Adiciona usuário e suas permissões ao request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions.map(p => p.permission),
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica permissão específica - RBAC
 */
const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado.',
      });
    }

    const { role, permissions } = req.user;

    // Owner e Admin têm todas as permissões
    if (role === 'OWNER' || role === 'ADMIN') {
      return next();
    }

    // Verifica se tem alguma das permissões requeridas
    const hasPermission = requiredPermissions.some(
      perm => permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para realizar esta ação.',
        required: requiredPermissions,
      });
    }

    next();
  };
};

/**
 * Verifica se é pelo menos um dos roles especificados
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito. Perfil não autorizado.',
        required: roles,
      });
    }

    next();
  };
};

/**
 * Middleware opcional - não bloqueia se não houver token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { permissions: true },
    });
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions.map(p => p.permission),
      };
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, authorize, requireRole, optionalAuth };
