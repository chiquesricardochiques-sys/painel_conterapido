// models/dashboardModel.js
const goData = require('../services/goData.service.js');

function hojeSQL() {
  return new Date().toISOString().split('T')[0];
}

function horaAgoraSQL() {
  const agora = new Date();
  const h = agora.getHours().toString().padStart(2, '0');
  const m = agora.getMinutes().toString().padStart(2, '0');
  const s = agora.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * ====================================================
 * TOTAL DE AGENDAMENTOS DE HOJE
 * ====================================================
 */
async function totalAgendamentosHoje() {
  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      data: hojeSQL(),
      status: 'agendado'
    },
    select: ['id']
  });

  console.log('Agendamentos de hoje:', agendamentos.length);
  return agendamentos.length;
}

/**
 * ====================================================
 * TOTAL DE AGENDAMENTOS DA SEMANA
 * ====================================================
 */
async function totalAgendamentosSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay() || 7; // domingo = 7
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diaSemana + 1);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  const dataInicio = inicio.toISOString().split('T')[0];
  const dataFim = fim.toISOString().split('T')[0];

  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: { status: 'agendado' },
    select: ['id', 'data']
  });

  const daSemana = agendamentos.filter(
    a => a.data >= dataInicio && a.data <= dataFim
  );

  console.log('Agendamentos da semana:', daSemana.length);
  return daSemana.length;
}

/**
 * ====================================================
 * LISTAR AGENDA DE UMA DATA ESPECÍFICA
 * 🔧 antes era só "de hoje" (fixo). Agora recebe a data como
 * parâmetro — quem quiser "hoje" chama listarAgendaHoje(), que
 * é só um atalho pra esta função com hojeSQL().
 * ====================================================
 */
async function listarAgendaPorData(data) {

  const linhas = await goData.get({
    table: 'agendamentos',
    alias: 'a',
    select: [
      'a.id',
      'a.hora',
      'a.observacoes',
      'c.nome as cliente_nome',
      'p.nome as profissional_nome',
      's.nome as servico_nome',
      's.duracao_min'
    ],
    joins: [
      { type: 'INNER', table: 'clientes', alias: 'c', on: 'a.cliente_id = c.id' },
      { type: 'INNER', table: 'profissionais', alias: 'p', on: 'a.profissional_id = p.id' },
      { type: 'INNER', table: 'agendamento_servicos', alias: 'ags', on: 'a.id = ags.agendamento_id' },
      { type: 'INNER', table: 'servicos', alias: 's', on: 'ags.servico_id = s.id' }
    ],
    where: {
      'a.data': data,
      'a.status': 'agendado'
    },
    order_by: 'a.hora ASC'
  });

  console.log(`Linhas da agenda de ${data} (1 por serviço):`, linhas.length);

  // agrupa por agendamento, somando duração e listando os serviços
  const mapa = new Map();
  for (const linha of linhas) {
    if (!mapa.has(linha.id)) {
      mapa.set(linha.id, {
        id: linha.id,
        data,                        // necessário pro data-date do template/script
        hora: linha.hora,
        cliente: linha.cliente_nome || 'N/A',
        profissional: linha.profissional_nome || 'N/A',
        servicos: [],
        duracao_total: 0,
        observacoes: linha.observacoes
      });
    }

    const item = mapa.get(linha.id);
    item.servicos.push(linha.servico_nome || 'N/A');
    item.duracao_total += Number(linha.duracao_min);
  }

  const agendamentos = Array.from(mapa.values());
  console.log(`Agendamentos de ${data} (agrupados):`, agendamentos.length);

  return agendamentos;
}

/**
 * ====================================================
 * LISTAR AGENDA DE HOJE (atalho pra listarAgendaPorData)
 * ====================================================
 */
async function listarAgendaHoje() {
  return listarAgendaPorData(hojeSQL());
}
async function listarAgendamentos(status = 'todos') {
  const where = {};

  if (status && status !== 'todos') {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error(`Status inválido: ${status}`);
    }
    where['a.status'] = status;
  }

  const linhas = await goData.get({
    table: 'agendamentos',
    alias: 'a',
    select: [
      'a.id',
      'a.data',
      'a.hora',
      'a.status',
      'a.observacoes',
      'c.nome as cliente_nome',
      'p.nome as profissional_nome',
      's.nome as servico_nome',
      's.duracao_min',
      's.preco as servico_preco'
    ],
    joins: [
      { type: 'INNER', table: 'clientes', alias: 'c', on: 'a.cliente_id = c.id' },
      { type: 'INNER', table: 'profissionais', alias: 'p', on: 'a.profissional_id = p.id' },
      { type: 'INNER', table: 'agendamento_servicos', alias: 'ags', on: 'a.id = ags.agendamento_id' },
      { type: 'INNER', table: 'servicos', alias: 's', on: 'ags.servico_id = s.id' }
    ],
    where,
    order_by: 'a.data DESC, a.hora DESC'
  });

  const mapa = new Map();
  for (const linha of linhas) {
    if (!mapa.has(linha.id)) {
      mapa.set(linha.id, {
        id: linha.id,
        data: linha.data,
        hora: linha.hora,
        status: linha.status,
        cliente: linha.cliente_nome || 'N/A',
        profissional: linha.profissional_nome || 'N/A',
        servicos: [],
        duracao_total: 0,
        preco_total: 0,
        observacoes: linha.observacoes
      });
    }

    const item = mapa.get(linha.id);
    item.servicos.push(linha.servico_nome || 'N/A');
    item.duracao_total += Number(linha.duracao_min);
    item.preco_total += Number(linha.servico_preco || 0);
  }

  return Array.from(mapa.values());
}


async function listarAgendaPorDataEStatus(data, status = 'todos') {
  const where = { 'a.data': data };

  if (status && status !== 'todos') {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error(`Status inválido: ${status}`);
    }
    where['a.status'] = status;
  }

  const linhas = await goData.get({
    table: 'agendamentos',
    alias: 'a',
    select: [
      'a.id',
      'a.hora',
      'a.status',
      'a.observacoes',
      'c.nome as cliente_nome',
      'p.nome as profissional_nome',
      's.nome as servico_nome',
      's.duracao_min'
    ],
    joins: [
      { type: 'INNER', table: 'clientes', alias: 'c', on: 'a.cliente_id = c.id' },
      { type: 'INNER', table: 'profissionais', alias: 'p', on: 'a.profissional_id = p.id' },
      { type: 'INNER', table: 'agendamento_servicos', alias: 'ags', on: 'a.id = ags.agendamento_id' },
      { type: 'INNER', table: 'servicos', alias: 's', on: 'ags.servico_id = s.id' }
    ],
    where,
    order_by: 'a.hora ASC'
  });

  const mapa = new Map();
  for (const linha of linhas) {
    if (!mapa.has(linha.id)) {
      mapa.set(linha.id, {
        id: linha.id,
        data,
        hora: linha.hora,
        status: linha.status,
        cliente: linha.cliente_nome || 'N/A',
        profissional: linha.profissional_nome || 'N/A',
        servicos: [],
        duracao_total: 0,
        observacoes: linha.observacoes
      });
    }

    const item = mapa.get(linha.id);
    item.servicos.push(linha.servico_nome || 'N/A');
    item.duracao_total += Number(linha.duracao_min);
  }

  return Array.from(mapa.values());
}


module.exports = {
  hojeSQL,
  totalAgendamentosHoje,
  totalAgendamentosSemana,
  listarAgendaHoje,
  listarAgendaPorData,
  listarAgendamentos,
  listarAgendaPorDataEStatus
};