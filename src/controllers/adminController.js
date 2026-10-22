
// src/controllers/adminController.js
const professionalModel = require('../models/professionalModel');
const adminModel = require('../models/adminModel');
const serviceModel = require('../models/serviceModel');
const scheduleModel = require('../models/scheduleModel');
const diaNullModel = require('../models/diaNullModel');
const orariosNullModel = require('../models/orariosNullModel');



const {
    mostrarProfissionais,
    criarProfissional,
    atualizarProfissional,
    deletarProfissional
} = require("./adminControllers/adminProfissional")
const {
    deletarAdmin,
    atualizarAdmin,
    atualizarSenha,
    criarAdmin,
    mostrarAdmins

} = require("./adminControllers/adminController")

const {
    mostrarProfessionalSchedule,
    atualizarProfessionalSchedule,
    mostrarSchedule,
    atualizarSchedule
} = require("./adminControllers/professional_schedule")


// orarios bloqueados
const {
    adicionarHoraBloqueada,
    adicionarDiaBloqueado,
    mostrarBloqueios,
    deletarBloqueio,
    criarHorarioBloqueado,
    criarDiaBloqueado,
    removerHoraBloqueada,
    removerDiaBloqueado
} = require("./adminControllers/adminBreakHoras")


const {
     mostrarTextos, atualizarTexto, uploadImagem
} = require("./adminControllers/siteTextsController")

const {
    mostrarComentarios,
    criarComentario,
    atualizarComentario,
    deletarComentario 
} = require("./adminControllers/adminCommentsController")


const {
    mostrarServicos,
    criarServico,
    atualizarServico,
    deletarServico
} = require("./adminControllers/adminServisos")
const {
    mostrarLogin,
    loginAdmin,
    logoutAdmin,
    mostrarDashboard
} = require("./adminControllers/adminLogin")

const {
    mostrarHorarios,
    criarHorario,
    deletarHorario
} = require("./adminControllers/adminHorarios")

const {
    mostrarDashboardAgendamentos,
    agendaPorDataAjax
} = require("./adminControllers/dashboardController")

async function testPadrao(){
    const siteTextModel = require('../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });

    return textos
}

// Mostrar agenda semanal de um profissional
async function mostrarAgendaSemanal(req, res) {
    const profissionais = await professionalModel.listarProfissionais();
    const profissional_id = req.query.profissional_id || (profissionais[0] && profissionais[0].id);
    const textos = await testPadrao()
    if (!profissional_id) {
        return res.render('admin/manageWeeklyAgenda', {
            admin: req.admin, 
            adminStyle:"cssConponenteAdmin/styleGradeSemanalProfisional.css",  
            textos,          
            error: 'Selecione um profissional.',
            profissionais,
            profissional_id: null,
            semana: []
        });
    }

    const semana = [];
    const hoje = new Date();

    for (let i = 0; i < 7; i++) {
        const dataAtual = new Date();
        dataAtual.setDate(hoje.getDate() + i);

        const dia_semana = ['dom','seg','ter','qua','qui','sex','sab'][dataAtual.getDay()];
        const dataStr = dataAtual.toISOString().split('T')[0];

        const grade = await scheduleModel.listarProfessionalSchedule(profissional_id);
        const diaGrade = grade.find(d => d.dia_semana === dia_semana);

        const diaBloqueado = await diaNullModel.verificarDiaBloqueado(profissional_id, dataStr);
        let horariosDisponiveis = [];
        let agendamentosDia = [];

        if (diaGrade && diaGrade.abre === 1 && !diaBloqueado) {
            // Pega todos agendamentos do dia
            agendamentosDia = await scheduleModel.listarHorarios(profissional_id, dataStr);

            const [abreHora, abreMin] = diaGrade.abertura.split(':').map(Number);
            const [fechaHora, fechaMin] = diaGrade.fechamento.split(':').map(Number);

            let horaAtual = new Date(dataAtual);
            horaAtual.setHours(abreHora, abreMin, 0, 0);

            const horaFim = new Date(dataAtual);
            horaFim.setHours(fechaHora, fechaMin, 0, 0);

            const intervaloMin = 30; // ajuste conforme duração padrão do serviço

            while (horaAtual < horaFim) {
                const horaStr = horaAtual.toTimeString().split(' ')[0].substr(0,5);

                const horaBloqueada = await orariosNullModel.verificarHoraBloqueada(profissional_id, dataStr, horaStr);

                const agendamento = agendamentosDia.find(a => a.hora.substr(0,5) === horaStr);

                horariosDisponiveis.push({
                    hora: horaStr,
                    disponivel: !horaBloqueada && !agendamento,
                    bloqueada: horaBloqueada,
                    agendamento: agendamento || null
                });

                horaAtual.setMinutes(horaAtual.getMinutes() + intervaloMin);
            }
        }

        semana.push({
            data: dataStr,
            diaSemana: dia_semana,
            isDiaBloqueado: diaBloqueado || !diaGrade || diaGrade.abre === 0,
            horariosDisponiveis,
            agendamentos: agendamentosDia
        });
    }

    res.render('admin/manageWeeklyAgenda', {
        admin: req.admin, 
        adminStyle:"cssConponenteAdmin/styleGradeSemanalProfisional.css",      
        profissionais,
        profissional_id,
        textos,
        semana
    });
}



//->criarDiaBloqueado,
module.exports = {
    mostrarComentarios,
    criarComentario,
    atualizarComentario,
    deletarComentario,
    mostrarTextos, 
    atualizarTexto,
    mostrarBloqueios,
    mostrarAgendaSemanal,
    adicionarDiaBloqueado,
    adicionarHoraBloqueada,
    removerDiaBloqueado,
    removerHoraBloqueada,
    criarDiaBloqueado,
    criarHorarioBloqueado,
    deletarBloqueio,
    mostrarSchedule,
    atualizarSchedule,
    mostrarProfessionalSchedule,
    atualizarProfessionalSchedule,
    mostrarHorarios,
    criarHorario,
    deletarHorario,
    mostrarServicos,
    criarServico,
    atualizarServico,
    deletarServico,
    mostrarLogin,
    loginAdmin,
    logoutAdmin,
    mostrarDashboard,
    mostrarProfissionais,
    criarProfissional,
    atualizarProfissional,
    deletarProfissional,
    mostrarDashboardAgendamentos,
    uploadImagem,
    deletarAdmin,
    atualizarAdmin,
    atualizarSenha,
    criarAdmin,
    mostrarAdmins,
    agendaPorDataAjax
};
