/**
 * Controller de Relatórios - PDF e Excel
 */
const { prisma } = require('../utils/prisma');
const { errorResponse } = require('../utils/response');
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

const REPORTS_DIR = path.join(__dirname, '../../reports/generated');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

/**
 * Relatório de Devoluções
 */
exports.devolutionsReport = async (req, res) => {
  const { format = 'pdf', dateFrom, dateTo, status } = req.query;

  const where = {};
  if (status) where.status = status;
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const devolutions = await prisma.devolution.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: true,
      assignedTo: { select: { name: true } },
      carrier: { select: { name: true } },
    },
  });

  if (format === 'excel') {
    const data = devolutions.map(d => ({
      'Caso': d.caseNumber,
      'Status': d.status,
      'Tipo': d.type,
      'Prioridade': d.priority,
      'Cliente': d.customer.name,
      'Pedido': d.orderNumber,
      'Canal': d.saleChannel,
      'Motivo': d.reasonCategory,
      'Valor Total': parseFloat(d.totalValue),
      'Reembolso': parseFloat(d.refundAmount || 0),
      'Recuperado': parseFloat(d.recoveredAmount || 0),
      'SLA Vencido': d.slaBreached ? 'Sim' : 'Não',
      'Responsável': d.assignedTo?.name || '-',
      'Transportadora': d.carrier?.name || '-',
      'Criado em': dayjs(d.createdAt).format('DD/MM/YYYY HH:mm'),
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Devoluções');

    const fileName = `devolutions_${Date.now()}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    xlsx.writeFile(wb, filePath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  }

  // PDF Report
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const fileName = `devolutions_${Date.now()}.pdf`;
  const filePath = path.join(REPORTS_DIR, fileName);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(20).fillColor('#1a1a2e').text('SleepCalm ERP', { align: 'center' });
  doc.fontSize(14).fillColor('#16213e').text('Relatório de Devoluções', { align: 'center' });
  doc.fontSize(10).fillColor('#666').text(`Gerado em: ${dayjs().format('DD/MM/YYYY HH:mm')} | Total: ${devolutions.length} registros`, { align: 'center' });
  doc.moveDown(2);

  // Tabela
  const tableTop = doc.y;
  const cols = [80, 100, 80, 80, 120, 80, 80, 80];
  const headers = ['Caso', 'Cliente', 'Status', 'Tipo', 'Motivo', 'Valor', 'Reembolso', 'SLA'];

  // Header row
  doc.fontSize(8).fillColor('#ffffff');
  let xPos = 40;
  headers.forEach((h, i) => {
    doc.rect(xPos, tableTop, cols[i], 20).fill('#1a1a2e');
    doc.fillColor('#ffffff').text(h, xPos + 3, tableTop + 5, { width: cols[i] - 6 });
    xPos += cols[i];
  });

  // Data rows
  let y = tableTop + 20;
  devolutions.slice(0, 50).forEach((d, idx) => {
    if (y > 520) {
      doc.addPage({ size: 'A4', layout: 'landscape' });
      y = 40;
    }
    const bg = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
    xPos = 40;
    const rowData = [
      d.caseNumber,
      d.customer.name.substring(0, 15),
      d.status,
      d.type,
      d.reasonCategory.substring(0, 18),
      `R$ ${parseFloat(d.totalValue).toFixed(2)}`,
      `R$ ${parseFloat(d.refundAmount || 0).toFixed(2)}`,
      d.slaBreached ? 'VENCIDO' : 'OK',
    ];

    rowData.forEach((cell, i) => {
      doc.rect(xPos, y, cols[i], 18).fill(bg).stroke('#e0e0e0');
      doc.fillColor(d.slaBreached && i === 7 ? '#dc2626' : '#333').fontSize(7)
        .text(String(cell), xPos + 3, y + 4, { width: cols[i] - 6 });
      xPos += cols[i];
    });
    y += 18;
  });

  doc.end();

  stream.on('finish', () => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);
  });
};

/**
 * Relatório Financeiro
 */
exports.financialReport = async (req, res) => {
  const { format = 'excel', dateFrom, dateTo } = req.query;

  const where = {};
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo + 'T23:59:59') };

  const records = await prisma.financialRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      devolution: { select: { caseNumber: true, orderNumber: true, customer: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
  });

  const data = records.map(r => ({
    'Caso': r.devolution.caseNumber,
    'Pedido': r.devolution.orderNumber,
    'Cliente': r.devolution.customer.name,
    'Tipo': r.type,
    'Descrição': r.description,
    'Valor': parseFloat(r.amount),
    'Tipo Movimento': r.isExpense ? 'Despesa' : 'Receita',
    'Aprovado': r.approved ? 'Sim' : 'Não',
    'Criado por': r.createdBy.name,
    'Data': dayjs(r.createdAt).format('DD/MM/YYYY'),
  }));

  if (format === 'excel') {
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Financeiro');
    const fileName = `financial_${Date.now()}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    xlsx.writeFile(wb, filePath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  }

  return res.json({ success: true, data, total: records.length });
};

/**
 * Relatório SLA
 */
exports.slaReport = async (req, res) => {
  const { format = 'excel' } = req.query;

  const devolutions = await prisma.devolution.findMany({
    where: { status: { notIn: ['CANCELLED'] } },
    select: {
      caseNumber: true, status: true, priority: true, slaHours: true,
      slaDueDate: true, slaBreached: true, createdAt: true, closedAt: true,
      customer: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  const data = devolutions.map(d => ({
    'Caso': d.caseNumber,
    'Status': d.status,
    'Prioridade': d.priority,
    'Cliente': d.customer.name,
    'SLA Horas': d.slaHours,
    'Prazo SLA': dayjs(d.slaDueDate).format('DD/MM/YYYY HH:mm'),
    'Status SLA': d.slaBreached ? 'VENCIDO' : 'OK',
    'Responsável': d.assignedTo?.name || '-',
    'Criado em': dayjs(d.createdAt).format('DD/MM/YYYY'),
    'Finalizado em': d.closedAt ? dayjs(d.closedAt).format('DD/MM/YYYY') : '-',
  }));

  if (format === 'excel') {
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'SLA');
    const fileName = `sla_${Date.now()}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    xlsx.writeFile(wb, filePath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  }

  return res.json({ success: true, data });
};

/**
 * Relatório Operacional
 */
exports.operationalReport = async (req, res) => {
  const { format = 'excel' } = req.query;

  const [byStatus, byType, byChannel, bySLA] = await Promise.all([
    prisma.devolution.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.devolution.groupBy({ by: ['type'], _count: { id: true }, _sum: { totalValue: true } }),
    prisma.devolution.groupBy({ by: ['saleChannel'], _count: { id: true } }),
    prisma.devolution.groupBy({ by: ['slaBreached'], _count: { id: true } }),
  ]);

  if (format === 'excel') {
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(byStatus.map(r => ({ Status: r.status, Total: r._count.id }))), 'Por Status');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(byType.map(r => ({ Tipo: r.type, Total: r._count.id, Valor: parseFloat(r._sum.totalValue || 0) }))), 'Por Tipo');
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(byChannel.map(r => ({ Canal: r.saleChannel, Total: r._count.id }))), 'Por Canal');

    const fileName = `operational_${Date.now()}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    xlsx.writeFile(wb, filePath);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.sendFile(filePath);
  }

  return res.json({ success: true, data: { byStatus, byType, byChannel, bySLA } });
};
