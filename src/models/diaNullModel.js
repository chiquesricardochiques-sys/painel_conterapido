// models/diaNullModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'dia_null';

// ============================================================================
// LISTAR DIAS BLOQUEADOS (A PARTIR DE HOJE)
// ============================================================================
async function listarDiasBloqueados(profissional_id) {
  const hoje = new Date().toISOString().split('T')[0];

  const bloqueios = await goData.get({
    table: TABLE,
    where: { profissional_id },
    order_by: 'data ASC'
  });

  // Filtrar apenas datas >= hoje
  return bloqueios.filter(b => b.data >= hoje);
}

// ============================================================================
// CRIAR DIA BLOQUEADO
// ============================================================================
async function criarDiaBloqueado(profissional_id, data, motivo = null) {
  const hoje = new Date().toISOString().split('T')[0];
  
  // Não permite datas passadas
  if (data < hoje) {
    throw new Error('Não é possível bloquear datas passadas');
  }

  return await goData.insert({
    table: TABLE,
    data: {
      profissional_id,
      data,
      motivo
    }
  });
}

// ============================================================================
// DELETAR DIA BLOQUEADO
// ============================================================================
async function deletarDiaBloqueado(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// VERIFICAR SE UM DIA ESTÁ BLOQUEADO
// ============================================================================
async function verificarDiaBloqueado(profissional_id, data) {
  const bloqueios = await goData.get({
    table: TABLE,
    where: {
      profissional_id,
      data
    },
    limit: 1
  });

  return bloqueios.length > 0;
}

// ============================================================================
// BUSCAR DIA BLOQUEADO POR ID
// ============================================================================
async function buscarDiaBloqueadoPorId(id) {
  const bloqueios = await goData.get({
    table: TABLE,
    where: { id },
    limit: 1
  });

  return bloqueios[0] || null;
}

// ============================================================================
// LISTAR TODOS OS DIAS BLOQUEADOS (ADMIN)
// ============================================================================
async function listarTodosDiasBloqueados(profissional_id) {
  return await goData.get({
    table: TABLE,
    where: { profissional_id },
    order_by: 'data DESC'
  });
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  listarDiasBloqueados,
  criarDiaBloqueado,
  deletarDiaBloqueado,
  verificarDiaBloqueado,
  buscarDiaBloqueadoPorId,
  listarTodosDiasBloqueados
};