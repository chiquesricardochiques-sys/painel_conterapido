const express = require('express');

const router = express.Router();

const adminController = require('../controllers/adminController');
const exigirPainel = require('../middlewares/exigirPainel');

router.get('/', (req, res) => res.redirect('/admin/login'));

// Entrada com o código do salão
router.get('/login', adminController.mostrarLogin);
router.post('/login', adminController.loginAdmin);
router.get('/logout', adminController.logoutAdmin);

// Agenda do dia (precisa do código na sessão)
router.get('/dashboard', exigirPainel, adminController.mostrarDashboard);

// Atualização automática da tela (JSON)
router.get('/ajax/agenda', exigirPainel, adminController.agendaAjax);

module.exports = router;