// models/adminModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');
const bcrypt = require('bcrypt');

const TABLE = 'admin';
const SALT_ROUNDS = 10;

// ============================================================================
// VALIDAR LOGIN
// ============================================================================
async function validarLogin(email, senha) {
  const admins = await goData.get({
    table: TABLE,
    where: { email },
    limit: 1
  });

  const admin = admins[0];
  if (!admin) return null;

  const senhaValida = await bcrypt.compare(senha, admin.senha_hash);
  if (!senhaValida) return null;

  return admin;
}

// ============================================================================
// LISTAR TODOS OS ADMINS
// ============================================================================
async function listarAdmins() {
  return await goData.get({
    table: TABLE,
    select: ['id', 'nome', 'email', 'criado_em'],
    order_by: 'criado_em DESC'
  });
}

// ============================================================================
// CRIAR ADMIN
// ============================================================================
async function criarAdmin(nome, email, senha) {
  const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

  return await goData.insert({
    table: TABLE,
    data: {
      nome,
      email,
      senha_hash
    }
  });
}

// ============================================================================
// ATUALIZAR DADOS DO ADMIN
// ============================================================================
async function atualizarAdmin(id, nome, email) {
  await goData.update({
    table: TABLE,
    data: { nome, email },
    where: { id }
  });
}

// ============================================================================
// ATUALIZAR SENHA
// ============================================================================
async function atualizarSenha(id, novaSenha) {
  const senha_hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

  await goData.update({
    table: TABLE,
    data: { senha_hash },
    where: { id }
  });
}

// ============================================================================
// DELETAR ADMIN
// ============================================================================
async function deletarAdmin(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// CONTAR TOTAL DE ADMINS
// ============================================================================
async function contarAdmins() {
  const total = await goData.aggregate({
    table: TABLE,
    operation: 'COUNT'
  });

  return total;
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  validarLogin,
  listarAdmins,
  criarAdmin,
  atualizarAdmin,
  atualizarSenha,
  deletarAdmin,
  contarAdmins
};