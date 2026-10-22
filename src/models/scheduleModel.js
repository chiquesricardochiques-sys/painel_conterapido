// models/scheduleModel.js (Go Data Engine API)
const goData = require('../services/goData.service');

const hojeSQL = () => new Date().toISOString().split('T')[0];

// ============================================================================
// LUCRO DO DIA
// ============================================================================
async function lucroHoje() {
  const hoje = hojeSQL();

  // Buscar agendamentos concluídos de hoje
  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      data: hoje,
      status: 'concluido'
    },
    select: ['servico_id']
  });

  if (agendamentos.length === 0) return 0;

  // Buscar preços dos serviços
  let total = 0;
  for (let agendamento of agendamentos) {
    const servicos = await goData.get({
      table: 'servicos',
      where: { id: agendamento.servico_id },
      select: ['preco'],
      limit: 1
    });

    if (servicos[0]) {
      total += parseFloat(servicos[0].preco);
    }
  }

  return total;
}

// ============================================================================
// LUCRO DA SEMANA
// ============================================================================
async function lucroSemana() {
  // Pegar o primeiro dia da semana (segunda-feira)
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diff = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const primeiroDia = new Date(hoje.setDate(diff)).toISOString().split('T')[0];

  // Buscar agendamentos concluídos da semana
  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      status: 'concluido'
    },
    select: ['data', 'servico_id']
  });

  // Filtrar apenas desta semana
  const agendamentosSemana = agendamentos.filter(a => a.data >= primeiroDia);

  if (agendamentosSemana.length === 0) return 0;

  // Buscar preços
  let total = 0;
  for (let agendamento of agendamentosSemana) {
    const servicos = await goData.get({
      table: 'servicos',
      where: { id: agendamento.servico_id },
      select: ['preco'],
      limit: 1
    });

    if (servicos[0]) {
      total += parseFloat(servicos[0].preco);
    }
  }

  return total;
}

// ============================================================================
// TOTAL DE AGENDAMENTOS HOJE
// ============================================================================
async function totalAgendamentosHoje() {
  const hoje = hojeSQL();

  const total = await goData.aggregate({
    table: 'agendamentos',
    operation: 'COUNT',
    where: {
      data: hoje,
      status: 'agendado'
    }
  });

  return total;
}

// ============================================================================
// LISTA DE AGENDAMENTOS DE HOJE
// ============================================================================
async function listarAgendaHoje() {
  const hoje = hojeSQL();

  const agendamentos = await goData.get({
    table: 'agendamentos',
    where: {
      data: hoje,
      status: 'agendado'
    },
    order_by: 'hora ASC'
  });

  // Buscar dados relacionados
  for (let agendamento of agendamentos) {
    const [cliente] = await goData.get({
      table: 'clientes',
      where: { id: agendamento.cliente_id },
      select: ['nome'],
      limit: 1
    });

    const [servico] = await goData.get({
      table: 'servicos',
      where: { id: agendamento.servico_id },
      select: ['nome'],
      limit: 1
    });

    const [profissional] = await goData.get({
      table: 'profissionais',
      where: { id: agendamento.profissional_id },
      select: ['nome'],
      limit: 1
    });

    agendamento.cliente = cliente?.nome || 'N/A';
    agendamento.servico = servico?.nome || 'N/A';
    agendamento.profissional = profissional?.nome || 'N/A';
  }

  return agendamentos;
}

// ============================================================================
// ESTATÍSTICAS GERAIS
// ============================================================================
async function estatisticasGerais() {
  const totalClientes = await goData.aggregate({
    table: 'clientes',
    operation: 'COUNT'
  });

  const totalServicos = await goData.aggregate({
    table: 'servicos',
    operation: 'COUNT'
  });

  const totalProfissionais = await goData.aggregate({
    table: 'profissionais',
    operation: 'COUNT',
    where: { ativo: 1 }
  });

  return {
    totalClientes,
    totalServicos,
    totalProfissionais
  };
}


// #######################################################
// GRADE / HORÁRIOS DISPONÍVEIS (agora com múltiplos serviços por agendamento)
// #######################################################

function obterDiaSemana(data) {

    const dias = [
        "dom",
        "seg",
        "ter",
        "qua",
        "qui",
        "sex",
        "sab"
    ];

    return dias[new Date(data).getDay()];
}

