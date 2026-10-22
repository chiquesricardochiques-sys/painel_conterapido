const adminModel = require('../../models/adminModel');

function logoutAdmin(req, res) {
    req.session.destroy();
    res.redirect('/');
}

// --- LOGIN ---
function mostrarLogin(req, res) {
    res.render('admin/login', {
        
        adminStyle: 'cssConponenteAdmin/styleLogin.css',
        error: null
    });
}

async function loginAdmin(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.render('admin/login', {
            adminStyle: 'cssConponenteAdmin/styleLogin.css',
            error: 'Preencha email e senha.'
        });
    }

    try {
        const admin = await adminModel.validarLogin(email, senha);

        if (!admin) {
            return res.render('admin/login', {
                layout: "ADMIN-TEST",
                textos,
                adminStyle: 'cssConponenteAdmin/styleLogin.css',
                error: 'Email ou senha incorretos!'
            });
        }

        req.session.admin = {
            id: admin.id,
            nome: admin.nome,
            email: admin.email
        };

        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('Erro ao validar login:', err);
        return res.render('admin/login', {
            adminStyle: 'cssConponenteAdmin/styleLogin.css',
            error: 'Erro ao processar login. Tente novamente.'
        });
    }
}

module.exports = {
    mostrarLogin,
    loginAdmin,
    logoutAdmin
}