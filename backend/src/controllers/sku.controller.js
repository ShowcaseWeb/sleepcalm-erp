/**
 * Controller de SKUs
 */
const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, search, category, supplierId, isActive } = req.query;
  const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

  const where = {};
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;
  if (supplierId) where.supplierId = supplierId;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [skus, total] = await Promise.all([
    prisma.sKU.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { code: 'asc' },
      include: { supplier: { select: { id: true, name: true } } },
    }),
    prisma.sKU.count({ where }),
  ]);

  return paginatedResponse(res, skus, buildPaginationMeta(total, pageNum, limitNum));
};

exports.search = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return successResponse(res, []);

  const skus = await prisma.sKU.findMany({
    where: {
      isActive: true,
      OR: [
        { code: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 20,
    select: { id: true, code: true, name: true, unitValue: true, category: true },
  });

  return successResponse(res, skus);
};

exports.getById = async (req, res) => {
  const sku = await prisma.sKU.findUnique({
    where: { id: req.params.id },
    include: {
      supplier: true,
      _count: { select: { devolutionItems: true } },
    },
  });
  if (!sku) return errorResponse(res, 'SKU não encontrado.', 404);
  return successResponse(res, sku);
};

exports.create = async (req, res) => {
  const { code, name, description, category, unitValue, weight, dimensions, supplierId } = req.body;
  if (!code || !name || !unitValue) {
    return errorResponse(res, 'Código, nome e valor unitário são obrigatórios.', 400);
  }

  const sku = await prisma.sKU.create({
    data: { code, name, description, category, unitValue: parseFloat(unitValue), weight: weight ? parseFloat(weight) : null, dimensions, supplierId },
  });
  return successResponse(res, sku, 'SKU criado com sucesso.', 201);
};

exports.update = async (req, res) => {
  const { code, name, description, category, unitValue, weight, dimensions, supplierId, isActive } = req.body;
  const sku = await prisma.sKU.update({
    where: { id: req.params.id },
    data: {
      ...(code && { code }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(unitValue && { unitValue: parseFloat(unitValue) }),
      ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
      ...(dimensions !== undefined && { dimensions }),
      ...(supplierId !== undefined && { supplierId }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  return successResponse(res, sku, 'SKU atualizado.');
};

exports.remove = async (req, res) => {
  await prisma.sKU.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'SKU excluído.');
};
