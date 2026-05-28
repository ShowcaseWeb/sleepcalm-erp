const { prisma } = require('../utils/prisma');
const { successResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, userId, action, entity, dateFrom, dateTo } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip, take: l, orderBy: { createdAt: 'desc' } }),
    prisma.auditLog.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getSummary = async (req, res) => {
  const byAction = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const byEntity = await prisma.auditLog.groupBy({
    by: ['entity'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const recentLogins = await prisma.auditLog.findMany({
    where: { action: 'LOGIN', success: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return successResponse(res, { byAction, byEntity, recentLogins });
};
