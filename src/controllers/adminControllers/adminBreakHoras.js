// src/controllers/adminControllers/bloqueiosController.js
const professionalModel = require('../../models/professionalModel');
const diaNullModel = require('../../models/diaNullModel');
const orariosNullModel = require('../../models/orariosNullModel');

async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });

    return textos
}
// --- BLOQUEIOS DE DIAS E HORÁRIOS ---

// Mostrar bloqueios de um profissional
async function mostrarBloqueios(req, res) {
    const textos = await testPadrao()
    try {
        const profissionais = await professionalModel.listarProfissionais();
        const profissional_id = req.query.profissional_id || (profissionais[0] && profissionais[0].id);

        // Data padrão: hoje
        const dataHoje = new Date().toISOString().split('T')[0];

        // Se não houver profissional selecionado, retorna erro
        if (!profissional_id) {
            return res.render('admin/manageBlocks', {
                
                adminStyle: "cssConponenteAdmin/styleHoraBroks.css",
                textos,
                error: 'Selecione um profissional.',
                profissionais,
                profissional_id: null,
                diasBloqueados: [],
                horasBloqueadas: [],
                data: dataHoje
            });
        }

        // Busca apenas dias bloqueados a partir de hoje
        const diasBloqueados = (await diaNullModel.listarDiasBloqueados(profissional_id))
            .filter(d => d.data >= dataHoje);

        // Busca horários bloqueados apenas para a data selecionada (ou hoje)
        const dataSelecionada = req.query.data || dataHoje;
        const horasBloqueadas = await orariosNullModel.listarOrariosBloqueados(profissional_id, dataSelecionada);

        res.render('admin/manageBlocks', {
            adminStyle: "cssConponenteAdmin/styleHoraBroks.css",
            textos,
            profissionais,
            profissional_id,
            diasBloqueados,
            horasBloqueadas,
            data: dataSelecionada
        });

    } catch (err) {
        console.error('Erro ao mostrar bloqueios:', err);
        res.render('admin/manageBlocks', {
            error: 'Erro ao carregar bloqueios.',
            adminStyle: "cssConponenteAdmin/styleHoraBroks.css",
            textos,
            profissionais: [],
            diasBloqueados: [],
            horasBloqueadas: [],
            profissional_id: null,
            data: new Date().toISOString().split('T')[0]
        });
    }
}

// Adicionar dia bloqueado
async function adicionarDiaBloqueado(req, res) {
    const { profissional_id, data, motivo } = req.body;

    // Valida se a data é futura
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) {
        return res.redirect(`/admin/blocks?profissional_id=${profissional_id}`);
    }

    await diaNullModel.criarDiaBloqueado(profissional_id, data, motivo);
    res.redirect(`/admin/blocks?profissional_id=${profissional_id}`);
}

// Adicionar horário bloqueado
async function adicionarHoraBloqueada(req, res) {
    const { profissional_id, data, hora, motivo } = req.body;

    // Valida se data >= hoje
    const hoje = new Date().toISOString().split('T')[0];
    if (data < hoje) return res.redirect(`/admin/blocks?profissional_id=${profissional_id}`);

    await orariosNullModel.criarHorarioBloqueado(profissional_id, data, hora, motivo);
    res.redirect(`/admin/blocks?profissional_id=${profissional_id}`);
}

// Remover dia bloqueado
async function removerDiaBloqueado(req, res) {
    const { id } = req.params;
    const bloqueio = await diaNullModel.listarDiasBloqueados(id); // pega para redirecionar
    await diaNullModel.deletarDiaBloqueado(id);
    res.redirect(`/admin/blocks?profissional_id=${bloqueio.profissional_id}`);
}

// Remover hora bloqueada
async function removerHoraBloqueada(req, res) {
    const { id } = req.params;
    const bloqueio = await orariosNullModel.listarOrariosBloqueados(id); // pega para redirecionar
    await orariosNullModel.deletarHorarioBloqueado(id);
    res.redirect(`/admin/blocks?profissional_id=${bloqueio.profissional_id}`);
}
// Criar dia bloqueado
async function criarDiaBloqueado(req, res) {
    const { profissional_id, data, motivo } = req.body;
    await diaNullModel.criarDiaBloqueado(profissional_id, data, motivo);
    res.redirect(`/admin/block?profissional_id=${profissional_id}`);
}

// Criar horário bloqueado
async function criarHorarioBloqueado(req, res) {
    const { profissional_id, data, hora, motivo } = req.body;
    await orariosNullModel.criarHorarioBloqueado(profissional_id, data, hora, motivo);
    res.redirect(`/admin/block?profissional_id=${profissional_id}`);
}

// Deletar bloqueio
async function deletarBloqueio(req, res) {
    const { tipo, id, profissional_id } = req.query; // tipo: 'dia' ou 'hora'
    if (tipo === 'dia') {
        await diaNullModel.deletarDiaBloqueado(id);
    } else if (tipo === 'hora') {
        await orariosNullModel.deletarHorarioBloqueado(id);
    }
    res.redirect(`/admin/block?profissional_id=${profissional_id}`);
}


module.exports = {
    mostrarBloqueios,
    adicionarDiaBloqueado,
    adicionarHoraBloqueada,
    removerDiaBloqueado,
    removerHoraBloqueada
};
