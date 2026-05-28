const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { getFileUrl } = require('../middlewares/upload');

// Lista todos os documentos fiscais (com filtros opcionais)
exports.listAll = async (req, res) => {
  const { devolutionId, type, page = 1, limit = 20 } = req.query;
  const where = {};
  if (devolutionId) where.devolutionId = devolutionId;
  if (type) where.type = type;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [docs, total] = await Promise.all([
    prisma.fiscalDocument.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { devolution: { select: { caseNumber: true, orderNumber: true } } },
    }),
    prisma.fiscalDocument.count({ where }),
  ]);
  return successResponse(res, { data: docs, total, page: parseInt(page), limit: parseInt(limit) });
};

// Lista documentos de uma devolução específica
exports.list = async (req, res) => {
  const docs = await prisma.fiscalDocument.findMany({ where: { devolutionId: req.params.devolutionId }, orderBy: { createdAt: 'desc' } });
  return successResponse(res, docs);
};

// Busca documento por ID
exports.getById = async (req, res) => {
  const doc = await prisma.fiscalDocument.findUnique({
    where: { id: req.params.id },
    include: { devolution: { select: { caseNumber: true, orderNumber: true, customer: true } } },
  });
  if (!doc) return errorResponse(res, 'Documento fiscal não encontrado.', 404);
  return successResponse(res, doc);
};

exports.upload = async (req, res) => {
  const { devolutionId } = req.params;
  const { type, number, series, issueDate, value } = req.body;

  if (!type) return errorResponse(res, 'Tipo do documento é obrigatório.', 400);

  const doc = await prisma.fiscalDocument.create({
    data: {
      devolutionId,
      type,
      number,
      series,
      issueDate: issueDate ? new Date(issueDate) : null,
      value: value ? parseFloat(value) : null,
      filename: req.file?.filename,
      originalName: req.file?.originalname,
      mimeType: req.file?.mimetype,
      size: req.file?.size,
      path: req.file ? getFileUrl(req.file.path) : null,
    },
  });
  return successResponse(res, doc, 'Documento fiscal registrado.', 201);
};

exports.remove = async (req, res) => {
  await prisma.fiscalDocument.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Documento excluído.');
};
