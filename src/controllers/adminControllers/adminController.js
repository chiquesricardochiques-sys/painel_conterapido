const adminModel = require('../../models/adminModel');

async function testPadrao(){
    const siteTextModel = require('../../models/siteTextsModel');
    const textosArray = await siteTextModel.listarTextos();
    const textos = {};
    textosArray.forEach(t => {
        textos[t.key_name] = t.value;
    });

    return textos
}
async function deletarAdmin(req, res) {
    const id = req.params.id;
    const adminLogado = req.session.admin.id;

    // não pode se deletar
    if (Number(id) === Number(adminLogado)) {
        return res.redirect('/admin/admins?erro=self');
    }

    const total = await adminModel.contarAdmins();
    if (total <= 1) {
        return res.redirect('/admin/admins?erro=ultimo');
    }

    await adminModel.deletarAdmin(id);
    res.redirect('/admin/admins?sucesso=delete');
}
async function atualizarAdmin(req, res) {
    const { id, nome, email } = req.body;

    if (!nome || !email) {
        return res.redirect('/admin/admins?erro=campos');
    }

    await adminModel.atualizarAdmin(id, nome, email);
    res.redirect('/admin/admins?sucesso=update');
}
async function atualizarSenha(req, res) {
    const { id, senha } = req.body;

    if (!senha || senha.length < 6) {
        return res.redirect('/admin/admins?erro=senha');
    }

    await adminModel.atualizarSenha(id, senha);
    res.redirect('/admin/admins?sucesso=senha');
}
// adminController.js

async function criarAdmin(req, res) {
    const { nome, email, senha } = req.body;

    // validação básica
    if (!nome || !email || !senha) {
        return res.redirect('/admin/admins?erro=campos');
    }

    // regra mínima de senha
    if (senha.length < 6) {
        return res.redirect('/admin/admins?erro=senha');
    }

    try {
        await adminModel.criarAdmin(nome, email, senha);
        return res.redirect('/admin/admins?sucesso=criado');
    } catch (err) {
        // console.error('Erro ao criar admin:', err);

        // email duplicado (MySQL)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.redirect('/admin/admins?erro=email');
        }

        return res.redirect('/admin/admins?erro=geral');
    }
}
async function mostrarAdmins(req, res) {
    const textos = await testPadrao()
    const admins = await adminModel.listarAdmins();

    res.render('admin/admins', {
        adminStyle :"cssConponenteAdmin/styleAdmins.css",
        admins,
        textos,
        adminLogado: req.session.admin,
        query: req.query
    });
}

module.exports={
    deletarAdmin,
    atualizarAdmin,
    atualizarSenha,
    criarAdmin,
    mostrarAdmins
}