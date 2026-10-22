// models/siteTextsModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'site_texts';

// ============================================================================
// LISTAR TODOS OS TEXTOS DO SITE
// ============================================================================
async function listarTextos() {
  return await goData.get({
    table: TABLE,
    order_by: 'key_name ASC'
  });
}

// ============================================================================
// BUSCAR TEXTO POR KEY
// ============================================================================
async function buscarTextoPorKey(key_name) {
  const textos = await goData.get({
    table: TABLE,
    where: { key_name },
    limit: 1
  });

  return textos[0] || null;
}

// ============================================================================
// ATUALIZAR TEXTO
// ============================================================================
async function atualizarTexto(key_name, value) {
  const existente = await buscarTextoPorKey(key_name);

  if (existente) {
    await goData.update({
      table: TABLE,
      data: { value },
      where: { key_name }
    });
  } else {
    await goData.insert({
      table: TABLE,
      data: { key_name, value }
    });
  }
}

// ============================================================================
// CRIAR NOVO TEXTO (CASO NÃO EXISTA)
// ============================================================================
async function criarTexto(key_name, value) {
  return await goData.insert({
    table: TABLE,
    data: {
      key_name,
      value
    }
  });
}

// ============================================================================
// DELETAR TEXTO
// ============================================================================
async function deletarTexto(key_name) {
  await goData.remove({
    table: TABLE,
    where: { key_name },
    mode: 'hard'
  });
}

// ============================================================================
// BUSCAR MÚLTIPLOS TEXTOS POR KEYS
// ============================================================================
async function buscarTextosPorKeys(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return await listarTextos();
  }

  // Como a API não suporta WHERE IN direto, fazemos múltiplas buscas
  const promises = keys.map(key => buscarTextoPorKey(key));
  const resultados = await Promise.all(promises);
  
  return resultados.filter(r => r !== null);
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  listarTextos,
  buscarTextoPorKey,
  buscarTextosPorKeys,
  atualizarTexto,
  criarTexto,
  deletarTexto
};