const serviceModel = require('../../models/serviceModel');
const imgService = require('../../services/imgData.service');

const PROJECT_CODE = process.env.PROJECT_CODE || 'salao_beleza';
const ID_INSTANCIA = process.env.ID_INSTANCIA || 4;

// ============================================================================
// TEXTOS PADRÃO
// ============================================================================

async function testPadrao() {
    const siteTextModel = require('../../models/siteTextsModel');

    const textosArray = await siteTextModel.listarTextos();
    const textos = {};

    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });

    return textos;
}

// ============================================================================
// CLOUDINARY
// ============================================================================

async function processarImagem(req) {
    if (!req.file) return null;

    return await imgService.uploadImagem({
        filePath: req.file.path,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: 'servicos'
    });
}

async function processarAtualizacaoImagem(req, public_id_antigo) {
    if (!req.file) return null;

    return await imgService.atualizarImagem({
        filePath: req.file.path,
        public_id_antigo,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: 'servicos'
    });
}

// ============================================================================
// RENDER
// ============================================================================

async function renderServicos(res, options = {}) {

    const textos = await testPadrao();
    const servicos = await serviceModel.listarServicos();

    res.render('admin/manageServices', {
        adminStyle: "cssConponenteAdmin/styleServices.css",
        textos,
        servicos,
        ...options
    });

}

// ============================================================================
// LISTAR
// ============================================================================

async function mostrarServicos(req, res) {
    await renderServicos(res);
}

// ============================================================================
// CRIAR
// ============================================================================

async function criarServico(req, res) {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {

        const {
            nome,
            duracao_min,
            preco
        } = req.body;

        if (!nome || !duracao_min || !preco) {
            return await renderServicos(res, {
                error: 'Todos os campos são obrigatórios.'
            });
        }

        const imagem = await processarImagem(req);

        await serviceModel.criarServico(
            nome,
            duracao_min,
            preco,
            imagem?.url || null,
            imagem?.public_id || null
        );

        await renderServicos(res, {
            success: 'Serviço criado com sucesso!'
        });

    } catch (err) {

        console.error('[criarServico]', err);

        await renderServicos(res, {
            error: 'Erro ao criar serviço.'
        });

    }

}

// ============================================================================
// ATUALIZAR
// ============================================================================

async function atualizarServico(req, res) {

    try {

        const {
            id,
            nome,
            duracao_min,
            preco
        } = req.body;

        const servicoAtual = await serviceModel.buscarServicoPorId(id);

        const imagem = await processarAtualizacaoImagem(
            req,
            servicoAtual?.img_public_id
        );

        await serviceModel.atualizarServico(
            id,
            nome,
            duracao_min,
            preco,
            imagem?.url || null,
            imagem?.public_id || null
        );

        await renderServicos(res, {
            success: 'Serviço atualizado com sucesso!'
        });

    } catch (err) {

        console.error('[atualizarServico]', err);

        await renderServicos(res, {
            error: 'Erro ao atualizar serviço.'
        });

    }

}

// ============================================================================
// DELETAR
// ============================================================================

async function deletarServico(req, res) {

    try {

        const { id } = req.params;

        const servico = await serviceModel.buscarServicoPorId(id);

        if (servico?.img_public_id) {

            await imgService
                .deletarImagem(servico.img_public_id)
                .catch(() => {});

        }

        await serviceModel.deletarServico(id);

        await renderServicos(res, {
            success: 'Serviço removido com sucesso!'
        });

    } catch (err) {

        console.error('[deletarServico]', err);

        await renderServicos(res, {
            error: 'Erro ao remover serviço.'
        });

    }

}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    mostrarServicos,
    criarServico,
    atualizarServico,
    deletarServico
};