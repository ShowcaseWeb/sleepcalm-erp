const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, search } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { cpf: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    prisma.customer.findMany({ where, skip, take: l, orderBy: { name: 'asc' }, include: { _count: { select: { devolutions: true } } } }),
    prisma.customer.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getById = async (req, res) => {
  const c = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { devolutions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!c) return errorResponse(res, 'Cliente não encontrado.', 404);
  return successResponse(res, c);
};

exports.create = async (req, res) => {
  const { name, email, phone, cpf, address, city, state, zipCode } = req.body;
  if (!name) return errorResponse(res, 'Nome é obrigatório.', 400);
  const c = await prisma.customer.create({ data: { name, email, phone, cpf, address, city, state, zipCode } });
  return successResponse(res, c, 'Cliente criado.', 201);
};

exports.update = async (req, res) => {
  const c = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
  return successResponse(res, c, 'Cliente atualizado.');
};
