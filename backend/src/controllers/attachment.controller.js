const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { getFileUrl } = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');

exports.list = async (req, res) => {
  const attachments = await prisma.attachment.findMany({
    where: { devolutionId: req.params.devolutionId },
    orderBy: { createdAt: 'desc' },
  });
  return successResponse(res, attachments);
};

exports.upload = async (req, res) => {
  const { devolutionId } = req.params;
  const { category, description } = req.body;

  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'Nenhum arquivo enviado.', 400);
  }

  const attachments = await Promise.all(
    req.files.map(file =>
      prisma.attachment.create({
        data: {
          devolutionId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: getFileUrl(file.path),
          category: category || detectCategory(file.mimetype),
          description,
          uploadedById: req.user.id,
        },
      })
    )
  );

  return successResponse(res, attachments, 'Arquivos enviados com sucesso.', 201);
};

exports.remove = async (req, res) => {
  const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
  if (!attachment) return errorResponse(res, 'Arquivo não encontrado.', 404);

  // Remove arquivo físico
  const basePath = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const filePath = path.join(basePath, attachment.path.replace('/uploads', ''));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.attachment.delete({ where: { id: req.params.id } });
  return successResponse(res, null, 'Arquivo excluído.');
};

function detectCategory(mimeType) {
  if (mimeType.startsWith('image/')) return 'PHOTO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType === 'application/pdf') return 'DOCUMENT';
  return 'OTHER';
}
