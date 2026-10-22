// models/orariosNullModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'orarios_null';

// ============================================================================
// LISTAR HORÁRIOS BLOQUEADOS (APENAS DATAS >= HOJE)
// ============================================================================
async function listarOrariosBloqueados(profissional_id, data) {
  if (!profissional_id || !data) return [];

  const hoje = new Date().toISOString().split('T')[0];
  
  // Não retorna horários de datas passadas
  if (data < hoje) return [];

  return await goData.get({
    table: TABLE,
    where: {
      profissional_id,
      data
    },
    order_by: 'hora ASC'
  });
}

// ============================================================================
// CRIAR HORÁRIO BLOQUEADO
// ============================================================================
async function criarHorarioBloqueado(profissional_id, data, hora, motivo = null) {
  const hoje = new Date().toISOString().split('T')[0];
  
  // Não permite adicionar horário no passado
  if (data < hoje) {
    throw new Error('Não é possível bloquear horários em datas passadas');
  }

  return await goData.insert({
    table: TABLE,
    data: {
      profissional_id,
      data,
      hora,
      motivo
    }
  });
}

// ============================================================================
// DELETAR HORÁRIO BLOQUEADO
// ============================================================================
async function deletarHorarioBloqueado(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// VERIFICAR SE HORÁRIO ESTÁ BLOQUEADO
// ============================================================================
async function verificarHoraBloqueada(profissional_id, data, hora) {
  const bloqueios = await goData.get({
    table: TABLE,
    where: {
      profissional_id,
      data,
      hora
    },
    limit: 1
  });

  return bloqueios.length > 0;
}

// ============================================================================
// BUSCAR HORÁRIO BLOQUEADO POR ID
// ============================================================================
async function buscarHorarioBloqueadoPorId(id) {
  const bloqueios = await goData.get({
    table: TABLE,
    where: { id },
    limit: 1
  });

  return bloqueios[0] || null;
}

// ============================================================================
// LISTAR TODOS OS HORÁRIOS BLOQUEADOS DE UM PROFISSIONAL
// ============================================================================
async function listarTodosHorariosBloqueados(profissional_id) {
  return await goData.get({
    table: TABLE,
    where: { profissional_id },
    order_by: 'data DESC, hora ASC'
  });
}

// ============================================================================
// DELETAR MÚLTIPLOS HORÁRIOS BLOQUEADOS
// ============================================================================
async function deletarHorariosPorData(profissional_id, data) {
  const bloqueios = await goData.get({
    table: TABLE,
    where: {
      profissional_id,
      data
    }
  });

  // Deletar cada um individualmente
  for (let bloqueio of bloqueios) {
    await deletarHorarioBloqueado(bloqueio.id);
  }

  return bloqueios.length;
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  listarOrariosBloqueados,
  criarHorarioBloqueado,
  deletarHorarioBloqueado,
  verificarHoraBloqueada,
  buscarHorarioBloqueadoPorId,
  listarTodosHorariosBloqueados,
  deletarHorariosPorData
};