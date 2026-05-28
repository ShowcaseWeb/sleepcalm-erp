const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { getFileUrl } = require('../middlewares/upload');

exports.list = async (req, res) => {
  const docs = await prisma.fiscalDocument.findMany({ where: { devolutionId: req.params.devolutionId }, orderBy: { createdAt: 'desc' } });
  return successResponse(res, docs);
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
