/**
 * Controller de Devoluções - Core do Sistema
 */
const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { generateCaseNumber } = require('../utils/caseNumber');
const dayjs = require('dayjs');

/**
 * Lista devoluções com filtros avançados
 */
exports.list = async (req, res) => {
  const {
    page, limit, search, status, type, priority, channel,
    supplierId, carrierId, assignedToId, slaBreached,
    dateFrom, dateTo, skuCode, customerId,
  } = req.query;

  const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

  const where = {};

  if (search) {
    where.OR = [
      { caseNumber: { contains: search, mode: 'insensitive' } },
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { email: { contains: search, mode: 'insensitive' } } },
      { items: { some: { skuCode: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (channel) where.saleChannel = channel;
  if (supplierId) where.supplierId = supplierId;
  if (carrierId) where.carrierId = carrierId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (slaBreached === 'true') where.slaBreached = true;
  if (customerId) where.customerId = customerId;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
  }

  // Verifica SLA breaches automaticamente
  await prisma.devolution.updateMany({
    where: {
      slaBreached: false,
      slaDueDate: { lt: new Date() },
      status: { notIn: ['FINALIZED', 'CANCELLED'] },
    },
    data: { slaBreached: true },
  });

  const [devolutions, total] = await Promise.all([
    prisma.devolution.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [
        { priority: 'desc' },
        { slaBreached: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        assignedTo: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        carrier: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
    }),
    prisma.devolution.count({ where }),
  ]);

  return paginatedResponse(
    res,
    devolutions,
    buildPaginationMeta(total, pageNum, limitNum)
  );
};

/**
 * Obtém devolução por ID com todos os detalhes
 */
exports.getById = async (req, res) => {
  const { id } = req.params;

  const devolution = await prisma.devolution.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { sku: true } },
      assignedTo: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      carrier: true,
      supplier: true,
      attachments: { orderBy: { createdAt: 'desc' } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
      },
      financialRecords: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
      technicalAnalysis: {
        include: {
          analyst: { select: { id: true, name: true, avatar: true } },
          attachments: true,
        },
      },
      fiscalDocuments: { orderBy: { createdAt: 'desc' } },
      lalamoveOrders: { orderBy: { createdAt: 'desc' } },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
      donation: {
        include: {
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!devolution) {
    return errorResponse(res, 'Devolução não encontrada.', 404);
  }

  return successResponse(res, devolution);
};

/**
 * Cria nova devolução
 */
exports.create = async (req, res) => {
  const {
    // Cliente
    customerId, customerName, customerEmail, customerPhone, customerCpf,
    // Pedido
    orderNumber, saleChannel, orderDate,
    // Tipo e Status
    type, priority,
    // Motivo
    reasonCategory, reasonDetail, customerDescription,
    // Fornecedor/Transportadora
    supplierId, carrierId, trackingCode,
    // SLA
    slaHours,
    // Responsável
    assignedToId,
    // Items
    items,
    // Notas
    internalNotes,
  } = req.body;

  if (!orderNumber || !type || !reasonCategory || !saleChannel) {
    return errorResponse(res, 'Campos obrigatórios: número do pedido, tipo, motivo e canal de venda.', 400);
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse(res, 'Pelo menos um item é obrigatório.', 400);
  }

  // Cria ou encontra cliente
  let customer;
  if (customerId) {
    customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return errorResponse(res, 'Cliente não encontrado.', 404);
    }
  } else {
    if (!customerName) {
      return errorResponse(res, 'Nome do cliente é obrigatório.', 400);
    }
    // Busca por CPF ou cria novo
    customer = await prisma.customer.upsert({
      where: { cpf: customerCpf || `temp_${Date.now()}` },
      update: { name: customerName, email: customerEmail, phone: customerPhone },
      create: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        cpf: customerCpf,
      },
    });
  }

  const caseNumber = await generateCaseNumber();
  const slaHoursVal = parseInt(slaHours || '72');
  const slaDueDate = dayjs().add(slaHoursVal, 'hour').toDate();

  // Calcula valor total
  const totalValue = items.reduce((sum, item) => {
    return sum + (parseFloat(item.unitValue || 0) * parseInt(item.quantity || 1));
  }, 0);

  const devolution = await prisma.devolution.create({
    data: {
      caseNumber,
      customerId: customer.id,
      orderNumber,
      saleChannel,
      orderDate: orderDate ? new Date(orderDate) : null,
      type,
      status: 'OPEN',
      priority: priority || 'MEDIUM',
      reasonCategory,
      reasonDetail,
      customerDescription,
      supplierId: supplierId || null,
      carrierId: carrierId || null,
      trackingCode,
      slaHours: slaHoursVal,
      slaDueDate,
      assignedToId: assignedToId || null,
      createdById: req.user.id,
      totalValue,
      internalNotes,
      items: {
        create: items.map(item => ({
          skuId: item.skuId || null,
          skuCode: item.skuCode,
          productName: item.productName,
          quantity: parseInt(item.quantity),
          unitValue: parseFloat(item.unitValue),
          totalValue: parseFloat(item.unitValue) * parseInt(item.quantity),
          condition: item.condition,
          notes: item.notes,
        })),
      },
      statusHistory: {
        create: {
          toStatus: 'OPEN',
          changedById: req.user.id,
          changedByName: req.user.name,
          reason: 'Devolução criada',
        },
      },
    },
    include: {
      customer: true,
      items: true,
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Atualiza contador do cliente
  await prisma.customer.update({
    where: { id: customer.id },
    data: { totalOrders: { increment: 1 } },
  });

  return successResponse(res, devolution, 'Devolução criada com sucesso.', 201);
};

/**
 * Atualiza devolução
 */
exports.update = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.devolution.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse(res, 'Devolução não encontrada.', 404);
  }

  const {
    type, priority, reasonCategory, reasonDetail, customerDescription,
    supplierId, carrierId, trackingCode, slaHours, assignedToId,
    internalNotes, finalConclusion, refundAmount, recoveredAmount, logisticsCost,
    receivedAt, inspectedAt, resolvedAt,
  } = req.body;

  const devolution = await prisma.devolution.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(priority && { priority }),
      ...(reasonCategory && { reasonCategory }),
      ...(reasonDetail !== undefined && { reasonDetail }),
      ...(customerDescription !== undefined && { customerDescription }),
      ...(supplierId !== undefined && { supplierId }),
      ...(carrierId !== undefined && { carrierId }),
      ...(trackingCode !== undefined && { trackingCode }),
      ...(slaHours && { slaHours: parseInt(slaHours), slaDueDate: dayjs().add(parseInt(slaHours), 'hour').toDate() }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(internalNotes !== undefined && { internalNotes }),
      ...(finalConclusion !== undefined && { finalConclusion }),
      ...(refundAmount !== undefined && { refundAmount: parseFloat(refundAmount) }),
      ...(recoveredAmount !== undefined && { recoveredAmount: parseFloat(recoveredAmount) }),
      ...(logisticsCost !== undefined && { logisticsCost: parseFloat(logisticsCost) }),
      ...(receivedAt && { receivedAt: new Date(receivedAt) }),
      ...(inspectedAt && { inspectedAt: new Date(inspectedAt) }),
      ...(resolvedAt && { resolvedAt: new Date(resolvedAt) }),
    },
    include: {
      customer: true,
      items: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return successResponse(res, devolution, 'Devolução atualizada com sucesso.');
};

/**
 * Atualiza status da devolução
 */
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason, notes } = req.body;

  if (!status) {
    return errorResponse(res, 'Novo status é obrigatório.', 400);
  }

  const existing = await prisma.devolution.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse(res, 'Devolução não encontrada.', 404);
  }

  if (['FINALIZED', 'CANCELLED'].includes(existing.status)) {
    return errorResponse(res, `Não é possível alterar uma devolução ${existing.status === 'FINALIZED' ? 'finalizada' : 'cancelada'}.`, 400);
  }

  const updateData = {
    status,
    ...(status === 'FINALIZED' && { closedAt: new Date(), resolvedAt: new Date() }),
    ...(status === 'RECEIVED' && { receivedAt: new Date() }),
    ...(status === 'IN_INSPECTION' && { inspectedAt: new Date() }),
    statusHistory: {
      create: {
        fromStatus: existing.status,
        toStatus: status,
        changedById: req.user.id,
        changedByName: req.user.name,
        reason,
        notes,
      },
    },
  };

  const devolution = await prisma.devolution.update({
    where: { id },
    data: updateData,
    include: { customer: true, items: true },
  });

  // Notificação para o responsável
  if (devolution.assignedToId && devolution.assignedToId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: devolution.assignedToId,
        sentById: req.user.id,
        type: 'STATUS_CHANGE',
        title: 'Status de devolução atualizado',
        message: `Caso ${devolution.caseNumber} alterado para ${status}.`,
        devolutionId: id,
        data: { caseNumber: devolution.caseNumber, status, changedBy: req.user.name },
      },
    });
  }

  return successResponse(res, devolution, 'Status atualizado com sucesso.');
};

