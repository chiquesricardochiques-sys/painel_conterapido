const scheduleModel = require('../../models/scheduleModel');
async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });
  
    return textos
}
async function meusAgendamentos(req, res) {
    const cliente_id = req.session.cliente.id;
    let agendamentos = await scheduleModel.listarFuturosPorCliente(cliente_id);
    
    // Pega os textos do site
    const textos = await testPadrao()

    // Pega mensagens da query string
    const success = req.query.success || null;
    const error = req.query.error || null;
    
    agendamentos = agendamentos.map(item=>{
        const dataObj = new Date(item.data);
        const dataNormal = dataObj.toLocaleDateString("pt-BR",{timeZone:"UTC"})

        const dataInvertida = dataObj.toISOString().split("T")[0];
        return {
            ...item,
            data:dataNormal,
            dataTime: dataInvertida
        }
    })
    res.render('client/mySchedules', {
        styleClient:"cssConponenteClient/styleMySchedules.css",
        agendamentos,
        textos,
        success,
        error,
        client:true
    });    
}
async function deletarAgendamento(req, res) {
    try {
        const { agendamento_id } = req.body;
        const cliente_id = req.session.cliente.id;

        const agendamento = await scheduleModel.buscarPorId(agendamento_id);

        if (!agendamento || agendamento.cliente_id !== cliente_id) {
            return res.redirect('/client/my-schedules?error=Agendamento não encontrado ou não permitido');
        }

        await scheduleModel.deletarAgendamento(agendamento_id);

        return res.redirect('/client/my-schedules?success=Agendamento deletado com sucesso!');
    } catch (error) {
        // console.error(error);
        return res.redirect('/client/my-schedules?error=Erro ao deletar agendamento');
    }
}

module.exports = {
    meusAgendamentos,
    deletarAgendamento
};