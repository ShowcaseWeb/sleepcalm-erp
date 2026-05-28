/**
 * Controller Financeiro
 */
const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const dayjs = require('dayjs');

exports.list = async (req, res) => {
  const { page, limit, devolutionId, type, approved, dateFrom, dateTo } = req.query;
  const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

  const where = {};
  if (devolutionId) where.devolutionId = devolutionId;
  if (type) where.type = type;
  if (approved !== undefined) where.approved = approved === 'true';
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        devolution: { select: { caseNumber: true, orderNumber: true, customer: { select: { name: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return paginatedResponse(res, records, buildPaginationMeta(total, pageNum, limitNum));
};

exports.getSummary = async (req, res) => {
  const { dateFrom, dateTo } = req.query;

  const where = {};
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const byType = await prisma.financialRecord.groupBy({
    by: ['type', 'isExpense'],
    where,
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalExpense = byType
    .filter(r => r.isExpense)
    .reduce((sum, r) => sum + parseFloat(r._sum.amount || 0), 0);

  const totalIncome = byType
    .filter(r => !r.isExpense)
    .reduce((sum, r) => sum + parseFloat(r._sum.amount || 0), 0);

  return successResponse(res, {
    byType: byType.map(r => ({
      type: r.type,
      isExpense: r.isExpense,
      total: parseFloat(r._sum.amount || 0),
      count: r._count.id,
    })),
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
  });
};

exports.getFlow = async (req, res) => {
  const { months = 6 } = req.query;
  const monthsNum = parseInt(months);

  const data = [];
  for (let i = monthsNum - 1; i >= 0; i--) {
    const start = dayjs().subtract(i, 'month').startOf('month').toDate();
    const end = dayjs().subtract(i, 'month').endOf('month').toDate();
    const label = dayjs().subtract(i, 'month').format('MMM/YY');

    const records = await prisma.financialRecord.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { amount: true, isExpense: true, type: true },
    });

    const expense = records.filter(r => r.isExpense).reduce((s, r) => s + parseFloat(r.amount), 0);
    const income = records.filter(r => !r.isExpense).reduce((s, r) => s + parseFloat(r.amount), 0);

    data.push({ month: label, expense, income, balance: income - expense });
  }

  return successResponse(res, data);
};

exports.getById = async (req, res) => {
  const record = await prisma.financialRecord.findUnique({
    where: { id: req.params.id },
    include: {
      devolution: { select: { caseNumber: true, customer: { select: { name: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!record) return errorResponse(res, 'Registro financeiro não encontrado.', 404);
  return successResponse(res, record);
};

exports.create = async (req, res) => {
  const { devolutionId, type, description, amount, isExpense, paymentMethod, paymentDate, notes } = req.body;

  if (!devolutionId || !type || !description || !amount) {
    return errorResponse(res, 'Devolução, tipo, descrição e valor são obrigatórios.', 400);
  }

  const record = await prisma.financialRecord.create({
    data: {
      devolutionId,
      createdById: req.user.id,
      type,
      description,
      amount: parseFloat(amount),
      isExpense: isExpense !== false,
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      notes,
    },
    include: {
      devolution: { select: { caseNumber: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return successResponse(res, record, 'Registro financeiro criado.', 201);
};

exports.approve = async (req, res) => {
  const record = await prisma.financialRecord.update({
    where: { id: req.params.id },
    data: {
      approved: true,
      approvedAt: new Date(),
      approvedById: req.user.id,
    },
  });
  return successResponse(res, record, 'Registro financeiro aprovado.');
};

exports.remove = async (req, res) => {
  await prisma.financialRecord.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Registro excluído.');
};
