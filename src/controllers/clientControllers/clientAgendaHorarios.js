
const serviceModel = require('../../models/serviceModel');
const scheduleModel = require('../../models/scheduleModel');
const professionalModel = require('../../models/professionalModel');
 
async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });
 
    return textos
}
 
// 🔧 checkbox único marcado vem como string, dois ou mais vem como array
// (comportamento do express.urlencoded com extended:true) — normaliza
// sempre pra array
function normalizarServicoIds(servico_ids) {
    if (!servico_ids) return [];
    if (Array.isArray(servico_ids)) return servico_ids.map(Number);
    return [Number(servico_ids)];
}
 
async function mostrarAgendamento(req, res) {
    const servicos = await serviceModel.listarServicos();
    const profissionais = await professionalModel.listarProfissionais();
    const hoje = new Date().toISOString().split('T')[0];
    // Pega os textos do site
    const textos = await testPadrao()
 
    // 🔧 bug antigo: "let horariosDisponiveis = []" ficava sombreado pelo
    // "const horariosDisponiveis" de dentro do if, então o valor que ia
    // pro template era sempre []. Tirei o "const" de dentro pra reatribuir
    // a variável de fora.
    let horariosDisponiveis = [];
    if (profissionais.length > 0) {
        horariosDisponiveis = await scheduleModel.listarHorariosDisponiveis(
            1,
            hoje
        );
    }
 
    // Pegando o serviço padrão via query ?servico_id=3
    // 🔧 selectedServico continua existindo (é só o valor que veio na URL),
    // mas o que vai pro template agora é selectedServicos (array), pra
    // já bater com os checkboxes
    const selectedServico = req.query.servico_id
        ? Number(req.query.servico_id)
        : (servicos.length > 0 ? servicos[0].id : null);
 
    const selectedServicos = selectedServico ? [selectedServico] : [];
 
    res.render('client/schedule', {
        styleClient:"cssConponenteClient/styleSchedule.css",
        servicos,
        textos,
        profissionais,
        currentDate: hoje,
        horariosDisponiveis,
        selectedServicos,       // ✅ array, pro template marcar os checkboxes
        selectedProfissional: profissionais.length > 0 ? profissionais[0].id : null,
        selectedData: hoje,
        client:true
    });
}
 
 
 
async function agendarHorario(req, res) {
    const { profissional_id, data, hora, observacoes } = req.body;
    const servico_ids = normalizarServicoIds(req.body.servico_ids);
 
    const cliente_id = req.session.cliente.id;
    const textos = await testPadrao()
 
    // 🔧 validação nova: sem isso o scheduleModel.criarAgendamento
    // faz "throw" e derruba a rota com erro não tratado
    if (servico_ids.length === 0) {
        return res.render('client/schedule', {
            error: 'Selecione ao menos 1 serviço',
            styleClient:"cssConponenteClient/styleSchedule.css",
            servicos: await serviceModel.listarServicos(),
            profissionais: await professionalModel.listarProfissionais(),
            client:true,
            textos
        });
    }
 
    // Verifica se já existe agendamento para aquele profissional naquele horário
    const existe = await scheduleModel.verificarHorario(profissional_id, data, hora);
    if (existe) {
        return res.render('client/schedule', {
            error: 'Horário indisponível, escolha outro!',
            styleClient:"cssConponenteClient/styleSchedule.css",
            servicos: await serviceModel.listarServicos(),
            profissionais: await professionalModel.listarProfissionais(),
            selectedServicos: servico_ids,
            client:true,
            textos
        });
    }
 
    try {
        await scheduleModel.criarAgendamento(
            cliente_id,
            profissional_id,
            servico_ids,
            data,
            hora,
            observacoes || null
        );
    } catch (err) {
        console.error('Erro ao criar agendamento:', err);
        return res.render('client/schedule', {
            error: 'Erro ao criar agendamento, tente novamente',
            styleClient:"cssConponenteClient/styleSchedule.css",
            servicos: await serviceModel.listarServicos(),
            profissionais: await professionalModel.listarProfissionais(),
            selectedServicos: servico_ids,
            client:true,
            textos
        });
    }
 
    // Atualiza os horários após o agendamento
    const servicos = await serviceModel.listarServicos();
    const profissionais = await professionalModel.listarProfissionais();
    const horariosDisponiveis = await scheduleModel.listarHorariosDisponiveisAtualizado(profissional_id, data);
 
    res.render('client/schedule', {
        success: 'Agendamento realizado com sucesso!',
        styleClient:"cssConponenteClient/styleSchedule.css",
        servicos,
        profissionais,
        currentDate: data,
        selectedProfissional: profissional_id,
        selectedServicos: servico_ids,
        horariosDisponiveis,
        client:true,
        textos
    });
}
 
module.exports = {
    mostrarAgendamento,
    agendarHorario
};
 
