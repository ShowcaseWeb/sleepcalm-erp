/**
 * Controller Lalamove - Logística
 */
const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { logger } = require('../utils/logger');

exports.list = async (req, res) => {
  const { page, limit, status, devolutionId } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = {};
  if (status) where.status = status;
  if (devolutionId) where.devolutionId = devolutionId;

  const [items, total] = await Promise.all([
    prisma.lalamoveOrder.findMany({
      where,
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        devolution: { select: { caseNumber: true, orderNumber: true, customer: { select: { name: true } } } },
        requestedBy: { select: { id: true, name: true } },
        carrier: { select: { id: true, name: true } },
      },
    }),
    prisma.lalamoveOrder.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getStats = async (req, res) => {
  const [total, pending, ongoing, completed, cancelled, totalCost] = await Promise.all([
    prisma.lalamoveOrder.count(),
    prisma.lalamoveOrder.count({ where: { status: 'PENDING' } }),
    prisma.lalamoveOrder.count({ where: { status: { in: ['ON_GOING', 'PICKED_UP', 'ASSIGNING_DRIVER'] } } }),
    prisma.lalamoveOrder.count({ where: { status: 'COMPLETED' } }),
    prisma.lalamoveOrder.count({ where: { status: 'CANCELLED' } }),
    prisma.lalamoveOrder.aggregate({ _sum: { finalPrice: true } }),
  ]);

  return successResponse(res, {
    total,
    pending,
    ongoing,
    completed,
    cancelled,
    totalCost: parseFloat(totalCost._sum.finalPrice || 0),
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  });
};

exports.getById = async (req, res) => {
  const order = await prisma.lalamoveOrder.findUnique({
    where: { id: req.params.id },
    include: {
      devolution: { include: { customer: true, items: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
      carrier: true,
    },
  });
  if (!order) return errorResponse(res, 'Pedido Lalamove não encontrado.', 404);
  return successResponse(res, order);
};

exports.create = async (req, res) => {
  const {
    devolutionId, carrierId, pickupAddress, pickupContact, pickupPhone, pickupNotes,
    deliveryAddress, deliveryContact, deliveryPhone, deliveryNotes,
    vehicleType, scheduledAt, quotedPrice, notes,
  } = req.body;

  if (!devolutionId || !pickupAddress || !deliveryAddress || !pickupContact || !deliveryContact) {
    return errorResponse(res, 'Devolução, endereços e contatos são obrigatórios.', 400);
  }

  const order = await prisma.lalamoveOrder.create({
    data: {
      devolutionId,
      carrierId,
      requestedById: req.user.id,
      status: 'PENDING',
      pickupAddress,
      pickupContact,
      pickupPhone: pickupPhone || '',
      pickupNotes,
      deliveryAddress,
      deliveryContact,
      deliveryPhone: deliveryPhone || '',
      deliveryNotes,
      vehicleType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
      notes,
    },
    include: {
      devolution: { select: { caseNumber: true } },
      requestedBy: { select: { id: true, name: true } },
    },
  });

  // Integração real com Lalamove API (quando as credenciais estiverem configuradas)
  if (process.env.LALAMOVE_API_KEY) {
    logger.info(`Integrando com API Lalamove para pedido: ${order.id}`);
    // TODO: Implementar integração real com API Lalamove
  }

  return successResponse(res, order, 'Pedido Lalamove criado.', 201);
};

exports.updateStatus = async (req, res) => {
  const { status, driverName, driverPhone, driverPlate, finalPrice, lalamoveOrderId } = req.body;
  
  const order = await prisma.lalamoveOrder.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(driverName !== undefined && { driverName }),
      ...(driverPhone !== undefined && { driverPhone }),
      ...(driverPlate !== undefined && { driverPlate }),
      ...(finalPrice !== undefined && { finalPrice: parseFloat(finalPrice) }),
      ...(lalamoveOrderId && { lalamoveOrderId }),
      ...(status === 'PICKED_UP' && { pickedUpAt: new Date() }),
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
    },
  });
  return successResponse(res, order, 'Status atualizado.');
};

exports.remove = async (req, res) => {
  const order = await prisma.lalamoveOrder.findUnique({ where: { id: req.params.id } });
  if (!order) return errorResponse(res, 'Pedido não encontrado.', 404);
  if (['ON_GOING', 'PICKED_UP'].includes(order.status)) {
    return errorResponse(res, 'Não é possível excluir um pedido em andamento.', 400);
  }
  await prisma.lalamoveOrder.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Pedido excluído.');
};
