// models/serviceModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'servicos';

// ============================================================================
// LISTAR TODOS OS SERVIÇOS
// ============================================================================
async function listarServicos() {
  return await goData.get({
    table: TABLE,
    order_by: 'criado_em DESC'
  });
}

// ============================================================================
// LISTAR SERVIÇOS PARA HOME (CLIENTE)
// ============================================================================
async function listarServicosHome(limit = 0) {
  const params = {
    table: TABLE,
    order_by: 'criado_em DESC'
  };

  if (limit > 0) {
    params.limit = limit;
  }

  return await goData.get(params);
}

// ============================================================================
// CRIAR NOVO SERVIÇO
// ============================================================================
async function criarServico(nome, duracao_min, preco, img = null) {
  return await goData.insert({
    table: TABLE,
    data: {
      nome,
      duracao_min,
      preco,
      img: img || null
    }
  });
}

// ============================================================================
// ATUALIZAR SERVIÇO
// ============================================================================
async function atualizarServico(id, nome, duracao_min, preco, imgName = null) {
  const data = {
    nome,
    duracao_min,
    preco
  };

  // Só atualiza a imagem se foi fornecida
  if (imgName) {
    data.img = imgName;
  }

  await goData.update({
    table: TABLE,
    data,
    where: { id }
  });
}

// ============================================================================
// DELETAR SERVIÇO
// ============================================================================
async function deletarServico(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// BUSCAR SERVIÇO POR ID
// ============================================================================
async function buscarServicoPorId(id) {
  const servicos = await goData.get({
    table: TABLE,
    where: { id },
    limit: 1
  });

  return servicos[0] || null;
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  listarServicos,
  listarServicosHome,
  criarServico,
  atualizarServico,
  deletarServico,
  buscarServicoPorId
};