// src/controllers/adminController/adminProfessionalSchedule.js


const professionalModel = require('../../models/professionalModel');
const scheduleModel = require('../../models/professionalScheduleModel'); // renomeei pro model específico
async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });
  
    return textos
  }
/**
 * Mostra a grade semanal de um profissional.
 * Inicializa dias que ainda não existem com horários padrão.
 */
async function mostrarProfessionalSchedule(req, res) {
    const textos = await testPadrao()
    try {
        const profissional_id = req.params.profissional_id;
        const profissional = await professionalModel.buscarProfissionalPorId(profissional_id);

        if (!profissional) {
            return res.redirect('/admin/professionals');
        }

        let schedule = await scheduleModel.listarGradeProfissional(profissional_id);

        // Inicializa dias que ainda não existem
        const dias = ['seg','ter','qua','qui','sex','sab','dom'];
        for (let dia of dias) {
            if (!schedule.find(s => s.dia_semana === dia)) {
                schedule.push({ 
                    dia_semana: dia, 
                    abre: 1, 
                    abertura: '09:00:00', 
                    pausa_inicio: '12:00:00', 
                    pausa_fim: '13:00:00', 
                    fechamento: '18:00:00' 
                });
            }
        }

        res.render('admin/manageSchedule', {
            adminStyle:"cssConponenteAdmin/styleGradeSemanal.css",
            textos,
            profissional,
            schedule
        });
    } catch (err) {
        // console.error('Erro ao mostrar grade do profissional:', err);
        res.redirect('/admin/professionals');
    }
}

/**
 * Atualiza a grade semanal do profissional.
 * Recebe o corpo do formulário com os horários por dia.
 */
async function atualizarProfessionalSchedule(req, res) {
    try {
        const profissional_id = req.params.profissional_id;
        const dias = ['seg','ter','qua','qui','sex','sab','dom'];

        for (let dia of dias) {
            // Extrai valores do formulário e aplica valores padrão se não preenchido
            const abre = req.body[`${dia}_abre`] === 'on' ? 1 : 0;
            const abertura = req.body[`${dia}_abertura`] || '09:00:00';
            const pausa_inicio = req.body[`${dia}_pausa_inicio`] || null;
            const pausa_fim = req.body[`${dia}_pausa_fim`] || null;
            const fechamento = req.body[`${dia}_fechamento`] || '18:00:00';

            await scheduleModel.criarOuAtualizarGrade(
                profissional_id,
                dia,
                abre,
                abertura,
                pausa_inicio,
                pausa_fim,
                fechamento
            );
        }

        res.redirect(`/admin/professional-schedule/${profissional_id}`);
    } catch (err) {
        // console.error('Erro ao atualizar grade do profissional:', err);
        res.redirect(`/admin/professional-schedule/${req.params.profissional_id}`);
    }
}

// Mostrar tela de horários semanais
async function mostrarSchedule(req, res) {
    const textos = await testPadrao()
    const profissional_id = req.params.id;
    const profissional = await professionalModel.buscarProfissionalPorId(profissional_id);
    const grade = await scheduleModel.listarProfessionalSchedule(profissional_id);
    res.render('admin/manageSchedule', { 
        adminStyle:"cssConponenteAdmin/styleGradeSemanal.css",
        textos,
        profissional, grade });
}

// Atualizar horários semanais
async function atualizarSchedule(req, res) {
    const profissional_id = req.params.id;
    const dados = req.body; // vem do formulário
    await scheduleModel.atualizarProfessionalSchedule(profissional_id, dados);
    res.redirect(`/admin/professionals/schedule/${profissional_id}`);
}


module.exports = {
    mostrarProfessionalSchedule,
    atualizarProfessionalSchedule,
    mostrarSchedule,
    atualizarSchedule
};
