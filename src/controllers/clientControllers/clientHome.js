const clientModel = require('../../models/clientModel');
const servicoModel = require('../../models/serviceModel');
const professionalModel = require('../../models/professionalModel');
const commentModel = require('../../models/commentModel');
async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });
  
    return textos
}

async function home(req, res) {
    
    // Protege a rota para clientes logados
    if (!req.session.cliente) {
        return res.redirect('/client/login');
    }

    // Pega os textos do site
    const textos = await testPadrao()

    // Pega serviços, profissionais e comentários do banco
    const servicos = await servicoModel.listarServicosHome();       // últimos 10
    const profissionais = await professionalModel.listarProfissionaisHome(); // todos
    const comentarios = await commentModel.listarComentariosHome();  // últimos 10


    // Renderiza o template do cliente logado
    res.render('client/home', {
        cliente: req.session.cliente,  // dados do cliente logado
        textos,
        servicos,
        profissionais,
        comentarios
    });
}

module.exports = {home}

