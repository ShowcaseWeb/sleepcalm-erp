/**
 * Instância Singleton do Prisma Client
 */
const { PrismaClient } = require('@prisma/client');
const { logger } = require('./logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  errorFormat: 'pretty',
});

// Middleware de logging de queries lentas
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;

  if (duration > 1000) {
    logger.warn(`Query lenta detectada: ${params.model}.${params.action} - ${duration}ms`);
  }

  return result;
});

module.exports = { prisma };
