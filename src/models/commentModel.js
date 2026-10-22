// models/commentModel.js (NOVO - Go Data Engine API)
const goData = require('../services/goData.service');

const TABLE = 'comments';

// ============================================================================
// LISTAR COMENTÁRIOS ATIVOS (PÚBLICO)
// ============================================================================
async function listarComentarios() {
  return await goData.get({
    table: TABLE,
    where: { ativo: 1 },
    order_by: 'id DESC'
  });
}

// ============================================================================
// LISTAR TODOS OS COMENTÁRIOS (ADMIN)
// ============================================================================
async function listarTodosComentarios() {
  return await goData.get({
    table: TABLE,
    order_by: 'id DESC'
  });
}

// ============================================================================
// LISTAR COMENTÁRIOS PARA HOME (COM LIMITE)
// ============================================================================
async function listarComentariosHome(limit = 5) {
  return await goData.get({
    table: TABLE,
    where: { ativo: 1 },
    order_by: 'id DESC',
    limit
  });
}

// ============================================================================
// CRIAR COMENTÁRIO
// ============================================================================
async function criarComentario(nome, comentario, img_url = null, img_public_id = null) {
  return await goData.insert({
    table: TABLE,
    data: {
      nome,
      comentario,
      img: img_url || '',
      img_public_id: img_public_id || null,
      ativo: 1
    }
  });
}

// ============================================================================
// ATUALIZAR COMENTÁRIO
// img_url/img_public_id só são atualizados se uma nova imagem foi enviada
// ============================================================================
async function atualizarComentario(id, nome, comentario, ativo = true, img_url = null, img_public_id = null) {
  const data = {
    nome,
    comentario,
    ativo: ativo ? 1 : 0
  };

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
// DELETAR COMENTÁRIO
// ============================================================================
async function deletarComentario(id) {
  await goData.remove({
    table: TABLE,
    where: { id },
    mode: 'hard'
  });
}

// ============================================================================
// BUSCAR COMENTÁRIO POR ID
// ============================================================================
async function buscarComentarioPorId(id) {
  const comentarios = await goData.get({
    table: TABLE,
    where: { id },
    limit: 1
  });

  return comentarios[0] || null;
}

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  listarComentarios,
  listarTodosComentarios,
  listarComentariosHome,
  criarComentario,
  atualizarComentario,
  deletarComentario,
  buscarComentarioPorId
};