// models/professionalScheduleModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'professional_schedule';

// ============================================================================
// LISTAR GRADE SEMANAL DO PROFISSIONAL
// ============================================================================
async function listarGradeProfissional(profissional_id) {
  const grade = await goData.get({
    table: TABLE,
    where: { profissional_id }
  });

  // Ordenar manualmente por dia da semana
  const ordensDias = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, dom: 7 };
  
  return grade.sort((a, b) => ordensDias[a.dia_semana] - ordensDias[b.dia_semana]);
}

// ============================================================================
// LISTAR GRADE SEMANAL (ALIAS PARA COMPATIBILIDADE)
// ============================================================================
async function listarProfessionalSchedule(profissional_id) {
  return await listarGradeProfissional(profissional_id);
}

// ============================================================================
// CRIAR OU ATUALIZAR GRADE DE UM DIA
// ============================================================================
async function criarOuAtualizarGrade(
  profissional_id,
  dia_semana,
  abre,
  abertura,
  pausa_inicio,
  pausa_fim,
  fechamento
) {
  // Verificar se já existe
  const existente = await goData.get({
    table: TABLE,
    where: {
      profissional_id,
      dia_semana
    },
    limit: 1
  });

  const data = {
    abre,
    abertura,
    pausa_inicio,
    pausa_fim,
    fechamento
  };

  if (existente.length > 0) {
    // Atualizar
    await goData.update({
      table: TABLE,
      data,
      where: {
        profissional_id,
        dia_semana
      }
    });
  } else {
    // Inserir
    await goData.insert({
      table: TABLE,
      data: {
        profissional_id,
        dia_semana,
        ...data
      }
    });
  }
}

// ============================================================================
// ATUALIZAR GRADE SEMANAL COMPLETA
// ============================================================================
async function atualizarProfessionalSchedule(profissional_id, dados) {
  const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

  for (let dia of dias) {
    const abre = dados[`${dia}_abre`] === 'on' ? 1 : 0;
    const abertura = dados[`${dia}_abertura`] || '09:00:00';
    const pausa_inicio = dados[`${dia}_pausa_inicio`] || null;
    const pausa_fim = dados[`${dia}_pausa_fim`] || null;
    const fechamento = dados[`${dia}_fechamento`] || '18:00:00';

    await criarOuAtualizarGrade(
      profissional_id,
      dia,
      abre,
      abertura,
      pausa_inicio,
      pausa_fim,
      fechamento
    );
  }
}

// ============================================================================
// DELETAR GRADE DE UM DIA
// ============================================================================
async function deletarGrade(profissional_id, dia_semana) {
  await goData.remove({
    table: TABLE,
    where: {
      profissional_id,
      dia_semana
    },
    mode: 'hard'
  });
}

// ============================================================================
// BUSCAR GRADE DE UM DIA ESPECÍFICO
// ============================================================================
async function buscarGradeDia(profissional_id, dia_semana) {
  const grades = await goData.get({
    table: TABLE,
    where: {
      profissional_id,
      dia_semana
    },
    limit: 1
  });

  return grades[0] || null;
}

// ============================================================================
// VERIFICAR SE PROFISSIONAL TRABALHA EM UM DIA
// ============================================================================
async function verificaTrabalhaEmDia(profissional_id, dia_semana) {
  const grade = await buscarGradeDia(profissional_id, dia_semana);
  
  return grade && grade.abre === 1;
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  listarGradeProfissional,
  listarProfessionalSchedule,
  criarOuAtualizarGrade,
  atualizarProfessionalSchedule,
  deletarGrade,
  buscarGradeDia,
  verificaTrabalhaEmDia
};