// src/middlewares/authAdmin.js
function authAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        // Se estiver logado como admin, deixa passar
        return next();
    }
    // Senão, redireciona para login do admin
    res.redirect('/admin/login');
}

module.exports = authAdmin;
