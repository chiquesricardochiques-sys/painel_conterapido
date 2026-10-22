const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.home);
router.get('/register', publicController.mostrarCadastro);
router.post('/register', publicController.registrarCliente);
router.get('/login', publicController.mostrarLogin);
router.post('/login', publicController.loginCliente);
router.get('/logout', publicController.logoutCliente);
router.get('/forgot-password', publicController.mostrarRecuperarSenha);
router.post('/forgot-password', publicController.enviarRecuperacao);

router.get('/reset-senha', publicController.mostrarResetSenha);
router.post('/reset-senha', publicController.resetarSenha);



module.exports = router;
