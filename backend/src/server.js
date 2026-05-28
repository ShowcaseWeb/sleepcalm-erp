/**
 * ============================================================
 * SleepCalm ERP - Server Principal
 * ============================================================
 */

require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { logger } = require('./utils/logger');
const { prisma } = require('./utils/prisma');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

// ============================================================
// MIDDLEWARES DE SEGURANÇA
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate Limiting Global
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Muitas tentativas de login. Aguarde 15 minutos.',
  },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ============================================================
// MIDDLEWARES DE PARSING
// ============================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// ============================================================
// LOGGING
// ============================================================

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// ============================================================
// ARQUIVOS ESTÁTICOS (UPLOADS)
// ============================================================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../reports/generated')));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================
// ROTAS DA API
// ============================================================

app.use('/api/v1', routes);
app.get('/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');

    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'admin@sleepcalm.com',
      },
    });

    if (existingUser) {
      return res.json({
        success: true,
        message: 'Usuário admin já existe.',
      });
    }

    const user = await prisma.user.create({
      data: {
        email: 'admin@sleepcalm.com',
        password: await bcrypt.hash('123456', 10),
      },
    });

    res.json({
      success: true,
      message: 'Usuário admin criado com sucesso.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ROTA 404
// ============================================================

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rota ${req.originalUrl} não encontrada.`,
  });
});

// ============================================================
// ERROR HANDLER GLOBAL
// ============================================================

app.use(errorHandler);

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================

const PORT = parseInt(process.env.PORT || '4000');

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Banco de dados PostgreSQL conectado com sucesso');
    app.get("/seed", async (req, res) => {
  const bcrypt = require("bcryptjs");

  const user = await prisma.user.create({
    data: {
      email: "admin@sleepcalm.com",
      password: await bcrypt.hash("123456", 10)
    }
  });

  res.json(user);
});

app.get("/seed", async (req, res) => {
  const bcrypt = require("bcryptjs");

  const user = await prisma.user.create({
    data: {
      email: "admin@sleepcalm.com",
      password: await bcrypt.hash("123456", 10)
    }
  });

  res.json(user);
});

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════╗
║          SleepCalm ERP - Backend API v1.0.0                 ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Servidor rodando na porta: ${PORT}                          ║
║  🌍 Ambiente: ${process.env.NODE_ENV || 'development'}                          ║
║  📊 API Base: http://localhost:${PORT}/api/v1                   ║
║  🏥 Health:   http://localhost:${PORT}/health                   ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido. Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = app;
