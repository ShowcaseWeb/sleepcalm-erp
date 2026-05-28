/**
 * Controller do Dashboard Executivo
 */
const { prisma } = require('../utils/prisma');
const { successResponse } = require('../utils/response');
const dayjs = require('dayjs');

/**
 * KPIs principais do dashboard
 */
exports.getKPIs = async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  const where = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
  }

  const [
    totalDevolutions,
    openDevolutions,
    inAnalysis,
    finalized,
    cancelled,
    slaBreached,
    financialAgg,
    sacTickets,
    trocas,
    doacoes,
    lalamoveOrders,
  ] = await Promise.all([
    prisma.devolution.count({ where }),
    prisma.devolution.count({ where: { ...where, status: 'OPEN' } }),
    prisma.devolution.count({ where: { ...where, status: 'IN_ANALYSIS' } }),
    prisma.devolution.count({ where: { ...where, status: 'FINALIZED' } }),
    prisma.devolution.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.devolution.count({ where: { ...where, slaBreached: true, status: { notIn: ['FINALIZED', 'CANCELLED'] } } }),
    prisma.devolution.aggregate({
      where,
      _sum: {
        totalValue: true,
        refundAmount: true,
        recoveredAmount: true,
        logisticsCost: true,
      },
    }),
    prisma.devolution.count({ where: { ...where, status: 'OPEN' } }),
    prisma.devolution.count({ where: { ...where, type: 'EXCHANGE' } }),
    prisma.donation.count({ where }),
    prisma.lalamoveOrder.findMany({
      where,
      select: { finalPrice: true, status: true },
    }),
  ]);

  const totalRefunded = financialAgg._sum.refundAmount || 0;
  const totalRecovered = financialAgg._sum.recoveredAmount || 0;
  const totalLoss = (financialAgg._sum.totalValue || 0) - (financialAgg._sum.recoveredAmount || 0);
  const totalInTransport = lalamoveOrders
    .filter(o => ['ON_GOING', 'PICKED_UP', 'REQUESTED', 'ASSIGNING_DRIVER'].includes(o.status))
    .reduce((sum, o) => sum + (parseFloat(o.finalPrice || 0)), 0);

  const resolutionRate = totalDevolutions > 0
    ? Math.round((finalized / totalDevolutions) * 100)
    : 0;

  return successResponse(res, {
    totalDevolutions,
    openDevolutions,
    inAnalysis,
    finalized,
    cancelled,
    slaBreached,
    sacTicketsOpen: sacTickets,
    resolutionRate,
    totalRefunded: parseFloat(totalRefunded),
    totalRecovered: parseFloat(totalRecovered),
    totalLoss: parseFloat(totalLoss),
    totalInTransport,
    totalExchanges: trocas,
    totalDonations: doacoes,
    totalValue: parseFloat(financialAgg._sum.totalValue || 0),
  });
};

/**
 * Evolução mensal
 */
exports.getMonthlyEvolution = async (req, res) => {
  const { months = 12 } = req.query;
  const monthsNum = parseInt(months);

  const data = [];
  for (let i = monthsNum - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const label = dayjs().subtract(i, 'month').format('MMM/YY');

    const [created, finalized, totalValue] = await Promise.all([
      prisma.devolution.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.devolution.count({ where: { closedAt: { gte: start, lte: end } } }),
      prisma.devolution.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { totalValue: true },
      }),
    ]);

    data.push({
      month: label,
      created,
      finalized,
      totalValue: parseFloat(totalValue._sum.totalValue || 0),
    });
  }

  return successResponse(res, data);
};

/**
 * Motivos de devolução
 */
