// src/controllers/admin/siteTextsController.js
const siteTextsModel = require('../../models/siteTextsModel');
const imgService = require('../../services/imgData.service');

const PROJECT_CODE = process.env.PROJECT_CODE || 'salao_beleza';
const ID_INSTANCIA = process.env.ID_INSTANCIA || 4;

// ============================================================================
// CLOUDINARY
// ============================================================================

async function processarImagem(req, key_name) {
    if (!req.file) return null;

    return await imgService.uploadImagem({
        filePath: req.file.path,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: `site_texts_${key_name}`
    });
}

async function processarAtualizacaoImagem(req, key_name, public_id_antigo) {
    if (!req.file) return null;

    return await imgService.atualizarImagem({
        filePath: req.file.path,
        public_id_antigo,
        project_code: PROJECT_CODE,
        id_instancia: ID_INSTANCIA,
        table: `site_texts_${key_name}`
    });
}

// ============================================================================
// TEXTOS
// ============================================================================

async function mostrarTextos(req, res) {
    const textosDB = await siteTextsModel.listarTextos();

    const textos = {};
    textosDB.forEach(item => {
        textos[item.key_name] = item.value;
    });

    const campos = [
        { key: 'header_title', label: 'Título do Cabeçalho', type: 'text' },
        { key: 'mainbanner_heading', label: 'Título Principal (Banner)', type: 'text' },
        { key: 'mainbanner_subheading', label: 'Subtítulo (Banner)', type: 'text' },
        { key: 'footer_text', label: 'Texto do Rodapé', type: 'text' },
        { key: 'mainbanner_img1', label: 'Imagem 1 do Banner', type: 'file' },
        { key: 'mainbanner_img2', label: 'Imagem 2 do Banner', type: 'file' },
        { key: 'mainbanner_img3', label: 'Imagem 3 do Banner', type: 'file' },
        { key: 'facebook', label: 'Facebook', type: 'text' },
        { key: 'instagram', label: 'Instagram', type: 'text' },
        { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
        { key: 'tiktok', label: 'TikTok', type: 'text' }
    ];

    res.render('admin/manageSiteTexts', {
        adminStyle: "cssConponenteAdmin/styleTestSite.css",
        textos,
        campos
    });
}

async function atualizarTexto(req, res) {
    const { key_name, value } = req.body;
    await siteTextsModel.atualizarTexto(key_name, value);
    res.redirect('/admin/site-texts');
}

async function uploadImagem(req, res) {
    try {
        const { key_name } = req.body;

        const publicIdKey = `${key_name}_public_id`;
        const public_id_antigo = await siteTextsModel.buscarTextoPorKey(publicIdKey);

        let imagem;
        if (public_id_antigo?.value) {
            imagem = await processarAtualizacaoImagem(req, key_name, public_id_antigo.value);
        } else {
            imagem = await processarImagem(req, key_name);
        }

        if (!imagem) return res.redirect('/admin/site-texts');

        await siteTextsModel.atualizarTexto(key_name, imagem.url);
        await siteTextsModel.atualizarTexto(publicIdKey, imagem.public_id);

        res.redirect('/admin/site-texts');
    } catch (err) {
        console.error('[uploadImagem/siteTexts]', err);
        res.redirect('/admin/site-texts');
    }
}

module.exports = { mostrarTextos, atualizarTexto, uploadImagem };