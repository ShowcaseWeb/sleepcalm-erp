const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, search } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const [items, total] = await Promise.all([
    prisma.carrier.findMany({ where, skip, take: l, orderBy: { name: 'asc' }, include: { _count: { select: { devolutions: true, lalamoveOrders: true } } } }),
    prisma.carrier.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getById = async (req, res) => {
  const c = await prisma.carrier.findUnique({ where: { id: req.params.id }, include: { _count: { select: { devolutions: true } } } });
  if (!c) return errorResponse(res, 'Transportadora não encontrada.', 404);
  return successResponse(res, c);
};

exports.create = async (req, res) => {
  const { name, cnpj, email, phone, website, trackingUrl, contactPerson, contractNumber, averageDeliveryDays, slaHours, costPerKg } = req.body;
  if (!name) return errorResponse(res, 'Nome é obrigatório.', 400);
  const c = await prisma.carrier.create({
    data: { name, cnpj, email, phone, website, trackingUrl, contactPerson, contractNumber, averageDeliveryDays: averageDeliveryDays ? parseInt(averageDeliveryDays) : null, slaHours: slaHours ? parseInt(slaHours) : null, costPerKg: costPerKg ? parseFloat(costPerKg) : null },
  });
  return successResponse(res, c, 'Transportadora criada.', 201);
};

exports.update = async (req, res) => {
  const c = await prisma.carrier.update({ where: { id: req.params.id }, data: req.body });
  return successResponse(res, c, 'Transportadora atualizada.');
};

exports.remove = async (req, res) => {
  await prisma.carrier.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Transportadora excluída.');
};
