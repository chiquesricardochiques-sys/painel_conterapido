const commentModel = require('../../models/commentModel');
const imgService = require('../../services/imgData.service');

const PROJECT_CODE = process.env.PROJECT_CODE || 'salao_beleza';
const ID_INSTANCIA = process.env.ID_INSTANCIA || 4;

async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });
    return textos
}

async function processarImagem(req) {
    if (!req.file) return null;

    return await imgService.uploadImagem({
        filePath: req.file.path,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: 'comments'
    });
}

async function processarAtualizacaoImagem(req, public_id_antigo) {
    if (!req.file) return null;

    return await imgService.atualizarImagem({
        filePath: req.file.path,
        public_id_antigo,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: 'comments'
    });
}

// Mostrar todos os comentários no admin
async function mostrarComentarios(req, res) {
    const textos = await testPadrao()
    const comentarios = await commentModel.listarTodosComentarios();
    res.render('admin/manageComments', {
        adminStyle: "cssConponenteAdmin/styleComentarios.css",
        textos,
        comentarios
    });
}

// Criar comentário
async function criarComentario(req, res) {
    const textos = await testPadrao()
    try {
        const { nome, comentario } = req.body;

        const imagem = await processarImagem(req);

        await commentModel.criarComentario(
            nome,
            comentario,
            imagem?.url || null,
            imagem?.public_id || null
        );

        res.redirect('/admin/comments');
    } catch (err) {
        console.error('[criarComentario]', err);
        const comentarios = await commentModel.listarTodosComentarios();
        res.render('admin/manageComments', {
            adminStyle: "cssConponenteAdmin/styleComentarios.css",
            textos,
            error: 'Erro ao criar comentário.',
            comentarios
        });
    }
}

// Atualizar comentário
async function atualizarComentario(req, res) {
    try {
        const { id, nome, comentario, ativo } = req.body;

        const comentarioAtual = await commentModel.buscarComentarioPorId(id);

        const imagem = await processarAtualizacaoImagem(
            req,
            comentarioAtual?.img_public_id
        );

        await commentModel.atualizarComentario(
            id,
            nome,
            comentario,
            ativo === 'on',
            imagem?.url || null,
            imagem?.public_id || null
        );

        res.redirect('/admin/comments');
    } catch (err) {
        console.error('[atualizarComentario]', err);
        res.redirect('/admin/comments');
    }
}

// Deletar comentário
async function deletarComentario(req, res) {
    try {
        const { id } = req.params;

        const comentario = await commentModel.buscarComentarioPorId(id);

        if (comentario?.img_public_id) {
            await imgService
                .deletarImagem(comentario.img_public_id)
                .catch(() => {});
        }

        await commentModel.deletarComentario(id);

        res.redirect('/admin/comments');
    } catch (err) {
        console.error('[deletarComentario]', err);
        res.redirect('/admin/comments');
    }
}

module.exports = {
    mostrarComentarios,
    criarComentario,
    atualizarComentario,
    deletarComentario
};