exports.getReasonDistribution = async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const where = {};
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const reasons = await prisma.devolution.groupBy({
    by: ['reasonCategory'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return successResponse(res, reasons.map(r => ({
    reason: r.reasonCategory,
    count: r._count.id,
  })));
};

/**
 * Top SKUs com mais devoluções
 */
exports.getTopSKUs = async (req, res) => {
  const { dateFrom, dateTo, limit = 10 } = req.query;

  const items = await prisma.devolutionItem.groupBy({
    by: ['skuCode', 'productName'],
    _count: { id: true },
    _sum: { totalValue: true, quantity: true },
    orderBy: { _count: { id: 'desc' } },
    take: parseInt(limit),
  });

  return successResponse(res, items.map(item => ({
    skuCode: item.skuCode,
    productName: item.productName,
    count: item._count.id,
    totalValue: parseFloat(item._sum.totalValue || 0),
    totalQuantity: item._sum.quantity || 0,
  })));
};

/**
 * Top Fornecedores
 */
exports.getTopSuppliers = async (req, res) => {
  const suppliers = await prisma.devolution.groupBy({
    by: ['supplierId'],
    where: { supplierId: { not: null } },
    _count: { id: true },
    _sum: { totalValue: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const enriched = await Promise.all(
    suppliers.map(async (s) => {
      const supplier = await prisma.supplier.findUnique({
        where: { id: s.supplierId },
        select: { name: true },
      });
      return {
        supplierId: s.supplierId,
        supplierName: supplier?.name || 'Desconhecido',
        count: s._count.id,
        totalValue: parseFloat(s._sum.totalValue || 0),
      };
    })
  );

  return successResponse(res, enriched);
};

/**
 * Top Transportadoras
 */
exports.getTopCarriers = async (req, res) => {
  const carriers = await prisma.devolution.groupBy({
    by: ['carrierId'],
    where: { carrierId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const enriched = await Promise.all(
    carriers.map(async (c) => {
      const carrier = await prisma.carrier.findUnique({
        where: { id: c.carrierId },
        select: { name: true },
      });
      return {
        carrierId: c.carrierId,
        carrierName: carrier?.name || 'Desconhecido',
        count: c._count.id,
      };
    })
  );

  return successResponse(res, enriched);
};

/**
 * Distribuição de status
 */
exports.getStatusDistribution = async (req, res) => {
  const statuses = await prisma.devolution.groupBy({
    by: ['status'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return successResponse(res, statuses.map(s => ({
    status: s.status,
    count: s._count.id,
  })));
};

/**
 * Distribuição por canal de venda
 */
exports.getChannelDistribution = async (req, res) => {
  const channels = await prisma.devolution.groupBy({
    by: ['saleChannel'],
    _count: { id: true },
    _sum: { totalValue: true },
    orderBy: { _count: { id: 'desc' } },
  });

  return successResponse(res, channels.map(c => ({
    channel: c.saleChannel,
    count: c._count.id,
    totalValue: parseFloat(c._sum.totalValue || 0),
  })));
};

/**
 * SLA Performance
 */
exports.getSLAPerformance = async (req, res) => {
  const [total, breached, onTime] = await Promise.all([
    prisma.devolution.count({ where: { status: { notIn: ['CANCELLED'] } } }),
    prisma.devolution.count({ where: { slaBreached: true } }),
    prisma.devolution.count({ where: { slaBreached: false, status: 'FINALIZED' } }),
  ]);

  const slaRate = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

  return successResponse(res, {
    total,
    breached,
    onTime,
    slaRate,
    slaBreachRate: 100 - slaRate,
  });
};

/**
 * Prejuízo mensal
 */
exports.getMonthlyLoss = async (req, res) => {
  const { months = 6 } = req.query;
  const monthsNum = parseInt(months);

  const data = [];
  for (let i = monthsNum - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const label = dayjs().subtract(i, 'month').format('MMM/YY');

    const agg = await prisma.devolution.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _sum: { totalValue: true, recoveredAmount: true, refundAmount: true, logisticsCost: true },
    });

    const totalVal = parseFloat(agg._sum.totalValue || 0);
    const recovered = parseFloat(agg._sum.recoveredAmount || 0);
    const refund = parseFloat(agg._sum.refundAmount || 0);
    const logistics = parseFloat(agg._sum.logisticsCost || 0);

    data.push({
      month: label,
      totalValue: totalVal,
      recovered,
      refund,
      logistics,
      loss: totalVal - recovered + logistics,
    });
  }

  return successResponse(res, data);
};

/**
 * Performance operacional por responsável
 */
exports.getOperationalPerformance = async (req, res) => {
  const analysts = await prisma.devolution.groupBy({
    by: ['assignedToId'],
    where: { assignedToId: { not: null } },
    _count: { id: true },
  });

  const enriched = await Promise.all(
    analysts.map(async (a) => {
      const user = await prisma.user.findUnique({
        where: { id: a.assignedToId },
        select: { name: true, avatar: true },
      });
      const [finalized, slaBreached] = await Promise.all([
        prisma.devolution.count({ where: { assignedToId: a.assignedToId, status: 'FINALIZED' } }),
        prisma.devolution.count({ where: { assignedToId: a.assignedToId, slaBreached: true } }),
      ]);
      return {
        userId: a.assignedToId,
        name: user?.name || 'Desconhecido',
        avatar: user?.avatar,
        total: a._count.id,
        finalized,
        slaBreached,
        resolutionRate: a._count.id > 0 ? Math.round((finalized / a._count.id) * 100) : 0,
      };
    })
  );

  return successResponse(res, enriched.sort((a, b) => b.total - a.total));
};

/**
 * Dados completos do dashboard (single request)
 */
exports.getDashboardFull = async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  const [kpis, monthly, reasons, topSKUs, statusDist, channelDist] = await Promise.all([
    getKPIsData(dateFrom, dateTo),
    getMonthlyData(6),
    getReasonsData(),
    getTopSKUsData(8),
    getStatusData(),
    getChannelData(),
  ]);

  return successResponse(res, {
    kpis,
    monthly,
    reasons,
    topSKUs,
    statusDistribution: statusDist,
    channelDistribution: channelDist,
  });
};

// Helpers internos
async function getKPIsData(dateFrom, dateTo) {
  const where = {};
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const [total, open, inAnalysis, finalized, slaBreached, agg] = await Promise.all([
    prisma.devolution.count({ where }),
    prisma.devolution.count({ where: { ...where, status: 'OPEN' } }),
    prisma.devolution.count({ where: { ...where, status: 'IN_ANALYSIS' } }),
    prisma.devolution.count({ where: { ...where, status: 'FINALIZED' } }),
    prisma.devolution.count({ where: { ...where, slaBreached: true, status: { notIn: ['FINALIZED', 'CANCELLED'] } } }),
    prisma.devolution.aggregate({ where, _sum: { totalValue: true, refundAmount: true, recoveredAmount: true } }),
  ]);

  return {
    totalDevolutions: total,
    openDevolutions: open,
    inAnalysis,
    finalized,
    slaBreached,
    totalValue: parseFloat(agg._sum.totalValue || 0),
    totalRefunded: parseFloat(agg._sum.refundAmount || 0),
    totalRecovered: parseFloat(agg._sum.recoveredAmount || 0),
    resolutionRate: total > 0 ? Math.round((finalized / total) * 100) : 0,
  };
}

async function getMonthlyData(months) {
  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const count = await prisma.devolution.count({ where: { createdAt: { gte: start, lte: end } } });
    data.push({ month: dayjs().subtract(i, 'month').format('MMM/YY'), count });
  }
  return data;
}

async function getReasonsData() {
  return prisma.devolution.groupBy({
    by: ['reasonCategory'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 8,
  });
}

async function getTopSKUsData(limit) {
  return prisma.devolutionItem.groupBy({
    by: ['skuCode', 'productName'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });
}

async function getStatusData() {
  return prisma.devolution.groupBy({
    by: ['status'],
    _count: { id: true },
  });
}

async function getChannelData() {
  return prisma.devolution.groupBy({
    by: ['saleChannel'],
    _count: { id: true },
  });
}
