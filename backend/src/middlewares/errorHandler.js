/**
 * Middleware de Tratamento de Erros Global
 */
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // Erros Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Registro duplicado. Este dado já existe no sistema.',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Registro não encontrado.',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: 'Referência inválida. Verifique os dados informados.',
    });
  }

  // Erros de validação
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: 'Dados inválidos.',
      errors: err.errors,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido. Faça login novamente.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Sessão expirada. Faça login novamente.',
    });
  }

  // Multer Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Arquivo muito grande. Tamanho máximo: 50MB.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Tipo de arquivo não permitido.',
    });
  }

  // Erro HTTP customizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Erro genérico
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor.'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