/**
 * Atribui responsável
 */
exports.assign = async (req, res) => {
  const { id } = req.params;
  const { assignedToId } = req.body;

  const devolution = await prisma.devolution.update({
    where: { id },
    data: { assignedToId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (assignedToId) {
    await prisma.notification.create({
      data: {
        userId: assignedToId,
        sentById: req.user.id,
        type: 'ASSIGNMENT',
        title: 'Devolução atribuída a você',
        message: `O caso ${devolution.caseNumber} foi atribuído a você.`,
        devolutionId: id,
        data: { caseNumber: devolution.caseNumber },
      },
    });
  }

  return successResponse(res, devolution, 'Responsável atribuído com sucesso.');
};

/**
 * Remove devolução (apenas admin/owner)
 */
exports.remove = async (req, res) => {
  const { id } = req.params;

  if (!['OWNER', 'ADMIN'].includes(req.user.role)) {
    return errorResponse(res, 'Apenas administradores podem excluir devoluções.', 403);
  }

  const existing = await prisma.devolution.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse(res, 'Devolução não encontrada.', 404);
  }

  await prisma.devolution.delete({ where: { id } });

  return successResponse(res, null, 'Devolução excluída com sucesso.');
};

/**
 * Timeline completa da devolução
 */
exports.getTimeline = async (req, res) => {
  const { id } = req.params;

  const [statusHistory, comments, financialRecords, attachments] = await Promise.all([
    prisma.statusHistory.findMany({
      where: { devolutionId: id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.comment.findMany({
      where: { devolutionId: id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    }),
    prisma.financialRecord.findMany({
      where: { devolutionId: id },
      orderBy: { createdAt: 'asc' },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.attachment.findMany({
      where: { devolutionId: id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Monta timeline unificada e ordenada
  const timeline = [
    ...statusHistory.map(s => ({ ...s, _type: 'STATUS' })),
    ...comments.map(c => ({ ...c, _type: 'COMMENT' })),
    ...financialRecords.map(f => ({ ...f, _type: 'FINANCIAL' })),
    ...attachments.map(a => ({ ...a, _type: 'ATTACHMENT' })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return successResponse(res, timeline);
};

/**
 * Adiciona comentário
 */
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { content, isInternal, mentions } = req.body;

  if (!content?.trim()) {
    return errorResponse(res, 'Conteúdo do comentário é obrigatório.', 400);
  }

  const comment = await prisma.comment.create({
    data: {
      devolutionId: id,
      userId: req.user.id,
      content: content.trim(),
      isInternal: isInternal !== false,
      mentions: mentions || [],
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
  });

  // Notifica mencionados
  if (mentions && mentions.length > 0) {
    const mentionNotifications = mentions.map(mentionedId => ({
      userId: mentionedId,
      sentById: req.user.id,
      type: 'MENTION',
      title: 'Você foi mencionado',
      message: `${req.user.name} mencionou você em um comentário.`,
      devolutionId: id,
    }));

    await prisma.notification.createMany({ data: mentionNotifications });
  }

  return successResponse(res, comment, 'Comentário adicionado.', 201);
};

/**
 * Lista comentários
 */
exports.getComments = async (req, res) => {
  const { id } = req.params;

  const comments = await prisma.comment.findMany({
    where: { devolutionId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
  });

  return successResponse(res, comments);
};

/**
 * Estatísticas rápidas
 */
exports.getStats = async (req, res) => {
  const [total, open, inAnalysis, finalized, slaBreached] = await Promise.all([
    prisma.devolution.count(),
    prisma.devolution.count({ where: { status: 'OPEN' } }),
    prisma.devolution.count({ where: { status: 'IN_ANALYSIS' } }),
    prisma.devolution.count({ where: { status: 'FINALIZED' } }),
    prisma.devolution.count({ where: { slaBreached: true, status: { notIn: ['FINALIZED', 'CANCELLED'] } } }),
  ]);

  return successResponse(res, { total, open, inAnalysis, finalized, slaBreached });
};
