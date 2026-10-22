const clientModel = require('../../models/clientModel'); // ajuste o caminho se necessário
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

async function mostrarPerfil(req, res) {
    // Pega os textos do site
    const textos = await testPadrao()
    res.render('client/profile', { 
        styleClient:"cssConponenteClient/stylePerfil.css",
        cliente: req.session.cliente,
        success: req.query.success || null,
        error: req.query.error || null,
        textos,
        client:true
    });
}

async function atualizarPerfil(req, res) {
    try {
        const cliente_id = req.session.cliente.id;
        const { nome, email, senha } = req.body;

        // Atualiza no banco (adicione a função no scheduleModel ou em um userModel)
        await clientModel.atualizarPerfil(cliente_id, nome, email, senha);

        // Atualiza dados na sessão
        req.session.cliente.nome = nome;
        req.session.cliente.email = email;

        res.redirect('/client/profile?success=Perfil atualizado com sucesso!');
    } catch (error) {
        console.error(error);
        res.redirect('/client/profile?error=Erro ao atualizar perfil');
    }
}

module.exports = {
    mostrarPerfil,
    atualizarPerfil
};