const { prisma } = require('../utils/prisma');
const { successResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, isRead } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = { userId: req.user.id };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: l, orderBy: { createdAt: 'desc' }, include: { sentBy: { select: { id: true, name: true, avatar: true } } } }),
    prisma.notification.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.unreadCount = async (req, res) => {
  const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  return successResponse(res, { count });
};

exports.markRead = async (req, res) => {
  const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true, readAt: new Date() } });
  return successResponse(res, n, 'Marcada como lida.');
};

exports.markAllRead = async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true, readAt: new Date() } });
  return successResponse(res, null, 'Todas marcadas como lidas.');
};

exports.remove = async (req, res) => {
  await prisma.notification.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Notificação excluída.');
};
