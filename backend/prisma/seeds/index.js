/**
 * ============================================================
 * SleepCalm ERP - Seeds do Banco de Dados
 * Dados iniciais completos para demonstração
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('🌱 Iniciando seed do banco de dados SleepCalm ERP...\n');

  // ============================================================
  // 1. USUÁRIOS
  // ============================================================
  console.log('👤 Criando usuários...');

  const hashedPassword = await bcrypt.hash('SleepCalm@2024', BCRYPT_ROUNDS);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'Proprietário SleepCalm',
      email: 'owner@sleepcalm.com.br',
      password: hashedPassword,
      role: 'OWNER',
      phone: '(11) 99999-0001',
      department: 'Diretoria',
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'Administrador Sistema',
      email: 'admin@sleepcalm.com.br',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '(11) 99999-0002',
      department: 'TI',
      isActive: true,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'Maria Supervisora',
      email: 'supervisor@sleepcalm.com.br',
      password: hashedPassword,
      role: 'SUPERVISOR',
      phone: '(11) 99999-0003',
      department: 'Operações',
      isActive: true,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analista@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'João Analista',
      email: 'analista@sleepcalm.com.br',
      password: hashedPassword,
      role: 'ANALYST',
      phone: '(11) 99999-0004',
      department: 'Qualidade',
      isActive: true,
      permissions: {
        create: [
          { permission: 'CREATE' },
          { permission: 'EDIT' },
          { permission: 'VIEW' },
          { permission: 'EXPORT' },
        ],
      },
    },
  });

  const financial = await prisma.user.upsert({
    where: { email: 'financeiro@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'Ana Financeiro',
      email: 'financeiro@sleepcalm.com.br',
      password: hashedPassword,
      role: 'FINANCIAL',
      phone: '(11) 99999-0005',
      department: 'Financeiro',
      isActive: true,
      permissions: {
        create: [
          { permission: 'VIEW' },
          { permission: 'MANAGE_FINANCIAL' },
          { permission: 'APPROVE' },
          { permission: 'EXPORT' },
        ],
      },
    },
  });

  const sac = await prisma.user.upsert({
    where: { email: 'sac@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'Carlos SAC',
      email: 'sac@sleepcalm.com.br',
      password: hashedPassword,
      role: 'SAC',
      phone: '(11) 99999-0006',
      department: 'SAC',
      isActive: true,
      permissions: {
        create: [
          { permission: 'CREATE' },
          { permission: 'EDIT' },
          { permission: 'VIEW' },
        ],
      },
    },
  });

  const operational = await prisma.user.upsert({
    where: { email: 'operacional@sleepcalm.com.br' },
    update: {},
    create: {
      name: 'Pedro Operacional',
      email: 'operacional@sleepcalm.com.br',
      password: hashedPassword,
      role: 'OPERATIONAL',
      phone: '(11) 99999-0007',
      department: 'Logística',
      isActive: true,
      permissions: {
        create: [
          { permission: 'VIEW' },
          { permission: 'EDIT' },
        ],
      },
    },
  });

  console.log('✅ Usuários criados com sucesso!\n');

  // ============================================================
  // 2. FORNECEDORES
  // ============================================================
  console.log('🏭 Criando fornecedores...');

  const supplier1 = await prisma.supplier.upsert({
    where: { cnpj: '12.345.678/0001-01' },
    update: {},
    create: {
      name: 'Espumas Brasil Ltda',
      tradeName: 'Espumas Brasil',
      cnpj: '12.345.678/0001-01',
      email: 'contato@espumasbrasil.com.br',
      phone: '(11) 3333-1001',
      address: 'Rua das Espumas, 100',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
      contactPerson: 'Roberto Silva',
      notes: 'Principal fornecedor de espumas',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { cnpj: '23.456.789/0001-02' },
    update: {},
    create: {
      name: 'Tecidos Premium SA',
      tradeName: 'Tecidos Premium',
      cnpj: '23.456.789/0001-02',
      email: 'vendas@tecidospremium.com.br',
      phone: '(11) 3333-2002',
      address: 'Av. dos Tecidos, 200',
      city: 'Santo André',
      state: 'SP',
      zipCode: '09000-000',
      contactPerson: 'Fernanda Costa',
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { cnpj: '34.567.890/0001-03' },
    update: {},
    create: {
      name: 'Molas & Estruturas ME',
      tradeName: 'Molas ME',
      cnpj: '34.567.890/0001-03',
      email: 'contato@molasme.com.br',
      phone: '(11) 3333-3003',
      address: 'Rua das Molas, 300',
      city: 'São Bernardo do Campo',
      state: 'SP',
      zipCode: '09700-000',
      contactPerson: 'Paulo Mola',
    },
  });

  console.log('✅ Fornecedores criados!\n');

  // ============================================================
  // 3. TRANSPORTADORAS
  // ============================================================
  console.log('🚛 Criando transportadoras...');

  const carrier1 = await prisma.carrier.upsert({
    where: { cnpj: '45.678.901/0001-01' },
    update: {},
    create: {
      name: 'Correios',
      cnpj: '45.678.901/0001-01',
      email: 'corporativo@correios.com.br',
      phone: '0800-725-7282',
      website: 'https://www.correios.com.br',
      trackingUrl: 'https://rastreamento.correios.com.br/app/index.php',
      contactPerson: 'Atendimento Corporativo',
      averageDeliveryDays: 7,
      slaHours: 168,
      isActive: true,
    },
  });

  const carrier2 = await prisma.carrier.upsert({
    where: { cnpj: '56.789.012/0001-02' },
    update: {},
    create: {
      name: 'Jadlog',
      cnpj: '56.789.012/0001-02',
      email: 'corporativo@jadlog.com.br',
      phone: '(11) 4003-1000',
      website: 'https://www.jadlog.com.br',
      trackingUrl: 'https://jadlog.com.br/rastrear',
      contactPerson: 'Equipe Corporativa',
      averageDeliveryDays: 3,
      slaHours: 72,
      isActive: true,
    },
  });

  const carrier3 = await prisma.carrier.upsert({
    where: { cnpj: '67.890.123/0001-03' },
    update: {},
    create: {
      name: 'Lalamove',
      cnpj: '67.890.123/0001-03',
      email: 'business@lalamove.com',
      phone: '(11) 4030-7000',
      website: 'https://www.lalamove.com/pt-br',
      contactPerson: 'Equipe B2B',
      averageDeliveryDays: 1,
      slaHours: 24,
      isActive: true,
    },
  });

  const carrier4 = await prisma.carrier.upsert({
    where: { cnpj: '78.901.234/0001-04' },
    update: {},
    create: {
      name: 'Total Express',
      cnpj: '78.901.234/0001-04',
      email: 'atendimento@totalexpress.com.br',
      phone: '(11) 4020-5050',
      website: 'https://www.totalexpress.com.br',
      averageDeliveryDays: 5,
      slaHours: 120,
      isActive: true,
    },
  });

  console.log('✅ Transportadoras criadas!\n');

  // ============================================================
  // 4. SKUs SleepCalm
  // ============================================================
  console.log('📦 Criando SKUs SleepCalm...');

  const skusData = [
    { code: 'SC-COLCHAO-QUEEN-001', name: 'Colchão SleepCalm Queen Size Premium', category: 'Colchão', unitValue: 1899.90, weight: 35.0, supplierId: supplier1.id },
    { code: 'SC-COLCHAO-CASAL-002', name: 'Colchão SleepCalm Casal Comfort', category: 'Colchão', unitValue: 1499.90, weight: 30.0, supplierId: supplier1.id },
    { code: 'SC-COLCHAO-SOLT-003', name: 'Colchão SleepCalm Solteiro Relax', category: 'Colchão', unitValue: 899.90, weight: 18.0, supplierId: supplier1.id },
    { code: 'SC-COLCHAO-KING-004', name: 'Colchão SleepCalm King Size Ultra', category: 'Colchão', unitValue: 2499.90, weight: 45.0, supplierId: supplier1.id },
    { code: 'SC-TRAVESSEIRO-MEM-001', name: 'Travesseiro SleepCalm Memória Premium', category: 'Travesseiro', unitValue: 299.90, weight: 1.2, supplierId: supplier2.id },
    { code: 'SC-TRAVESSEIRO-SIL-002', name: 'Travesseiro SleepCalm Silicone Antialérgico', category: 'Travesseiro', unitValue: 199.90, weight: 0.9, supplierId: supplier2.id },
    { code: 'SC-TRAVESSEIRO-PER-003', name: 'Travesseiro SleepCalm Percal 300 Fios', category: 'Travesseiro', unitValue: 149.90, weight: 0.8, supplierId: supplier2.id },
    { code: 'SC-CAPA-COLCHAO-001', name: 'Capa Protetora de Colchão Impermeável Queen', category: 'Acessório', unitValue: 189.90, weight: 0.8, supplierId: supplier2.id },
    { code: 'SC-CAPA-COLCHAO-002', name: 'Capa Protetora de Colchão Impermeável Casal', category: 'Acessório', unitValue: 159.90, weight: 0.7, supplierId: supplier2.id },
    { code: 'SC-TOPPER-QUEEN-001', name: 'Topper Pillowtop SleepCalm Queen 5cm', category: 'Topper', unitValue: 599.90, weight: 8.0, supplierId: supplier1.id },
    { code: 'SC-TOPPER-CASAL-002', name: 'Topper Pillowtop SleepCalm Casal 5cm', category: 'Topper', unitValue: 499.90, weight: 7.0, supplierId: supplier1.id },
    { code: 'SC-BOX-QUEEN-001', name: 'Box Baú SleepCalm Queen com Gaveta', category: 'Box', unitValue: 799.90, weight: 40.0, supplierId: supplier3.id },
    { code: 'SC-BOX-CASAL-002', name: 'Box Baú SleepCalm Casal com Gaveta', category: 'Box', unitValue: 699.90, weight: 35.0, supplierId: supplier3.id },
    { code: 'SC-CONJ-QUEEN-001', name: 'Conjunto Colchão + Box Queen SleepCalm Premium', category: 'Conjunto', unitValue: 2599.90, weight: 75.0, supplierId: supplier1.id },
    { code: 'SC-CONJ-CASAL-002', name: 'Conjunto Colchão + Box Casal SleepCalm Premium', category: 'Conjunto', unitValue: 2099.90, weight: 65.0, supplierId: supplier1.id },
    { code: 'SC-ESPUMA-SIN-001', name: 'Colchão Espuma Solteiro D28 SleepCalm', category: 'Colchão', unitValue: 599.90, weight: 15.0, supplierId: supplier1.id },
    { code: 'SC-MOLA-ENSACADA-001', name: 'Colchão Molas Ensacadas Queen SleepCalm', category: 'Colchão', unitValue: 3299.90, weight: 50.0, supplierId: supplier3.id },
    { code: 'SC-HIBRIDO-QUEEN-001', name: 'Colchão Híbrido Memory Foam + Molas Queen', category: 'Colchão', unitValue: 2899.90, weight: 48.0, supplierId: supplier3.id },
    { code: 'SC-ALMOFADA-001', name: 'Almofada Decorativa SleepCalm Premium', category: 'Acessório', unitValue: 89.90, weight: 0.5, supplierId: supplier2.id },
    { code: 'SC-EDREDOM-001', name: 'Edredom SleepCalm Pluma Sintética Queen', category: 'Roupa de Cama', unitValue: 349.90, weight: 2.0, supplierId: supplier2.id },
  ];

  for (const skuData of skusData) {
    await prisma.sKU.upsert({
      where: { code: skuData.code },
      update: {},
      create: skuData,
    });
  }

  console.log(`✅ ${skusData.length} SKUs criados!\n`);

  // ============================================================
  // 5. CLIENTES
  // ============================================================
  console.log('👥 Criando clientes de exemplo...');

  const customersData = [
    { name: 'Roberto Alves Santos', email: 'roberto.santos@email.com', phone: '(11) 98765-1001', cpf: '123.456.789-01', city: 'São Paulo', state: 'SP' },
    { name: 'Maria Fernanda Oliveira', email: 'maria.oliveira@email.com', phone: '(11) 98765-1002', cpf: '234.567.890-02', city: 'Rio de Janeiro', state: 'RJ' },
    { name: 'Carlos Eduardo Lima', email: 'carlos.lima@email.com', phone: '(21) 98765-1003', cpf: '345.678.901-03', city: 'Curitiba', state: 'PR' },
    { name: 'Ana Paula Rodrigues', email: 'ana.rodrigues@email.com', phone: '(41) 98765-1004', cpf: '456.789.012-04', city: 'Belo Horizonte', state: 'MG' },
    { name: 'José Fernando Costa', email: 'jose.costa@email.com', phone: '(31) 98765-1005', cpf: '567.890.123-05', city: 'Porto Alegre', state: 'RS' },
    { name: 'Luciana Pereira Martins', email: 'luciana.martins@email.com', phone: '(51) 98765-1006', cpf: '678.901.234-06', city: 'Salvador', state: 'BA' },
    { name: 'Fernando Augusto Souza', email: 'fernando.souza@email.com', phone: '(71) 98765-1007', cpf: '789.012.345-07', city: 'Recife', state: 'PE' },
    { name: 'Patrícia Nascimento', email: 'patricia.nascimento@email.com', phone: '(81) 98765-1008', cpf: '890.123.456-08', city: 'Fortaleza', state: 'CE' },
    { name: 'Ricardo Mendes Silva', email: 'ricardo.silva@email.com', phone: '(85) 98765-1009', cpf: '901.234.567-09', city: 'Manaus', state: 'AM' },
    { name: 'Juliana Torres Freitas', email: 'juliana.freitas@email.com', phone: '(92) 98765-1010', cpf: '012.345.678-10', city: 'Goiânia', state: 'GO' },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { cpf: c.cpf },
      update: {},
      create: c,
    });
    customers.push(customer);
  }

  console.log(`✅ ${customers.length} clientes criados!\n`);

  // ============================================================
  // 6. MOTIVOS DE DEVOLUÇÃO
  // ============================================================
  console.log('📋 Criando motivos de devolução...');

  const reasonsData = [
    { category: 'Produto Defeituoso', description: 'Afundamento do colchão', order: 1 },
    { category: 'Produto Defeituoso', description: 'Defeito estrutural', order: 2 },
    { category: 'Produto Defeituoso', description: 'Rasgo no tecido', order: 3 },
    { category: 'Produto Defeituoso', description: 'Manchas de fábrica', order: 4 },
    { category: 'Produto Defeituoso', description: 'Odor forte', order: 5 },
    { category: 'Produto Errado', description: 'Produto diferente do pedido', order: 6 },
    { category: 'Produto Errado', description: 'Tamanho incorreto', order: 7 },
    { category: 'Produto Danificado', description: 'Produto avariado no transporte', order: 8 },
    { category: 'Produto Danificado', description: 'Embalagem danificada', order: 9 },
    { category: 'Insatisfação', description: 'Conforto inadequado', order: 10 },
    { category: 'Insatisfação', description: 'Densidade incorreta', order: 11 },
    { category: 'Insatisfação', description: 'Produto não atendeu expectativas', order: 12 },
    { category: 'Arrependimento', description: 'Desistência da compra', order: 13 },
    { category: 'Arrependimento', description: 'Compra duplicada', order: 14 },
    { category: 'Técnico', description: 'Defeito de costura', order: 15 },
    { category: 'Técnico', description: 'Problema na espuma', order: 16 },
    { category: 'Técnico', description: 'Problema nas molas', order: 17 },
    { category: 'Técnico', description: 'Problema no tecido', order: 18 },
  ];

  for (const reason of reasonsData) {
    await prisma.devolutionReason.create({ data: reason }).catch(() => {});
  }

  console.log(`✅ Motivos criados!\n`);

  // ============================================================
  // 7. DEVOLUÇÕES (DADOS MOCKADOS)
  // ============================================================
  console.log('📦 Criando devoluções de exemplo...');

  const skus = await prisma.sKU.findMany({ take: 10 });
  const carriers = await prisma.carrier.findMany();

  const devolutionsMock = [
    {
      status: 'OPEN',
      type: 'FULL_REFUND',
      priority: 'HIGH',
      reasonCategory: 'Produto Defeituoso',
      reasonDetail: 'Afundamento excessivo após 2 meses de uso',
      saleChannel: 'SLEEPCALM_SITE',
      customerIdx: 0,
      skuIdx: 0,
      quantity: 1,
      carrierId: carrier1.id,
      assignedToId: analyst.id,
    },
    {
      status: 'IN_ANALYSIS',
      type: 'EXCHANGE',
      priority: 'MEDIUM',
      reasonCategory: 'Produto Errado',
      reasonDetail: 'Recebeu colchão tamanho errado',
      saleChannel: 'MERCADO_LIVRE',
      customerIdx: 1,
      skuIdx: 1,
      quantity: 1,
      carrierId: carrier2.id,
      assignedToId: sac.id,
    },
    {
      status: 'RECEIVED',
      type: 'PARTIAL_REFUND',
      priority: 'LOW',
      reasonCategory: 'Insatisfação',
      reasonDetail: 'Conforto não atendeu expectativas',
      saleChannel: 'MERCADO_LIVRE',
      customerIdx: 2,
      skuIdx: 2,
      quantity: 1,
      carrierId: carrier1.id,
      assignedToId: analyst.id,
    },
    {
      status: 'AWAITING_COLLECTION',
      type: 'RETURN_TO_FACTORY',
      priority: 'CRITICAL',
      reasonCategory: 'Produto Defeituoso',
      reasonDetail: 'Defeito estrutural - mola quebrada',
      saleChannel: 'SHOPEE',
      customerIdx: 3,
      skuIdx: 3,
      quantity: 1,
      carrierId: carrier3.id,
      assignedToId: operational.id,
    },
    {
      status: 'FINALIZED',
      type: 'FULL_REFUND',
      priority: 'MEDIUM',
      reasonCategory: 'Produto Danificado',
      reasonDetail: 'Produto avariado durante entrega',
      saleChannel: 'AMERICANAS',
      customerIdx: 4,
      skuIdx: 4,
      quantity: 2,
      carrierId: carrier2.id,
      assignedToId: sac.id,
      refundAmount: 599.80,
      closedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      status: 'IN_INSPECTION',
      type: 'REUSE',
      priority: 'LOW',
      reasonCategory: 'Produto Defeituoso',
      reasonDetail: 'Tecido com defeito de fabricação',
      saleChannel: 'SLEEPCALM_SITE',
      customerIdx: 5,
      skuIdx: 5,
      quantity: 1,
      carrierId: carrier1.id,
      assignedToId: analyst.id,
    },
    {
      status: 'AWAITING_FINANCIAL',
      type: 'FULL_REFUND',
      priority: 'HIGH',
      reasonCategory: 'Arrependimento',
      reasonDetail: 'Arrependimento - prazo 7 dias',
      saleChannel: 'AMAZON',
      customerIdx: 6,
      skuIdx: 6,
      quantity: 1,
      carrierId: carrier2.id,
      assignedToId: financial.id,
    },
    {
      status: 'REFUND_APPROVED',
      type: 'PARTIAL_REFUND',
      priority: 'MEDIUM',
      reasonCategory: 'Insatisfação',
      reasonDetail: 'Densidade diferente do anunciado',
      saleChannel: 'MAGALU',
      customerIdx: 7,
      skuIdx: 7,
      quantity: 1,
      carrierId: carrier1.id,
      assignedToId: financial.id,
      refundAmount: 149.90,
    },
    {
      status: 'OPEN',
      type: 'EXCHANGE',
      priority: 'CRITICAL',
      reasonCategory: 'Produto Errado',
      reasonDetail: 'Enviou colchão errado - King ao invés de Queen',
      saleChannel: 'VIA_VAREJO',
      customerIdx: 8,
      skuIdx: 8,
      quantity: 1,
      carrierId: carrier3.id,
      assignedToId: sac.id,
    },
    {
      status: 'IN_TRANSIT',
      type: 'DONATION',
      priority: 'LOW',
      reasonCategory: 'Produto Danificado',
      reasonDetail: 'Produto com avarias visíveis para doação',
      saleChannel: 'SLEEPCALM_SITE',
      customerIdx: 9,
      skuIdx: 9,
      quantity: 1,
      carrierId: carrier2.id,
      assignedToId: operational.id,
    },
  ];

  let caseCounter = 1;
  const createdDevolutions = [];

  for (const mock of devolutionsMock) {
    const customer = customers[mock.customerIdx];
    const sku = skus[mock.skuIdx];
    if (!sku) continue;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const caseNumber = `SC-${year}${month}-${String(caseCounter++).padStart(4, '0')}`;

    const slaHours = mock.priority === 'CRITICAL' ? 24 : mock.priority === 'HIGH' ? 48 : mock.priority === 'MEDIUM' ? 72 : 120;
    const slaDueDate = new Date(date.getTime() + slaHours * 60 * 60 * 1000);
    const slaBreached = slaDueDate < new Date() && !['FINALIZED', 'CANCELLED'].includes(mock.status);

    const devolution = await prisma.devolution.create({
      data: {
        caseNumber,
        customerId: customer.id,
        orderNumber: `PED-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        saleChannel: mock.saleChannel,
        orderDate: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
        type: mock.type,
        status: mock.status,
        priority: mock.priority,
        reasonCategory: mock.reasonCategory,
        reasonDetail: mock.reasonDetail,
        carrierId: mock.carrierId,
        assignedToId: mock.assignedToId,
        createdById: sac.id,
        slaHours,
        slaDueDate,
        slaBreached,
        totalValue: parseFloat(sku.unitValue),
        refundAmount: mock.refundAmount || null,
        closedAt: mock.closedAt || null,
        trackingCode: `TR${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        internalNotes: 'Registrado via sistema ERP.',
        items: {
          create: [{
            skuId: sku.id,
            skuCode: sku.code,
            productName: sku.name,
            quantity: mock.quantity,
            unitValue: parseFloat(sku.unitValue),
            totalValue: parseFloat(sku.unitValue) * mock.quantity,
          }],
        },
        statusHistory: {
          create: {
            toStatus: mock.status,
            changedById: sac.id,
            changedByName: sac.name,
            reason: 'Status inicial',
          },
        },
      },
    });
    createdDevolutions.push(devolution);
  }

  console.log(`✅ ${createdDevolutions.length} devoluções criadas!\n`);

  // ============================================================
  // 8. REGISTROS FINANCEIROS
  // ============================================================
  console.log('💰 Criando registros financeiros...');

  for (const dev of createdDevolutions.slice(0, 5)) {
    await prisma.financialRecord.create({
      data: {
        devolutionId: dev.id,
        createdById: financial.id,
        type: 'LOGISTICS',
        description: 'Custo de coleta e transporte',
        amount: parseFloat((Math.random() * 150 + 30).toFixed(2)),
        isExpense: true,
        approved: true,
        approvedAt: new Date(),
        approvedById: supervisor.id,
        paymentMethod: 'PIX',
      },
    });

    if (dev.refundAmount) {
      await prisma.financialRecord.create({
        data: {
          devolutionId: dev.id,
          createdById: financial.id,
          type: 'REFUND',
          description: 'Reembolso ao cliente',
          amount: parseFloat(dev.refundAmount),
          isExpense: true,
          approved: true,
          approvedAt: new Date(),
          approvedById: owner.id,
          paymentMethod: 'PIX',
          paymentDate: new Date(),
        },
      });
    }
  }

  console.log('✅ Registros financeiros criados!\n');

  // ============================================================
  // 9. PEDIDOS LALAMOVE
  // ============================================================
  console.log('🚗 Criando pedidos Lalamove...');

  const lalamoveStatuses = ['PENDING', 'ASSIGNING_DRIVER', 'ON_GOING', 'COMPLETED', 'COMPLETED'];

  for (let i = 0; i < Math.min(5, createdDevolutions.length); i++) {
    const dev = createdDevolutions[i];
    await prisma.lalamoveOrder.create({
      data: {
        devolutionId: dev.id,
        carrierId: carrier3.id,
        requestedById: operational.id,
        status: lalamoveStatuses[i],
        pickupAddress: `${customers[i].city} - ${customers[i].state}, Brasil`,
        pickupContact: customers[i].name,
        pickupPhone: customers[i].phone || '(11) 99999-0000',
        deliveryAddress: 'Rua da Fábrica SleepCalm, 1000 - São Paulo, SP',
        deliveryContact: 'Recebimento SleepCalm',
        deliveryPhone: '(11) 99999-0000',
        vehicleType: 'VAN',
        quotedPrice: parseFloat((Math.random() * 200 + 80).toFixed(2)),
        finalPrice: lalamoveStatuses[i] === 'COMPLETED' ? parseFloat((Math.random() * 200 + 80).toFixed(2)) : null,
        completedAt: lalamoveStatuses[i] === 'COMPLETED' ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  console.log('✅ Pedidos Lalamove criados!\n');

  // ============================================================
  // 10. ANÁLISES TÉCNICAS
  // ============================================================
  console.log('🔬 Criando análises técnicas...');

  for (const dev of createdDevolutions.slice(0, 3)) {
    const existing = await prisma.technicalAnalysis.findUnique({ where: { devolutionId: dev.id } });
    if (existing) continue;

    await prisma.technicalAnalysis.create({
      data: {
        devolutionId: dev.id,
        analystId: analyst.id,
        problems: ['STRUCTURAL_DEFECT', 'SINKING'],
        description: 'Análise visual identificou sinais de afundamento e comprometimento estrutural. Espuma com deformação permanente superior a 10%.',
        conclusion: 'Produto com defeito de fabricação. Afundamento prematuro incompatível com o uso normal.',
        recommendation: 'Reembolso integral ao cliente ou substituição do produto.',
        productCondition: 'Defeituoso',
        repairPossible: false,
        estimatedLoss: parseFloat((Math.random() * 1000 + 500).toFixed(2)),
        approved: true,
        approvedById: supervisor.id,
        approvedAt: new Date(),
        approverNotes: 'Análise aprovada. Autorizado reembolso integral.',
      },
    });
  }

  console.log('✅ Análises técnicas criadas!\n');

  // ============================================================
  // 11. DOAÇÕES
  // ============================================================
  console.log('🎁 Criando registros de doações...');

  if (createdDevolutions.length > 0) {
    await prisma.donation.create({
      data: {
        devolutionId: createdDevolutions[createdDevolutions.length - 1].id,
        createdById: supervisor.id,
        institution: 'Casa de Acolhimento São Francisco',
        institutionContact: 'Irmã Maria José',
        institutionPhone: '(11) 3333-5555',
        products: [{ name: 'Colchão SleepCalm', quantity: 1, condition: 'Avariado mas utilizável' }],
        estimatedValue: 299.90,
        status: 'APPROVED',
        reason: 'Produto com avaria superficial, ainda utilizável para doação',
        approvedById: owner.id,
        approvedAt: new Date(),
        notes: 'Doação aprovada pela diretoria.',
      },
    });
  }

  console.log('✅ Doações criadas!\n');

  // ============================================================
  // 12. COMENTÁRIOS
  // ============================================================
  console.log('💬 Criando comentários internos...');

  if (createdDevolutions.length > 0) {
    const dev = createdDevolutions[0];
    await prisma.comment.createMany({
      data: [
        {
          devolutionId: dev.id,
          userId: sac.id,
          content: 'Cliente relatou que o produto afundou após 2 meses. Solicitando fotos do defeito.',
          isInternal: false,
        },
        {
          devolutionId: dev.id,
          userId: analyst.id,
          content: 'Analisando o caso. Aguardando fotos do cliente para identificar o tipo de defeito.',
          isInternal: true,
        },
        {
          devolutionId: dev.id,
          userId: supervisor.id,
          content: 'Priorizar este caso - cliente VIP. Resolver em até 48h.',
          isInternal: true,
        },
      ],
    });
  }

  console.log('✅ Comentários criados!\n');

  // ============================================================
  // 13. NOTIFICAÇÕES
  // ============================================================
  console.log('🔔 Criando notificações...');

  await prisma.notification.createMany({
    data: [
      {
        userId: analyst.id,
        sentById: supervisor.id,
        type: 'ASSIGNMENT',
        title: 'Nova devolução atribuída',
        message: 'Caso SC-2024 atribuído a você. Prazo: 48 horas.',
        isRead: false,
      },
      {
        userId: financial.id,
        sentById: supervisor.id,
        type: 'FINANCIAL_ALERT',
        title: 'Aprovação financeira pendente',
        message: '3 reembolsos aguardando aprovação financeira.',
        isRead: false,
      },
      {
        userId: operational.id,
        sentById: admin.id,
        type: 'SLA_ALERT',
        title: 'SLA em risco',
        message: '2 casos com SLA próximo ao vencimento.',
        isRead: false,
      },
    ],
  });

  console.log('✅ Notificações criadas!\n');

  // ============================================================
  // 14. CONFIGURAÇÕES DO SISTEMA
  // ============================================================
  console.log('⚙️  Criando configurações do sistema...');

  const configs = [
    { key: 'company_name', value: 'SleepCalm', type: 'STRING', label: 'Nome da Empresa', category: 'GENERAL' },
    { key: 'company_cnpj', value: '00.000.000/0001-00', type: 'STRING', label: 'CNPJ', category: 'GENERAL' },
    { key: 'default_sla_hours', value: '72', type: 'NUMBER', label: 'SLA Padrão (horas)', category: 'OPERATIONAL' },
    { key: 'critical_sla_hours', value: '24', type: 'NUMBER', label: 'SLA Crítico (horas)', category: 'OPERATIONAL' },
    { key: 'max_upload_size_mb', value: '50', type: 'NUMBER', label: 'Tamanho Máx. Upload (MB)', category: 'SYSTEM' },
    { key: 'notification_email', value: 'erp@sleepcalm.com.br', type: 'STRING', label: 'E-mail de Notificações', category: 'NOTIFICATIONS' },
    { key: 'factory_address', value: 'Rua da Fábrica SleepCalm, 1000 - São Paulo, SP', type: 'STRING', label: 'Endereço da Fábrica', category: 'OPERATIONAL' },
    { key: 'theme_primary_color', value: '#1a1a2e', type: 'STRING', label: 'Cor Primária', category: 'UI' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log('✅ Configurações criadas!\n');

  // ============================================================
  // RESUMO FINAL
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log('\n📋 CREDENCIAIS DE ACESSO:');
  console.log('');
  console.log('👑 Proprietário:     owner@sleepcalm.com.br');
  console.log('🔧 Administrador:    admin@sleepcalm.com.br');
  console.log('👀 Supervisor:       supervisor@sleepcalm.com.br');
  console.log('🔍 Analista:         analista@sleepcalm.com.br');
  console.log('💰 Financeiro:       financeiro@sleepcalm.com.br');
  console.log('📞 SAC:              sac@sleepcalm.com.br');
  console.log('🚛 Operacional:      operacional@sleepcalm.com.br');
  console.log('');
  console.log('🔑 Senha padrão:     SleepCalm@2024');
  console.log('');
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
