/**
 * Gerador de Número de Caso Único
 */

const { prisma } = require('./prisma');

const generateCaseNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Contar devoluções do mês atual
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.devolution.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `SC-${year}${month}-${sequence}`;
};

module.exports = { generateCaseNumber };
