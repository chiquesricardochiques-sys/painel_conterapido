// models/professionalModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'profissionais';

// ============================================================================
// CRIAR PROFISSIONAL
// ============================================================================
async function criarProfissional(nome, especialidade = null, img_url = null, img_public_id = null) {
  if (!nome || nome.trim() === '') {
    throw new Error('Nome do profissional é obrigatório');
  }

  return await goData.insert({
    table: TABLE,
    data: {
      nome: nome.trim(),
      especialidade: especialidade?.trim() || null,
      img: img_url || null,
      img_public_id: img_public_id || null,
      ativo: 1
    }
  });
}

// ============================================================================
// LISTAR PROFISSIONAIS (ADMIN)
// ativos: true -> só ativos | false -> só inativos | null (padrão) -> todos
// Admin precisa ver todo mundo pra poder reativar quem foi desativado.
// ============================================================================
async function listarProfissionais(ativos = null) {
  const where = ativos === null ? {} : { ativo: ativos ? 1 : 0 };

  return await goData.get({
    table: TABLE,
    where,
    order_by: 'nome ASC'
  });
}

// ============================================================================
// LISTAR PROFISSIONAIS PARA HOME (CLIENTE)
// Site público só mostra ativos, sempre.
// ============================================================================
async function listarProfissionaisHome(limit = 0) {
  const params = {
    table: TABLE,
    where: { ativo: 1 },
    order_by: 'nome ASC'
  };

  if (limit > 0) {
    params.limit = limit;
  }

  return await goData.get(params);
}

// ============================================================================
// BUSCAR PROFISSIONAL POR ID
// ============================================================================
async function buscarProfissionalPorId(id) {
  const profissionais = await goData.get({
    table: TABLE,
    where: { id },
    limit: 1
  });

  return profissionais[0] || null;
}

// ============================================================================
// ATUALIZAR PROFISSIONAL
// img_url/img_public_id só são atualizados se foram fornecidos
// (troca de foto é opcional na edição)
// ============================================================================
async function atualizarProfissional(id, nome, especialidade = null, img_url = null, img_public_id = null, ativo = true) {
  if (!nome || nome.trim() === '') {
    throw new Error('Nome do profissional é obrigatório');
  }

  const data = {
    nome: nome.trim(),
    especialidade: especialidade?.trim() || null,
    ativo: ativo ? 1 : 0
  };

  // Só atualiza a imagem se uma nova foi fornecida
  if (img_url) {
    data.img = img_url;
    data.img_public_id = img_public_id;
  }

  await goData.update({
    table: TABLE,
    data,
    where: { id }
  });
}

// ============================================================================
// DELETAR PROFISSIONAL
// ============================================================================
async function deletarProfissional(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  criarProfissional,
  listarProfissionais,
  listarProfissionaisHome,
  buscarProfissionalPorId,
  atualizarProfissional,
  deletarProfissional
};