// home
const {home} = require("./clientControllers/clientHome")

// agendamentos
const { mostrarAgendamento, agendarHorario } = require("./clientControllers/clientAgendaHorarios")


// meusAgendamentos
const { meusAgendamentos, deletarAgendamento } = require("./clientControllers/clientMeusAgendamentos")

// perfil
const { mostrarPerfil, atualizarPerfil } = require("./clientControllers/clientPerfil")

module.exports = {
    deletarAgendamento,
    home,
    mostrarAgendamento,
    agendarHorario,
    meusAgendamentos,
    mostrarPerfil,
    atualizarPerfil
};

