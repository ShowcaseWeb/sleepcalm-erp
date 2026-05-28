const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, search } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { cnpj: { contains: search } }] } : {};
  const [items, total] = await Promise.all([
    prisma.supplier.findMany({ where, skip, take: l, orderBy: { name: 'asc' }, include: { _count: { select: { skus: true, devolutions: true } } } }),
    prisma.supplier.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getById = async (req, res) => {
  const s = await prisma.supplier.findUnique({ where: { id: req.params.id }, include: { skus: true, _count: { select: { devolutions: true } } } });
  if (!s) return errorResponse(res, 'Fornecedor não encontrado.', 404);
  return successResponse(res, s);
};

exports.create = async (req, res) => {
  const { name, tradeName, cnpj, email, phone, address, city, state, zipCode, contactPerson, notes } = req.body;
  if (!name) return errorResponse(res, 'Nome é obrigatório.', 400);
  const s = await prisma.supplier.create({ data: { name, tradeName, cnpj, email, phone, address, city, state, zipCode, contactPerson, notes } });
  return successResponse(res, s, 'Fornecedor criado.', 201);
};

exports.update = async (req, res) => {
  const s = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
  return successResponse(res, s, 'Fornecedor atualizado.');
};

exports.remove = async (req, res) => {
  await prisma.supplier.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Fornecedor excluído.');
};
