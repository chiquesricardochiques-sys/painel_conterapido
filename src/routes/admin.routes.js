const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authAdmin = require('../middlewares/authAdmin');
const dashboardController = require('../controllers/adminControllers/dashboardController');

// Login
router.get('/', (req, res) => res.redirect('/admin/login'));
router.get('/login', adminController.mostrarLogin);
router.post('/login', adminController.loginAdmin);
router.get('/logout', adminController.logoutAdmin);

// Dashboard — lista de agendamentos
router.get('/dashboard', authAdmin, dashboardController.mostrarDashboardAgendamentos);
router.get('/ajax/agenda', authAdmin, dashboardController.agendaPorDataAjax);

module.exports = router;