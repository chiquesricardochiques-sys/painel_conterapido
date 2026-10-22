// src/controllers/admin/dashboardController.js
const dashboardModel = require('../../models/dashboardModel');

module.exports = {

  async mostrarDashboardAgendamentos(req, res) {
    try {
      const admin = req.session.admin;

      const hoje = dashboardModel.hojeSQL();
      const dataSelecionada = req.query.data || hoje;
      const statusSelecionado = req.query.status || 'todos';

      const [
        totalHoje,
        totalSemana,
        agenda
      ] = await Promise.all([
        dashboardModel.totalAgendamentosHoje(),
        dashboardModel.totalAgendamentosSemana(),
        dashboardModel.listarAgendaPorDataEStatus(dataSelecionada, statusSelecionado)
      ]);

      res.render('admin/dashboardAgendamento', {
        adminStyle: "cssConponenteAdmin/styleAgendametosClient.css",
        admin,
        totalHoje,
        totalSemana,
        agenda,
        dataSelecionada,
        statusSelecionado,
        currentDate: hoje
      });

    } catch (err) {
      console.error(err);
      res.render('admin/dashboardAgendamento', {
        adminStyle: "cssConponenteAdmin/styleAgendametosClient.css",
        admin: { nome: 'Admin' },
        erro: 'Erro ao carregar dashboard',
        agenda: [],
        dataSelecionada: dashboardModel.hojeSQL(),
        statusSelecionado: 'todos',
        currentDate: dashboardModel.hojeSQL()
      });
    }
  },

  // ============================================================
  // AJAX: retorna a agenda de uma data + status específicos em JSON
  // ============================================================
  async agendaPorDataAjax(req, res) {
    try {
      const data = req.query.data || dashboardModel.hojeSQL();
      const status = req.query.status || 'todos';
      const agenda = await dashboardModel.listarAgendaPorDataEStatus(data, status);

      return res.json({
        success: true,
        data,
        status,
        total: agenda.length,
        agenda
      });

    } catch (err) {
      console.error('Erro ao buscar agenda via AJAX:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar agenda'
      });
    }
  }

};