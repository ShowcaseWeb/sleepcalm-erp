const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { getFileUrl } = require('../middlewares/upload');
const path = require('path');

exports.list = async (req, res) => {
  const { page, limit, devolutionId, approved } = req.query;
  const { skip, page: p, limit: l } = getPagination(page, limit);
  const where = {};
  if (devolutionId) where.devolutionId = devolutionId;
  if (approved !== undefined) where.approved = approved === 'true' ? true : approved === 'false' ? false : undefined;

  const [items, total] = await Promise.all([
    prisma.technicalAnalysis.findMany({
      where,
      skip,
      take: l,
      orderBy: { createdAt: 'desc' },
      include: {
        analyst: { select: { id: true, name: true } },
        devolution: { select: { caseNumber: true, orderNumber: true } },
      },
    }),
    prisma.technicalAnalysis.count({ where }),
  ]);
  return paginatedResponse(res, items, buildPaginationMeta(total, p, l));
};

exports.getById = async (req, res) => {
  const t = await prisma.technicalAnalysis.findUnique({
    where: { id: req.params.id },
    include: {
      analyst: { select: { id: true, name: true, avatar: true } },
      devolution: { include: { customer: true, items: true } },
      attachments: true,
    },
  });
  if (!t) return errorResponse(res, 'Análise técnica não encontrada.', 404);
  return successResponse(res, t);
};

exports.create = async (req, res) => {
  const { devolutionId, problems, description, conclusion, recommendation, productCondition, repairPossible, estimatedLoss } = req.body;
  if (!devolutionId || !description) {
    return errorResponse(res, 'Devolução e descrição são obrigatórios.', 400);
  }

  const existing = await prisma.technicalAnalysis.findUnique({ where: { devolutionId } });
  if (existing) return errorResponse(res, 'Já existe análise técnica para esta devolução.', 409);

  const analysis = await prisma.technicalAnalysis.create({
    data: {
      devolutionId,
      analystId: req.user.id,
      problems: problems || [],
      description,
      conclusion,
      recommendation,
      productCondition,
      repairPossible: repairPossible !== undefined ? Boolean(repairPossible) : null,
      estimatedLoss: estimatedLoss ? parseFloat(estimatedLoss) : null,
    },
    include: { analyst: { select: { id: true, name: true } } },
  });
  return successResponse(res, analysis, 'Análise técnica criada.', 201);
};

exports.update = async (req, res) => {
  const { problems, description, conclusion, recommendation, productCondition, repairPossible, estimatedLoss } = req.body;
  const analysis = await prisma.technicalAnalysis.update({
    where: { id: req.params.id },
    data: {
      ...(problems && { problems }),
      ...(description && { description }),
      ...(conclusion !== undefined && { conclusion }),
      ...(recommendation !== undefined && { recommendation }),
      ...(productCondition !== undefined && { productCondition }),
      ...(repairPossible !== undefined && { repairPossible: Boolean(repairPossible) }),
      ...(estimatedLoss !== undefined && { estimatedLoss: estimatedLoss ? parseFloat(estimatedLoss) : null }),
    },
  });
  return successResponse(res, analysis, 'Análise técnica atualizada.');
};

exports.approve = async (req, res) => {
  const { approved, approverNotes } = req.body;
  const analysis = await prisma.technicalAnalysis.update({
    where: { id: req.params.id },
    data: {
      approved: Boolean(approved),
      approvedById: req.user.id,
      approvedAt: new Date(),
      approverNotes,
    },
  });
  return successResponse(res, analysis, `Análise técnica ${approved ? 'aprovada' : 'reprovada'}.`);
};

exports.addAttachment = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'Nenhum arquivo enviado.', 400);
  }

  const attachments = await Promise.all(
    req.files.map(file =>
      prisma.technicalAttachment.create({
        data: {
          technicalAnalysisId: id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: getFileUrl(file.path),
          description,
        },
      })
    )
  );

  return successResponse(res, attachments, 'Arquivos enviados.', 201);
};
