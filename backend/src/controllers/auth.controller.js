/**
 * Controller de Autenticação
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { logger } = require('../utils/logger');

/**
 * Gera tokens JWT
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'E-mail e senha são obrigatórios.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { permissions: true },
  });

  if (!user) {
    // Audit log de tentativa falha
    await prisma.auditLog.create({
      data: {
        userEmail: email,
        action: 'LOGIN',
        entity: 'User',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: '/auth/login',
        method: 'POST',
        success: false,
        errorMsg: 'Usuário não encontrado',
      },
    });
    return errorResponse(res, 'E-mail ou senha inválidos.', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Conta desativada. Entre em contato com o administrador.', 403);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: '/auth/login',
        method: 'POST',
        success: false,
        errorMsg: 'Senha incorreta',
      },
    });
    return errorResponse(res, 'E-mail ou senha inválidos.', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  // Atualiza refresh token e last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: '/auth/login',
      method: 'POST',
      success: true,
    },
  });

  logger.info(`Login bem-sucedido: ${user.email} (${user.role})`);

  return successResponse(res, {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      permissions: user.permissions.map(p => p.permission),
    },
  }, 'Login realizado com sucesso.');
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user.id,
      ip: req.ip,
      success: true,
    },
  });

  return successResponse(res, null, 'Logout realizado com sucesso.');
};

/**
 * Refresh Token
 */
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorResponse(res, 'Refresh token não fornecido.', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return errorResponse(res, 'Refresh token inválido ou expirado.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || user.refreshToken !== refreshToken) {
    return errorResponse(res, 'Refresh token inválido.', 401);
  }

  const tokens = generateTokens(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return successResponse(res, tokens, 'Token renovado com sucesso.');
};

/**
 * Esqueci minha senha
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return errorResponse(res, 'E-mail é obrigatório.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Sempre retorna sucesso para não expor existência de e-mail
  if (!user) {
    return successResponse(res, null, 'Se o e-mail existir, você receberá as instruções de recuperação.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    },
  });

  // TODO: Enviar e-mail com link de recuperação
  logger.info(`Token de recuperação gerado para ${user.email}: ${resetToken}`);

  return successResponse(res, null, 'Se o e-mail existir, você receberá as instruções de recuperação.');
};

/**
 * Reset de senha
 */
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return errorResponse(res, 'Token e nova senha são obrigatórios.', 400);
  }

  if (password.length < 8) {
    return errorResponse(res, 'Senha deve ter pelo menos 8 caracteres.', 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return errorResponse(res, 'Token inválido ou expirado.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
    },
  });

  return successResponse(res, null, 'Senha redefinida com sucesso. Faça login.');
};

/**
 * Obtém perfil atual
 */
exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      permissions: true,
      _count: {
        select: {
          devolutionsCreated: true,
          devolutionsAssigned: true,
        },
      },
    },
  });

  if (!user) {
    return errorResponse(res, 'Usuário não encontrado.', 404);
  }

  const { password, refreshToken, passwordResetToken, ...userSafe } = user;

  return successResponse(res, userSafe);
};

/**
 * Atualiza perfil
 */
exports.updateProfile = async (req, res) => {
  const { name, phone, department, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(department !== undefined && { department }),
      ...(avatar !== undefined && { avatar }),
    },
  });

  const { password, refreshToken, ...userSafe } = user;
  return successResponse(res, userSafe, 'Perfil atualizado com sucesso.');
};

/**
 * Altera senha
 */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Senha atual e nova senha são obrigatórias.', 400);
  }

  if (newPassword.length < 8) {
    return errorResponse(res, 'Nova senha deve ter pelo menos 8 caracteres.', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return errorResponse(res, 'Senha atual incorreta.', 400);
  }

  const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashed, refreshToken: null },
  });

  return successResponse(res, null, 'Senha alterada com sucesso.');
};
