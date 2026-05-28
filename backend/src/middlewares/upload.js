/**
 * Configuração do Multer para Upload de Arquivos
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Garante que os diretórios existem
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Configuração de storage dinâmica por categoria
const createStorage = (category = 'general') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let dir;
      const mimeType = file.mimetype;

      if (mimeType.startsWith('image/')) dir = path.join(UPLOAD_BASE, 'photos');
      else if (mimeType.startsWith('video/')) dir = path.join(UPLOAD_BASE, 'videos');
      else if (mimeType === 'application/pdf') dir = path.join(UPLOAD_BASE, 'documents');
      else if (mimeType.includes('xml')) dir = path.join(UPLOAD_BASE, 'nf');
      else dir = path.join(UPLOAD_BASE, category);

      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });
};

// Filtro de tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/xml', 'application/xml',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
};

// Upload geral de anexos
const uploadAttachments = multer({
  storage: createStorage('attachments'),
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
});

// Upload de fotos
const uploadPhotos = multer({
  storage: createStorage('photos'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas.'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 20,
  },
});

// Upload de documentos fiscais
const uploadFiscalDocs = multer({
  storage: createStorage('nf'),
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/xml', 'application/xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas PDF e XML são permitidos.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
});

// Gera URL pública do arquivo
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const relativePath = filePath.replace(UPLOAD_BASE, '').replace(/\\/g, '/');
  return `/uploads${relativePath}`;
};

module.exports = {
  uploadAttachments,
  uploadPhotos,
  uploadFiscalDocs,
  getFileUrl,
  UPLOAD_BASE,
};
