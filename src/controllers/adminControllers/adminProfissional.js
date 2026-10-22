const professionalModel = require('../../models/professionalModel');
const imgService = require('../../services/imgData.service');

const PROJECT_CODE = process.env.PROJECT_CODE || 'salao_beleza';
const ID_INSTANCIA = process.env.ID_INSTANCIA || 4;

// --- PROFISSIONAIS ---

async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });

    return textos
}

// Função para validar nome
function validarNome(nome) {
    return nome && nome.trim() !== '';
}

// Sobe a foto pro Cloudinary via pacote de img. Retorna { url, public_id } ou null se não veio arquivo.
async function processarImagem(req) {
    if (!req.file) return null;

    const imagem = await imgService.uploadImagem({
        filePath: req.file.path,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: 'profissionais',
    });

    return imagem; // { url, public_id, width, height }
}

// Substitui a foto: sobe a nova e apaga a antiga (via pacote de img)
async function processarAtualizacaoImagem(req, public_id_antigo) {
    if (!req.file) return null;

    const imagem = await imgService.atualizarImagem({
        filePath: req.file.path,
        public_id_antigo,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: 'profissionais',
    });

    return imagem; // { url, public_id, width, height }
}

async function renderProfissionais(res, options = {}) {
    const textos = await testPadrao()
    const profissionais = await professionalModel.listarProfissionais();
    res.render('admin/manageProfessionals', { 
        adminStyle:"cssConponenteAdmin/styleProfissional.css",
        textos,
        profissionais, ...options });
}


async function mostrarProfissionais(req, res) {
    await renderProfissionais(res);
}

async function criarProfissional(req, res) {
    try {
        const { nome, especialidade } = req.body;

        if (!validarNome(nome)) return await renderProfissionais(res, { error: 'Nome é obrigatório' });

        const imagem = await processarImagem(req);

        await professionalModel.criarProfissional(
            nome,
            especialidade,
            imagem?.url || null,
            imagem?.public_id || null
        );

        await renderProfissionais(res, { success: 'Profissional criado!' });

    } catch (err) {
        console.error('[criarProfissional]', err);
        await renderProfissionais(res, { error: 'Erro ao criar profissional' });
    }
}

async function atualizarProfissional(req, res) {
    try {
        const { id, nome, especialidade, ativo } = req.body;

        if (!validarNome(nome)) return await renderProfissionais(res, { error: 'Nome é obrigatório' });

        // Busca o profissional atual pra saber o public_id da foto antiga (caso troque)
        const profissionalAtual = await professionalModel.buscarProfissionalPorId(id);
        const imagem = await processarAtualizacaoImagem(req, profissionalAtual?.img_public_id);

        await professionalModel.atualizarProfissional(
            id,
            nome,
            especialidade,
            imagem?.url || null,
            imagem?.public_id || null,
            ativo === 'on'
        );

        await renderProfissionais(res, { success: 'Profissional atualizado com sucesso!' });

    } catch (err) {
        console.error('[atualizarProfissional]', err);
        await renderProfissionais(res, { error: 'Ocorreu um erro ao atualizar o profissional.' });
    }
}

async function deletarProfissional(req, res) {
    try {
        const { id } = req.params;
        const profissional = await professionalModel.buscarProfissionalPorId(id);

        if (profissional && profissional.img_public_id) {
            await imgService.deletarImagem(profissional.img_public_id).catch(() => {
                // se a imagem já não existir no Cloudinary, não trava o fluxo
            });
        }

        await professionalModel.deletarProfissional(id);

        await renderProfissionais(res, { success: 'Profissional removido com sucesso!' });

    } catch (err) {
        console.error('[deletarProfissional]', err);
        await renderProfissionais(res, { error: 'Erro ao remover profissional' });
    }
}


module.exports = {
    mostrarProfissionais,
    criarProfissional,
    atualizarProfissional,
    deletarProfissional
}