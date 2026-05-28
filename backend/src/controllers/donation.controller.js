const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, status } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        devolution: { select: { caseNumber: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.donation.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getById = async (req, res) => {
  const d = await prisma.donation.findUnique({
    where: { id: req.params.id },
    include: {
      devolution: { include: { customer: true, items: true } },
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });
  if (!d) return errorResponse(res, 'Doação não encontrada.', 404);
  return successResponse(res, d);
};

exports.create = async (req, res) => {
  const { devolutionId, institution, institutionContact, institutionPhone, products, estimatedValue, reason, notes } = req.body;
  if (!institution || !products || !estimatedValue) {
    return errorResponse(res, 'Instituição, produtos e valor estimado são obrigatórios.', 400);
  }

  const donation = await prisma.donation.create({
    data: {
      devolutionId,
      createdById: req.user.id,
      institution,
      institutionContact,
      institutionPhone,
      products: products || [],
      estimatedValue: parseFloat(estimatedValue),
      status: 'PENDING',
      reason,
      notes,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  return successResponse(res, donation, 'Doação registrada.', 201);
};

exports.approve = async (req, res) => {
  const { approved, notes } = req.body;
  const donation = await prisma.donation.update({
    where: { id: req.params.id },
    data: {
      status: approved ? 'APPROVED' : 'CANCELLED',
      approvedById: req.user.id,
      approvedAt: new Date(),
      notes,
    },
  });
  return successResponse(res, donation, `Doação ${approved ? 'aprovada' : 'cancelada'}.`);
};

exports.update = async (req, res) => {
  const { institution, institutionContact, institutionPhone, products, estimatedValue, status, deliveredAt, proofDocument, notes } = req.body;
  const donation = await prisma.donation.update({
    where: { id: req.params.id },
    data: {
      ...(institution && { institution }),
      ...(institutionContact !== undefined && { institutionContact }),
      ...(institutionPhone !== undefined && { institutionPhone }),
      ...(products && { products }),
      ...(estimatedValue !== undefined && { estimatedValue: parseFloat(estimatedValue) }),
      ...(status && { status }),
      ...(deliveredAt && { deliveredAt: new Date(deliveredAt) }),
      ...(proofDocument !== undefined && { proofDocument }),
      ...(notes !== undefined && { notes }),
    },
  });
  return successResponse(res, donation, 'Doação atualizada.');
};
