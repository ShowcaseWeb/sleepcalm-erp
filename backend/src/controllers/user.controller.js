/**
 * Controller de Usuários com RBAC
 */
const bcrypt = require('bcryptjs');
const { prisma } = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

exports.list = async (req, res) => {
  const { page, limit, search, role, isActive } = req.query;
  const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        permissions: true,
        _count: {
          select: {
            devolutionsCreated: true,
            devolutionsAssigned: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const safePUsers = users.map(({ password, refreshToken, passwordResetToken, ...user }) => user);

  return paginatedResponse(res, safePUsers, buildPaginationMeta(total, pageNum, limitNum));
};

exports.getById = async (req, res) => {
  const { id } = req.params;

  // Usuário só pode ver o próprio perfil (exceto admins)
  if (req.user.id !== id && !['OWNER', 'ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
    return errorResponse(res, 'Acesso negado.', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      permissions: true,
      _count: {
        select: {
          devolutionsCreated: true,
          devolutionsAssigned: true,
          comments: true,
        },
      },
    },
  });

  if (!user) return errorResponse(res, 'Usuário não encontrado.', 404);

  const { password, refreshToken, passwordResetToken, ...safe } = user;
  return successResponse(res, safe);
};

exports.create = async (req, res) => {
  const { name, email, password, role, phone, department, permissions } = req.body;

  if (!name || !email || !password || !role) {
    return errorResponse(res, 'Nome, e-mail, senha e perfil são obrigatórios.', 400);
  }

  if (password.length < 8) {
    return errorResponse(res, 'Senha deve ter pelo menos 8 caracteres.', 400);
  }

  // Owner não pode ser criado via API
  if (role === 'OWNER') {
    return errorResponse(res, 'Não é permitido criar usuários com perfil Owner.', 403);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return errorResponse(res, 'E-mail já cadastrado.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone,
      department,
      permissions: permissions
        ? { create: permissions.map(p => ({ permission: p })) }
        : undefined,
    },
    include: { permissions: true },
  });

  const { password: _, refreshToken: __, ...safe } = user;
  return successResponse(res, safe, 'Usuário criado com sucesso.', 201);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, role, phone, department, avatar } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return errorResponse(res, 'Usuário não encontrado.', 404);

  // Não pode alterar o próprio role
  if (req.user.id === id && role && role !== user.role) {
    return errorResponse(res, 'Você não pode alterar o próprio perfil.', 403);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(role && { role }),
      ...(phone !== undefined && { phone }),
      ...(department !== undefined && { department }),
      ...(avatar !== undefined && { avatar }),
    },
    include: { permissions: true },
  });

  const { password: _, refreshToken: __, ...safe } = updated;
  return successResponse(res, safe, 'Usuário atualizado.');
};

exports.updatePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return errorResponse(res, 'Permissões devem ser um array.', 400);
  }

  await prisma.userPermission.deleteMany({ where: { userId: id } });

  if (permissions.length > 0) {
    await prisma.userPermission.createMany({
      data: permissions.map(p => ({ userId: id, permission: p, grantedBy: req.user.id })),
    });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { permissions: true },
  });

  const { password: _, ...safe } = user;
  return successResponse(res, safe, 'Permissões atualizadas.');
};

exports.toggleActive = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return errorResponse(res, 'Você não pode desativar a própria conta.', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return errorResponse(res, 'Usuário não encontrado.', 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  return successResponse(res, { isActive: updated.isActive },
    `Usuário ${updated.isActive ? 'ativado' : 'desativado'} com sucesso.`
  );
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    return errorResponse(res, 'Você não pode excluir a própria conta.', 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return errorResponse(res, 'Usuário não encontrado.', 404);

  if (user.role === 'OWNER') {
    return errorResponse(res, 'Não é possível excluir o proprietário.', 403);
  }

  await prisma.user.delete({ where: { id } });
  return successResponse(res, null, 'Usuário excluído.');
};
