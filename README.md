# SleepCalm ERP — Sistema de Gestão de Devoluções

Sistema ERP completo e de produção para a **SleepCalm** — marca brasileira de colchões e artigos de cama — gerenciando todo o fluxo de devoluções: da abertura do caso até o encerramento financeiro, passando por análise técnica, logística Lalamove, doações, documentos fiscais e auditoria.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Arquitetura Técnica](#arquitetura-técnica)
4. [Pré-requisitos](#pré-requisitos)
5. [Instalação Completa (Docker)](#instalação-completa-docker)
6. [Instalação Manual (Desenvolvimento)](#instalação-manual-desenvolvimento)
7. [Variáveis de Ambiente](#variáveis-de-ambiente)
8. [Banco de Dados](#banco-de-dados)
9. [Usuários e Credenciais Padrão](#usuários-e-credenciais-padrão)
10. [Estrutura do Projeto](#estrutura-do-projeto)
11. [RBAC — Controle de Acesso](#rbac--controle-de-acesso)
12. [Módulos do Sistema](#módulos-do-sistema)
13. [API Reference](#api-reference)
14. [Deploy em Produção](#deploy-em-produção)
15. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O SleepCalm ERP é um sistema full-stack de nível corporativo desenvolvido com:

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: Node.js + Express.js + Prisma ORM
- **Banco de dados**: PostgreSQL 16
- **Cache**: Redis 7
- **Infra**: Docker Compose + Nginx reverse proxy

---

## Funcionalidades

### 20 Módulos Implementados

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | **Dashboard Executivo** | 12 KPIs + 5 gráficos interativos (área, pizza, barra, SLA) |
| 2 | **Devoluções** | CRUD completo + fluxo de 17 status + timeline + SLA automático |
| 3 | **Análise Técnica** | Laudos de defeito, mau uso, desgaste — com aprovação |
| 4 | **Módulo Financeiro** | Reembolsos, prejuízos, custos — com fluxo mensal e aprovação |
| 5 | **Lalamove** | Gestão de coletas logísticas — pedidos, status, motorista |
| 6 | **Doações** | Destinação de produtos aprovados para instituições |
| 7 | **Documentos Fiscais** | NF, NF-D, XML, PDF por devolução |
| 8 | **Anexos** | Upload múltiplo (foto, vídeo, documento) por caso |
| 9 | **Relatórios** | PDF e Excel: devoluções, financeiro, SLA, operacional |
| 10 | **Notificações** | Bell em tempo real + marcação de lidas |
| 11 | **Auditoria** | Log completo de todas as ações do sistema |
| 12 | **Gestão de SKUs** | Catálogo de produtos com 20 SKUs SleepCalm |
| 13 | **Fornecedores** | Cadastro e gestão de fornecedores |
| 14 | **Transportadoras** | Cadastro e gestão de transportadoras |
| 15 | **Clientes** | Histórico e perfil de clientes com devoluções |
| 16 | **Gestão de Usuários** | CRUD + RBAC com 8 perfis e permissões granulares |
| 17 | **Comentários** | Internos e públicos por caso |
| 18 | **Timeline** | Histórico visual de status e ações |
| 19 | **Controle de SLA** | Alertas automáticos de breach + SLA por prioridade |
| 20 | **Numeração de Casos** | Formato `SC-YYYYMM-NNNN` auto-gerado |

---

## Arquitetura Técnica

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx :80                         │
│         Reverse Proxy + SSL Termination                  │
└────────────────┬──────────────────┬─────────────────────┘
                 │                  │
         /api/*  │          /*      │
                 ▼                  ▼
    ┌────────────────┐    ┌──────────────────┐
    │  Backend :4000  │    │  Frontend :3000   │
    │  Express + Hono │    │  Next.js 14 SSR   │
    └────────┬───────┘    └──────────────────┘
             │
    ┌────────┴────────┬──────────────┐
    ▼                 ▼              ▼
┌──────────┐  ┌────────────┐  ┌──────────┐
│ Postgres │  │   Redis 7  │  │ Uploads  │
│   :5432  │  │   :6379    │  │  /files  │
└──────────┘  └────────────┘  └──────────┘
```

---

## Pré-requisitos

### Para instalação com Docker (recomendado)

- **Docker** 24.0+ — [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** 2.20+ — incluído no Docker Desktop
- **Git** 2.30+
- **Mínimo 4GB RAM** disponível para os containers
- **Portas livres**: 80, 3000, 4000, 5432, 6379

### Para instalação manual (desenvolvimento)

- **Node.js** 20 LTS — [Download](https://nodejs.org)
- **npm** 10+ (incluído com Node.js)
- **PostgreSQL** 16 — [Download](https://www.postgresql.org/download/)
- **Redis** 7 — [Download](https://redis.io/download/)
- **Git** 2.30+

---

## Instalação Completa (Docker)

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/sua-empresa/sleepcalm-erp.git
cd sleepcalm-erp
```

### Passo 2 — Configurar variáveis de ambiente

```bash
# Copiar template do backend
cp backend/.env.example backend/.env

# Editar as variáveis (veja seção Variáveis de Ambiente)
nano backend/.env
```

**Valores mínimos para alterar no backend/.env:**

```env
DATABASE_URL="postgresql://sleepcalm:sleepcalm2024@postgres:5432/sleepcalm_erp"
JWT_SECRET="TROQUE-ISTO-POR-UMA-CHAVE-SECRETA-DE-64-CARACTERES"
JWT_REFRESH_SECRET="TROQUE-ISTO-POR-OUTRA-CHAVE-SECRETA-DE-64-CARACTERES"
```

> **⚠️ Importante**: Nunca use os valores padrão em produção. Gere secrets com:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Passo 3 — Subir os serviços

```bash
docker compose up -d
```

Aguarde todos os serviços ficarem `healthy`. Acompanhe com:

```bash
docker compose logs -f
```

### Passo 4 — Executar migrations e seed

```bash
# Aplicar schema do banco
docker compose exec backend npx prisma migrate deploy

# Popular com dados de demonstração
docker compose exec backend node prisma/seeds/index.js
```

### Passo 5 — Acessar o sistema

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API** | http://localhost:4000 |
| **Via Nginx** | http://localhost |
| **Health check** | http://localhost:4000/health |

**Login padrão do administrador:**
- E-mail: `admin@sleepcalm.com.br`
- Senha: `SleepCalm@2024`

---

## Instalação Manual (Desenvolvimento)

### Passo 1 — Clonar e instalar dependências

```bash
git clone https://github.com/sua-empresa/sleepcalm-erp.git
cd sleepcalm-erp

# Backend
cd backend
npm install
cp .env.example .env
# Edite .env com suas configurações locais

# Frontend
cd ../frontend
npm install
```

### Passo 2 — Configurar PostgreSQL local

```bash
# Criar banco e usuário
psql -U postgres << EOF
CREATE DATABASE sleepcalm_erp;
CREATE USER sleepcalm WITH ENCRYPTED PASSWORD 'sleepcalm2024';
GRANT ALL PRIVILEGES ON DATABASE sleepcalm_erp TO sleepcalm;
\c sleepcalm_erp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
EOF
```

### Passo 3 — Configurar Redis local

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Verificar
redis-cli ping  # deve retornar: PONG
```

### Passo 4 — Configurar o backend

```bash
cd backend

# Editar .env com DATABASE_URL apontando para localhost
nano .env
# DATABASE_URL="postgresql://sleepcalm:sleepcalm2024@localhost:5432/sleepcalm_erp"

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma migrate dev --name init

# Popular banco com dados de demo
node prisma/seeds/index.js

# Criar pasta de uploads
mkdir -p uploads/photos uploads/videos uploads/documents uploads/fiscal uploads/others

# Iniciar servidor de desenvolvimento
npm run dev
# Servidor rodando em http://localhost:4000
```

### Passo 5 — Configurar o frontend

```bash
cd ../frontend

# Criar .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
EOF

# Iniciar servidor de desenvolvimento
npm run dev
# Servidor rodando em http://localhost:3000
```

### Passo 6 — Acessar

Abra http://localhost:3000 e faça login com `admin@sleepcalm.com.br` / `SleepCalm@2024`

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

```env
# ─── Servidor ───────────────────────────────────────────
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# ─── Banco de Dados ──────────────────────────────────────
DATABASE_URL="postgresql://sleepcalm:sleepcalm2024@localhost:5432/sleepcalm_erp"

# ─── Redis ───────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ─── JWT (gere com: node -e "require('crypto').randomBytes(64).toString('hex')") ─
JWT_SECRET="seu-jwt-secret-64-chars-aqui"
JWT_REFRESH_SECRET="seu-refresh-secret-64-chars-aqui"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_EXPIRES_IN="7d"

# ─── CORS ────────────────────────────────────────────────
FRONTEND_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost"

# ─── Upload de Arquivos ──────────────────────────────────
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="52428800"           # 50MB em bytes
ALLOWED_MIME_TYPES="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf,text/xml,application/xml"

# ─── Rate Limiting ───────────────────────────────────────
RATE_LIMIT_WINDOW_MS="900000"      # 15 minutos
RATE_LIMIT_MAX="100"               # requisições por janela
AUTH_RATE_LIMIT_MAX="20"           # tentativas de login por janela

# ─── Integração Lalamove (opcional) ─────────────────────
LALAMOVE_API_KEY=""
LALAMOVE_API_SECRET=""
LALAMOVE_BASE_URL="https://rest.lalamove.com"
LALAMOVE_MARKET="BR"

# ─── Email (opcional) ────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@sleepcalm.com.br"

# ─── Logs ────────────────────────────────────────────────
LOG_LEVEL="info"
LOG_DIR="./logs"
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Opcional — para produção
NEXTAUTH_URL=https://erp.sleepcalm.com.br
NEXTAUTH_SECRET=seu-secret-aqui
```

---

## Banco de Dados

### Modelos Prisma (17 entidades)

```
User              — Usuários do sistema com RBAC
UserPermission    — Permissões granulares por usuário
SKU               — Catálogo de produtos SleepCalm
Supplier          — Fornecedores
Carrier           — Transportadoras
Customer          — Clientes
Devolution        — Casos de devolução (principal)
DevolutionItem    — Itens da devolução
DevolutionReason  — Motivos de devolução
StatusHistory     — Histórico de mudanças de status
Comment           — Comentários por caso
TechnicalAnalysis — Laudos técnicos
TechnicalAttachment — Anexos da análise técnica
FinancialRecord   — Registros financeiros
FiscalDocument    — Notas fiscais e XMLs
Attachment        — Anexos gerais (fotos, vídeos, docs)
LalamoveOrder     — Pedidos de coleta Lalamove
Donation          — Doações de produtos
Notification      — Notificações do sistema
AuditLog          — Log de auditoria
SystemConfig      — Configurações do sistema
```

### Migrations

```bash
# Desenvolvimento — criar nova migration
cd backend
npx prisma migrate dev --name nome_da_migration

# Produção — aplicar migrations
npx prisma migrate deploy

# Visualizar banco de dados (interface web)
npx prisma studio
# Acesse: http://localhost:5555

# Resetar banco (CUIDADO — apaga todos os dados)
npx prisma migrate reset
```

### Backup e Restore

```bash
# Backup
docker compose exec postgres pg_dump -U sleepcalm sleepcalm_erp > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T postgres psql -U sleepcalm sleepcalm_erp < backup_20240115.sql
```

---

## Usuários e Credenciais Padrão

Após rodar o seed (`node prisma/seeds/index.js`), os seguintes usuários são criados:

| Nome | E-mail | Senha | Perfil |
|------|--------|-------|--------|
| Owner SleepCalm | `owner@sleepcalm.com.br` | `SleepCalm@2024` | OWNER |
| Admin Sistema | `admin@sleepcalm.com.br` | `SleepCalm@2024` | ADMIN |
| Supervisor Ops | `supervisor@sleepcalm.com.br` | `SleepCalm@2024` | SUPERVISOR |
| Analista Devolução | `analista@sleepcalm.com.br` | `SleepCalm@2024` | ANALYST |
| Financeiro | `financeiro@sleepcalm.com.br` | `SleepCalm@2024` | FINANCIAL |
| SAC Atendimento | `sac@sleepcalm.com.br` | `SleepCalm@2024` | SAC |
| Operacional | `operacional@sleepcalm.com.br` | `SleepCalm@2024` | OPERATIONAL |

> **⚠️ Altere todas as senhas antes de ir para produção!**

### Dados de demonstração incluídos

- **20 SKUs SleepCalm**: Colchões, travesseiros, protetores, edredons, bases, pillow tops
- **3 Fornecedores**: Fabricantes e distribuidores
- **4 Transportadoras**: Correios, Jadlog, Loggi, Total Express
- **10 Clientes** com perfis completos
- **18 Motivos de devolução** categorizados
- **10 Devoluções** em diferentes estágios do fluxo
- **Registros financeiros**, pedidos Lalamove, análises técnicas, doações

---

## Estrutura do Projeto

```
sleepcalm-erp/
├── docker-compose.yml         # Orquestração de serviços
├── docker/
│   ├── init.sql               # Extensões PostgreSQL
│   └── nginx.conf             # Configuração Nginx
├── README.md                  # Este arquivo
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma      # Schema completo (17 modelos)
│   │   └── seeds/
│   │       └── index.js       # Seed completo com dados demo
│   └── src/
│       ├── server.js          # Entry point Express
│       ├── controllers/       # 17 controllers
│       │   ├── auth.controller.js
│       │   ├── devolution.controller.js
│       │   ├── dashboard.controller.js
│       │   ├── user.controller.js
│       │   ├── sku.controller.js
│       │   ├── financial.controller.js
│       │   ├── supplier.controller.js
│       │   ├── carrier.controller.js
│       │   ├── customer.controller.js
│       │   ├── technical.controller.js
│       │   ├── lalamove.controller.js
│       │   ├── donation.controller.js
│       │   ├── notification.controller.js
│       │   ├── audit.controller.js
│       │   ├── attachment.controller.js
│       │   ├── fiscal.controller.js
│       │   └── report.controller.js
│       ├── routes/            # 17 route files
│       ├── middlewares/
│       │   ├── auth.js        # JWT + RBAC
│       │   ├── audit.js       # Audit logging
│       │   ├── upload.js      # Multer config
│       │   └── errorHandler.js
│       └── utils/
│           ├── logger.js      # Winston
│           ├── prisma.js      # Singleton Prisma
│           ├── caseNumber.js  # SC-YYYYMM-NNNN
│           └── response.js    # Response helpers
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── postcss.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── page.tsx                      # Root redirect
        │   ├── login/page.tsx
        │   └── dashboard/
        │       ├── layout.tsx                # Auth guard
        │       ├── page.tsx                  # Dashboard executivo
        │       ├── devolutions/
        │       │   ├── page.tsx              # Lista de devoluções
        │       │   ├── new/page.tsx
        │       │   └── [id]/page.tsx         # Detalhe completo
        │       ├── financial/page.tsx
        │       ├── lalamove/page.tsx
        │       ├── donations/page.tsx
        │       ├── technical/page.tsx
        │       ├── reports/page.tsx
        │       ├── skus/page.tsx
        │       ├── suppliers/page.tsx
        │       ├── carriers/page.tsx
        │       ├── customers/page.tsx
        │       ├── users/page.tsx
        │       └── audit/page.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx
        │   │   ├── Header.tsx
        │   │   └── Providers.tsx
        │   └── modules/
        │       ├── DevolutionModal.tsx
        │       ├── StatusBadge.tsx
        │       ├── PriorityBadge.tsx
        │       ├── Timeline.tsx
        │       ├── CommentSection.tsx
        │       └── FileUploader.tsx
        ├── lib/
        │   ├── api.ts                        # Axios + interceptors
        │   └── utils.ts                      # Helpers de formatação
        └── store/
            └── auth.store.ts                 # Zustand + persistência
```

---

## RBAC — Controle de Acesso

### 8 Perfis de Acesso

| Perfil | Acesso | Permissões Padrão |
|--------|--------|------------------|
| `OWNER` | Irrestrito | Todas (bypass automático) |
| `ADMIN` | Irrestrito | Todas (bypass automático) |
| `SUPERVISOR` | Alto | CREATE, EDIT, APPROVE, VIEW, EXPORT, VIEW_AUDIT, VIEW_REPORTS, CLOSE_CASES |
| `ANALYST` | Médio | CREATE, EDIT, VIEW |
| `FINANCIAL` | Financeiro | VIEW, APPROVE, EXPORT, MANAGE_FINANCIAL, VIEW_REPORTS |
| `SAC` | Atendimento | CREATE, VIEW, EDIT |
| `OPERATIONAL` | Operacional | VIEW, EDIT |
| `VIEWER` | Somente leitura | VIEW |

### 14 Permissões Granulares

| Permissão | Descrição |
|-----------|-----------|
| `CREATE` | Criar novos registros |
| `EDIT` | Editar registros existentes |
| `DELETE` | Remover registros |
| `APPROVE` | Aprovar análises e registros financeiros |
| `VIEW` | Visualizar dados |
| `EXPORT` | Exportar relatórios PDF/Excel |
| `CLOSE_CASES` | Fechar casos de devolução |
| `MANAGE_USERS` | Gerenciar usuários do sistema |
| `MANAGE_FINANCIAL` | Gerenciar módulo financeiro |
| `MANAGE_SKUS` | Gerenciar catálogo de produtos |
| `MANAGE_SUPPLIERS` | Gerenciar fornecedores |
| `MANAGE_CARRIERS` | Gerenciar transportadoras |
| `VIEW_AUDIT` | Acessar log de auditoria |
| `VIEW_REPORTS` | Acessar central de relatórios |

> Permissões granulares podem ser atribuídas individualmente a qualquer usuário pela tela de Gestão de Usuários (requer perfil OWNER ou ADMIN).

---

## Módulos do Sistema

### Fluxo de Status de Devolução (17 estágios)

```
OPEN
  └─► IN_ANALYSIS
        ├─► AWAITING_COLLECTION
        │     └─► COLLECTED
        │           └─► IN_TRANSIT
        │                 └─► RECEIVED_WAREHOUSE
        │                       ├─► TECHNICAL_ANALYSIS
        │                       │     ├─► APPROVED ──────────────┐
        │                       │     └─► REJECTED ──► CLOSED    │
        │                       └─► APPROVED                     │
        │                                                         │
        ├─► APPROVED ──────────────────────────────────────────── ┤
        │     ├─► REFUND_PENDING ──► REFUNDED ──► CLOSED         │
        │     ├─► EXCHANGE_PENDING ──► EXCHANGED ──► CLOSED       │
        │     └─► DONATED ──► CLOSED                             │
        └─► REJECTED ──► CLOSED                                  │
                                                                  │
CANCELLED (pode ser acionado de quase qualquer etapa) ◄──────────┘
```

### Formato do Número de Caso

```
SC-202501-0001
│  │      │
│  │      └─ Número sequencial mensal (4 dígitos com zero-fill)
│  └───────── Ano e mês (YYYYMM)
└──────────── Prefixo SleepCalm
```

### SLA por Prioridade

| Prioridade | SLA Padrão | Alerta |
|-----------|-----------|--------|
| CRITICAL | 2 horas | Imediato |
| HIGH | 24 horas | 12h antes |
| MEDIUM | 72 horas | 24h antes |
| LOW | 168 horas (7 dias) | 48h antes |

---

## API Reference

### Autenticação

```bash
# Login
POST /api/v1/auth/login
Content-Type: application/json
{ "email": "admin@sleepcalm.com.br", "password": "SleepCalm@2024" }

# Resposta: sets cookies sleepcalm_token + sleepcalm_refresh_token

# Logout
POST /api/v1/auth/logout

# Refresh token
POST /api/v1/auth/refresh

# Perfil atual
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Endpoints Principais

```
# Devoluções
GET    /api/v1/devolutions                   # Listar com filtros e paginação
POST   /api/v1/devolutions                   # Criar
GET    /api/v1/devolutions/:id               # Detalhe completo
PUT    /api/v1/devolutions/:id               # Atualizar
DELETE /api/v1/devolutions/:id               # Remover
PATCH  /api/v1/devolutions/:id/status        # Mudar status
PATCH  /api/v1/devolutions/:id/assign        # Atribuir responsável
GET    /api/v1/devolutions/:id/timeline      # Linha do tempo
POST   /api/v1/devolutions/:id/comments      # Adicionar comentário
GET    /api/v1/devolutions/stats             # Estatísticas gerais

# Dashboard
GET    /api/v1/dashboard/full                # Todos os dados de uma vez
GET    /api/v1/dashboard/kpis               # KPIs individuais
GET    /api/v1/dashboard/monthly-evolution   # Gráfico de evolução

# Relatórios
GET    /api/v1/reports/devolutions?format=pdf|excel
GET    /api/v1/reports/financial?format=pdf|excel
GET    /api/v1/reports/sla?format=pdf|excel
GET    /api/v1/reports/operational?format=pdf|excel

# Uploads
POST   /api/v1/attachments/:devolutionId     # Upload de anexos
DELETE /api/v1/attachments/:id               # Remover anexo

# Documentos Fiscais
GET    /api/v1/fiscal/devolution/:devolutionId
POST   /api/v1/fiscal/:devolutionId
```

### Padrão de Resposta

```json
// Sucesso
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Erro
{
  "success": false,
  "error": "Descrição do erro",
  "errors": [...],
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Lista paginada
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Deploy em Produção

### Opção 1: Docker Compose (servidor próprio)

```bash
# 1. Clone e configure
git clone https://github.com/sua-empresa/sleepcalm-erp.git
cd sleepcalm-erp
cp backend/.env.example backend/.env
# Edite as variáveis para produção

# 2. Configure SSL (opcional mas recomendado)
# Adicione certificados em docker/ssl/
# Ajuste nginx.conf para HTTPS

# 3. Build e deploy
docker compose -f docker-compose.yml up -d --build

# 4. Migrations e seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend node prisma/seeds/index.js

# 5. Verifique
curl http://seu-servidor/health
```

### Opção 2: Deploy separado (Railway / Render / Fly.io)

**Backend (Railway):**
```bash
# Instale Railway CLI
npm install -g @railway/cli

railway login
railway link
railway up --service backend

# Configure variáveis de ambiente no dashboard Railway
```

**Frontend (Vercel):**
```bash
npm install -g vercel
cd frontend
vercel --prod
# Configure NEXT_PUBLIC_API_URL no dashboard Vercel
```

### Opção 3: Kubernetes

```bash
# Helm chart disponível em /k8s (se configurado)
helm install sleepcalm ./k8s/chart \
  --set backend.replicas=2 \
  --set frontend.replicas=2 \
  --set postgresql.enabled=true
```

### Checklist de Produção

- [ ] Alterar todas as senhas dos usuários seed
- [ ] Gerar JWT_SECRET e JWT_REFRESH_SECRET únicos (64+ chars)
- [ ] Configurar HTTPS/SSL (Let's Encrypt + Certbot)
- [ ] Configurar backup automático do PostgreSQL
- [ ] Ajustar ALLOWED_ORIGINS para domínios de produção
- [ ] Configurar monitoramento (Grafana/Prometheus ou Datadog)
- [ ] Configurar alertas de erro (Sentry)
- [ ] Habilitar rate limiting adequado para produção
- [ ] Revisar configurações de CORS
- [ ] Testar restore de backup antes do go-live

---

## Troubleshooting

### Problema: Container do banco não inicia

```bash
# Verificar logs
docker compose logs postgres

# Resetar volumes (PERDE TODOS OS DADOS)
docker compose down -v
docker compose up -d
```

### Problema: "Cannot connect to database"

```bash
# Verificar se o banco está rodando
docker compose ps postgres

# Testar conexão manualmente
docker compose exec postgres psql -U sleepcalm -d sleepcalm_erp -c "\l"

# Verificar DATABASE_URL no backend/.env
```

### Problema: Migrations falhando

```bash
# Ver estado das migrations
docker compose exec backend npx prisma migrate status

# Forçar resolve de migration pendente
docker compose exec backend npx prisma migrate resolve --applied "nome_da_migration"
```

### Problema: Frontend não carrega / 404

```bash
# Verificar se o backend está rodando
curl http://localhost:4000/health

# Verificar variável NEXT_PUBLIC_API_URL
cat frontend/.env.local

# Rebuildar frontend
docker compose up -d --build frontend
```

### Problema: "Invalid token" ao logar

```bash
# Limpar cookies do browser
# Ou verificar se JWT_SECRET bate entre reinicializações
echo $JWT_SECRET  # deve ser sempre o mesmo
```

### Problema: Upload de arquivos falha

```bash
# Verificar permissões da pasta
ls -la backend/uploads/

# Criar se não existir
mkdir -p backend/uploads/{photos,videos,documents,fiscal,others}
chmod -R 755 backend/uploads/

# Verificar MAX_FILE_SIZE no .env (padrão: 50MB)
```

### Logs em Produção

```bash
# Backend logs em tempo real
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend

# Todos os serviços
docker compose logs -f

# Logs do backend em arquivo
tail -f backend/logs/app.log
tail -f backend/logs/error.log
```

### Resetar para estado inicial (desenvolvimento)

```bash
# ATENÇÃO: apaga todos os dados!
docker compose exec backend npx prisma migrate reset --force
docker compose exec backend node prisma/seeds/index.js
```

---

## Tecnologias Utilizadas

### Frontend
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS 3
- Framer Motion (animações)
- TanStack Query v5 (data fetching)
- Zustand (estado global)
- Recharts (gráficos)
- Radix UI / Shadcn/UI (componentes)
- Sonner (toasts)
- React Hook Form + Zod (formulários)
- Axios (HTTP client)
- react-dropzone (upload)

### Backend
- Node.js 20 LTS
- Express.js 4
- Prisma ORM 5
- PostgreSQL 16
- Redis 7
- bcryptjs (hash de senhas)
- jsonwebtoken (JWT)
- multer (upload de arquivos)
- PDFKit (geração de PDF)
- xlsx (geração de Excel)
- Winston (logging)
- Zod (validação)
- helmet (segurança)
- express-rate-limit (throttling)

### Infraestrutura
- Docker + Docker Compose
- Nginx (reverse proxy)
- PostgreSQL 16 (banco principal)
- Redis 7 (cache e sessões)

---

## Suporte e Contribuição

Para bugs, melhorias ou sugestões:

1. Abra uma issue no repositório
2. Descreva o problema com steps to reproduce
3. Inclua versão do Node.js, SO e logs relevantes

---

## Licença

Propriedade da **SleepCalm Comércio de Artigos para Cama Ltda.**  
Todos os direitos reservados — uso interno exclusivo.

---

*SleepCalm ERP v1.0.0 — Desenvolvido com ❤️ para a equipe SleepCalm*  
*Última atualização: Janeiro 2025*
