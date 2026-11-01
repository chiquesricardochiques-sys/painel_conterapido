// Só deixa passar quem entrou com o código do salão.
function exigirPainel(req, res, next) {
    if (req.session?.painel?.codigo) {
        return next();
    }

    // Chamadas de atualização automática (AJAX) recebem 401 em JSON
    if (req.originalUrl.includes('/ajax/')) {
        return res.status(401).json({ erro: 'sessao' });
    }

    return res.redirect('/admin/login');
}

module.exports = exigirPainel;