const professionalModel = require('../../models/professionalModel');
const adminModel = require('../../models/adminModel');
const serviceModel = require('../../models/serviceModel');
const scheduleModel = require('../../models/scheduleModel');
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

// Mostrar horários
async function mostrarHorarios(req, res) {
    
    
    const textos = await testPadrao()
    const profissionais = await professionalModel.listarProfissionais();
    const data = req.query.data || new Date().toISOString().split('T')[0];
    const profissional_id = req.query.profissional_id || (profissionais[0] && profissionais[0].id);

    let horariosDisponiveis = [];
    let agendamentos = [];

    if (profissional_id) {
        horariosDisponiveis = await scheduleModel.listarHorariosDisponiveis(profissional_id, data);
        agendamentos = await scheduleModel.listarHorarios(profissional_id, data);
    }

    res.render('admin/manageHours', {
        adminStyle: "cssConponenteAdmin/styleHora.css",
        profissionais,
        profissional_id,
        textos,
        data,
        horariosDisponiveis,
        agendamentos
    });
}

// Criar horário
async function criarHorario(req, res) {
    const { profissional_id, data, hora } = req.body;
    await scheduleModel.criarHorario(profissional_id, data, hora);
    res.redirect(`/admin/hours?profissional_id=${profissional_id}&data=${data}`);
}

// Deletar horário
async function deletarHorario(req, res) {
    const { id, profissional_id, data } = req.query;
    await scheduleModel.deletarHorario(id);
    res.redirect(`/admin/hours?profissional_id=${profissional_id}&data=${data}`);
}


// Mostrar tela de horários semanais
async function mostrarSchedule(req, res) {
    const profissional_id = req.params.id;
    const profissional = await professionalModel.buscarProfissionalPorId(profissional_id);
    const grade = await scheduleModel.listarProfessionalSchedule(profissional_id);
    res.render('admin/manageSchedule', {adminStyle: "cssConponenteAdmin/styleHora.css",profissional, grade });
}

// Atualizar horários semanais
async function atualizarSchedule(req, res) {
    const profissional_id = req.params.id;
    const dados = req.body; // vem do formulário
    await scheduleModel.atualizarProfessionalSchedule(profissional_id, dados);
    res.redirect(`/admin/professionals/schedule/${profissional_id}`);
}

module.exports = {
    mostrarHorarios,
    criarHorario,
    deletarHorario
}