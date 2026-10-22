// models/clientModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;
const TABLE = 'clientes'; // prefixo salao_beleza_ é adicionado automaticamente

// ============================================================================
// CRIAR NOVO CLIENTE
// ============================================================================
async function criarCliente(nome, email, telefone, senha) {
  const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

  // Monta os dados que vamos enviar
  const clienteData = {
    nome,
    email,
    telefone,
    senha_hash
  };

  // Log para depuração
  console.log('Dados que serão enviados para inserção:', clienteData);

  const result = await goData.insert({
    table: TABLE,
    data: clienteData
  });

  // Log do resultado da inserção
  console.log('Resultado da inserção:', result);

  return result;
}

// ============================================================================
// BUSCAR CLIENTE POR EMAIL
// ============================================================================
async function buscarClientePorEmail(email) {
  const clientes = await goData.get({
    table: TABLE,
    where: { email },
    limit: 1
  });

  return clientes[0] || null;
}

// ============================================================================
// VALIDAR LOGIN
// ============================================================================
async function validarLogin(email, senha) {
  const cliente = await buscarClientePorEmail(email);
  
  if (!cliente) return null;

  const senhaValida = await bcrypt.compare(senha, cliente.senha_hash);
  
  if (!senhaValida) return null;

  return cliente;
}

// ============================================================================
// ATUALIZAR PERFIL
// ============================================================================
async function atualizarPerfil(id, nome, email, telefone, senha = null) {
  const data = { nome, email, telefone };

  // Se forneceu senha, criptografa
  if (senha && senha.trim() !== '') {
    data.senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
  }

  await goData.update({
    table: TABLE,
    data,
    where: { id }
  });
}

// ============================================================================
// GERAR TOKEN DE RECUPERAÇÃO
// ============================================================================
async function salvarTokenRecuperacao(email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await goData.update({
    table: TABLE,
    data: {
      reset_token: token,
      reset_token_expira: expira
    },
    where: { email }
  });

  return token;
}

// ============================================================================
// BUSCAR CLIENTE POR TOKEN
// ============================================================================
async function buscarPorToken(token) {
  const clientes = await goData.get({
    table: TABLE,
    where: { reset_token: token },
    limit: 1
  });

  const cliente = clientes[0];

  // Verifica se o token ainda é válido
  if (cliente && new Date(cliente.reset_token_expira) > new Date()) {
    return cliente;
  }

  return null;
}

// ============================================================================
// ATUALIZAR SENHA
// ============================================================================
async function atualizarSenha(id, senha) {
  const hash = await bcrypt.hash(senha, SALT_ROUNDS);

  await goData.update({
    table: TABLE,
    data: {
      senha_hash: hash,
      reset_token: null,
      reset_token_expira: null
    },
    where: { id }
  });
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  criarCliente,
  buscarClientePorEmail,
  validarLogin,
  atualizarPerfil,
  salvarTokenRecuperacao,
  buscarPorToken,
  atualizarSenha
};