async function buscarGrade(profissional_id, dia_semana) {

    const grade = await goData.get({

        table: "professional_schedule",

        select: [
            "abre",
            "abertura",
            "pausa_inicio",
            "pausa_fim",
            "fechamento"
        ],

        where: {
            profissional_id,
            dia_semana
        },

        limit: 1

    });

    return grade.length ? grade[0] : null;
}

// 🔧 agora traz uma linha por serviço (JOIN com agendamento_servicos),
// igual o gateway mobile faz
async function buscarAgendamentos(profissional_id, data) {

    const linhas = await goData.get({

      table: "agendamentos",

      alias: "a",

      select: [
          "a.id",
          "a.hora",
          "s.nome AS servico_nome",
          "s.duracao_min"
      ],

      joins: [
          {
              type: "INNER",
              table: "agendamento_servicos",
              alias: "ags",
              on: "a.id = ags.agendamento_id"
          },
          {
              type: "INNER",
              table: "servicos",
              alias: "s",
              on: "ags.servico_id = s.id"
          }
      ],

      where: {
          "a.profissional_id": profissional_id,
          "a.data": data,
          "a.status": "agendado"
      },

      order_by: "a.hora ASC"

    });

    return agruparPorAgendamento(linhas);
}

// Agrega linhas [{id, hora, servico_nome, duracao_min}, ...] em
// [{id, hora, duracao_total, servicos: [...]}]
function agruparPorAgendamento(linhas) {

    const mapa = new Map();

    for (const linha of linhas) {
        if (!mapa.has(linha.id)) {
            mapa.set(linha.id, {
                id: linha.id,
                hora: linha.hora,
                duracao_total: 0,
                servicos: []
            });
        }

        const item = mapa.get(linha.id);
        item.duracao_total += Number(linha.duracao_min);
        item.servicos.push(linha.servico_nome);
    }

    return Array.from(mapa.values());
}

function gerarHorariosDisponiveis(grade, agendamentos, intervalo = 30) {

    const horarios = [];

    if (!grade || !grade.abre) {
        return horarios;
    }

    function horaParaMinutos(hora) {
        const [h, m] = hora.substring(0, 5).split(":").map(Number);
        return h * 60 + m;
    }

    function minutosParaHora(minutos) {
        const h = Math.floor(minutos / 60).toString().padStart(2, "0");
        const m = (minutos % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }

    const abertura = horaParaMinutos(grade.abertura);
    const fechamento = horaParaMinutos(grade.fechamento);
    const pausaInicio = grade.pausa_inicio ? horaParaMinutos(grade.pausa_inicio) : null;
    const pausaFim = grade.pausa_fim ? horaParaMinutos(grade.pausa_fim) : null;

    for (let minuto = abertura; minuto < fechamento; minuto += intervalo) {
        if (pausaInicio !== null && pausaFim !== null && minuto >= pausaInicio && minuto < pausaFim) {
            continue;
        }

        horarios.push({
            hora: minutosParaHora(minuto),
            disponivel: true,
            agendamento: null,
            servicos: null   // 🔧 array agora, não mais "servico" singular
        });
    }

    // 🔧 duracao_total (soma de todos os serviços do agendamento)
    for (const agendamento of agendamentos) {
        const inicio = horaParaMinutos(agendamento.hora);
        const fim = inicio + Number(agendamento.duracao_total);

        for (const horario of horarios) {
            const atual = horaParaMinutos(horario.hora);

            if (atual >= inicio && atual < fim) {
                horario.disponivel = false;
                horario.agendamento = agendamento.id;
                horario.servicos = agendamento.servicos;
            }
        }
    }

    return horarios;
}

async function listarHorariosDisponiveis(profissional_id, data) {

    const diaSemana = obterDiaSemana(data);

    const grade = await buscarGrade(
        Number(profissional_id),
        diaSemana
    );

    if (!grade) {
        return [];
    }

    const agendamentos = await buscarAgendamentos(
        Number(profissional_id),
        data
    );

    return gerarHorariosDisponiveis(
        grade,
        agendamentos
    );

}


// funções para agendamentos
// ============================================================================
// VERIFICAR DISPONIBILIDADE DE HORÁRIO
// ============================================================================
async function verificarHorario(profissional_id, data, hora) {

    const existentes = await goData.get({
        table: "agendamentos",
        where: {
            profissional_id: Number(profissional_id),
            data,
            hora,
            status: "agendado"
        },
        limit: 1
    });

    return existentes.length > 0;
}

// ============================================================================
// CRIAR AGENDAMENTO
// 🔧 servico_ids agora é um array: [1, 2, 3]
// ============================================================================
async function criarAgendamento(cliente_id, profissional_id, servico_ids, data, hora, observacoes = null) {

    if (!Array.isArray(servico_ids) || servico_ids.length === 0) {
        throw new Error('servico_ids deve ser um array com ao menos 1 serviço');
    }

    // 1. cria o agendamento (sem servico_id)
    const insertResult = await goData.insert({
        table: "agendamentos",
        data: {
            cliente_id: Number(cliente_id),
            profissional_id: Number(profissional_id),
            data,
            hora,
            observacoes
        }
    });

    const agendamento_id = insertResult.id || insertResult.insertId || insertResult.data?.id;

    if (!agendamento_id) {
        throw new Error('Não foi possível obter o id do agendamento criado');
    }

    // 2. insere cada serviço vinculado, em paralelo
    await Promise.all(
        servico_ids.map(servico_id =>
            goData.insert({
                table: "agendamento_servicos",
                data: {
                    agendamento_id: Number(agendamento_id),
                    servico_id: Number(servico_id)
                }
            })
        )
    );

    return insertResult;
}

// ============================================================================
// RELISTAR HORÁRIOS APÓS AGENDAR (refresh pro controller)
// ============================================================================
async function listarHorariosDisponiveisAtualizado(profissional_id, data) {
    return await listarHorariosDisponiveis(profissional_id, data);
}


// ============================================================================
// BUSCAR AGENDAMENTO POR ID
// ============================================================================
async function buscarPorId(id) {
  const rows = await goData.get({
    table: 'agendamentos',
    where: { id: Number(id) },
    limit: 1
  });

  return rows[0];
}

// ============================================================================
// DELETAR AGENDAMENTO
// 🔧 apaga primeiro os vínculos em agendamento_servicos
// ============================================================================
async function deletarAgendamento(id) {

  await goData.delete({
    table: 'agendamento_servicos',
    where: { agendamento_id: Number(id) }
  });

  return await goData.delete({
    table: 'agendamentos',
    where: { id: Number(id) }
  });
}

// ============================================================================
// LISTAR AGENDAMENTOS FUTUROS DE UM CLIENTE
// 🔧 traz uma linha por serviço (JOIN com agendamento_servicos) e agrupa,
// somando duração/preço e listando os serviços de cada agendamento
// ============================================================================
async function listarFuturosPorCliente(cliente_id) {
  const hoje = new Date().toISOString().split('T')[0];

  const linhas = await goData.get({
    table: 'agendamentos',
    alias: 'a',
    select: [
      'a.id',
      'a.data',
      'a.hora',
      'a.status',
      'a.observacoes',
      's.nome AS servico_nome',
      's.preco AS servico_preco',
      's.duracao_min',
      'p.nome AS profissional'
    ],
    joins: [
      { type: 'INNER', table: 'agendamento_servicos', alias: 'ags', on: 'a.id = ags.agendamento_id' },
      { type: 'INNER', table: 'servicos', alias: 's', on: 'ags.servico_id = s.id' },
      { type: 'INNER', table: 'profissionais', alias: 'p', on: 'a.profissional_id = p.id' }
    ],
    where: {
      'a.cliente_id': Number(cliente_id),
      'a.status': 'agendado'
    },
    order_by: 'a.data ASC, a.hora ASC'
  });

  // agrupa por agendamento
  const mapa = new Map();
  for (const linha of linhas) {
    if (linha.data < hoje) continue; // só futuros

    if (!mapa.has(linha.id)) {
      mapa.set(linha.id, {
        id: linha.id,
        data: linha.data,
        hora: linha.hora,
        status: linha.status,
        observacoes: linha.observacoes,
        profissional: linha.profissional,
        servicos: [],
        duracao_total: 0,
        preco_total: 0
      });
    }

    const item = mapa.get(linha.id);
    item.servicos.push(linha.servico_nome);
    item.duracao_total += Number(linha.duracao_min);
    item.preco_total += Number(linha.servico_preco);
  }

  return Array.from(mapa.values());
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  lucroHoje,
  lucroSemana,
  totalAgendamentosHoje,
  listarAgendaHoje,
  estatisticasGerais,
  listarHorariosDisponiveis,
  verificarHorario,
  criarAgendamento,
  listarHorariosDisponiveisAtualizado,
  buscarPorId,
  deletarAgendamento,
  listarFuturosPorCliente
};