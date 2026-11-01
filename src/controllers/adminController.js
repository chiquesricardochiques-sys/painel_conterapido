const painelApi = require('../services/painelApi.service');
const limitador = require('../utils/limitadorLogin');

const CSS_LOGIN = 'cssConponenteAdmin/styleLogin.css';
const CSS_PAINEL = 'cssConponenteAdmin/stylePainel.css';

const URL_LOGIN = '/admin/login';
const URL_DASHBOARD = '/admin/dashboard';
const URL_AJAX = '/admin/ajax/agenda';

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================
// Sessão
// ============================================================

function regenerarSessao(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((erro) => (erro ? reject(erro) : resolve()));
    });
}

function salvarSessao(req) {
    return new Promise((resolve, reject) => {
        req.session.save((erro) => (erro ? reject(erro) : resolve()));
    });
}

// ============================================================
// Formatação
// ============================================================

// "2026-10-31" -> "31/10/2026"
function formatarDataBR(iso) {
    const [ano, mes, dia] = String(iso).split('-');
    return `${dia}/${mes}/${ano}`;
}

// Soma dias a "YYYY-MM-DD" sem depender do fuso do servidor.
function somarDias(iso, dias) {
    const [ano, mes, dia] = String(iso).split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia + dias));

    return data.toISOString().slice(0, 10);
}

function formatarPreco(valor) {
    return Number(valor || 0).toFixed(2).replace('.', ',');
}

// 55 -> "55 min" | 70 -> "1h 10min" | 60 -> "1h"
function formatarDuracao(minutos) {
    const total = Number(minutos) || 0;

    if (total <= 0) return '0 min';

    const horas = Math.floor(total / 60);
    const resto = total % 60;

    if (horas && resto) return `${horas}h ${resto}min`;
    if (horas) return `${horas}h`;

    return `${resto} min`;
}

function maiuscula1(texto) {
    const t = String(texto || '');
    return t.charAt(0).toUpperCase() + t.slice(1);
}

// /admin/dashboard?data=2026-10-31&profissional_id=3
function montarUrl({ data, profissional_id } = {}) {
    const params = new URLSearchParams();

    if (data) {
        params.set('data', data);
    }

    if (profissional_id) {
        params.set('profissional_id', String(profissional_id));
    }

    const query = params.toString();

    return `${URL_DASHBOARD}${query ? `?${query}` : ''}`;
}

// /admin/ajax/agenda?data=...&profissional_id=...
// Sem data = hoje (o servidor decide, então o painel acompanha a virada do dia).
function montarUrlAjax({ data, profissional_id } = {}) {
    const params = new URLSearchParams();

    if (data) {
        params.set('data', data);
    }

    if (profissional_id) {
        params.set('profissional_id', String(profissional_id));
    }

    const query = params.toString();

    return `${URL_AJAX}${query ? `?${query}` : ''}`;
}

// Só o que o painel precisa. Telefone NÃO vai para o navegador.
function prepararAgendamento(ag) {
    const servicos = Array.isArray(ag.servicos) ? ag.servicos : [];

    const servicosTexto = servicos
        .map((s) =>
            Number(s.quantidade) > 1
                ? `${s.quantidade}x ${s.nome}`
                : s.nome
        )
        .join(', ');

    // "avulso" = marcado pelo próprio salão; o resto = cliente agendou sozinho
    const origem = ag.cliente?.origem === 'avulso' ? 'salao' : 'online';

    const nome = ag.cliente?.nome;

    return {
        id: ag.id,
        hora: ag.hora,
        hora_fim: ag.hora_fim,
        status: ag.status,
        profissional: ag.profissional,
        cliente_nome:
            !nome || nome === 'Cliente do app' ? 'Cliente online' : nome,
        origem,
        origem_label: origem === 'salao' ? 'Salão' : 'Online',
        servicos_texto: servicosTexto || 'Serviços não informados',
        duracao_fmt: formatarDuracao(ag.duracao_minutos),
        preco_total_fmt: formatarPreco(ag.preco_total),
        observacao: ag.observacao || ''
    };
}

function lerFiltros(req) {
    const dataQuery = String(req.query.data || '');
    const profissionalQuery = parseInt(req.query.profissional_id, 10);

    return {
        data: REGEX_DATA.test(dataQuery) ? dataQuery : '',
        profissionalId:
            Number.isInteger(profissionalQuery) && profissionalQuery > 0
                ? profissionalQuery
                : 0
    };
}

async function carregarAgenda({ codigo, data, profissionalId }) {
    const resultado = await painelApi.agenda({
        codigo,
        data,
        profissional_id: profissionalId
    });

    const d = resultado.data;

    return {
        bruto: d,
        data: {
            iso: d.data,
            fmt: formatarDataBR(d.data),
            dia_semana: maiuscula1(d.dia_semana),
            hoje: Boolean(d.hoje)
        },
        agendamentos: (d.agendamentos || []).map(prepararAgendamento)
    };
}

// ============================================================
// LOGIN (código do salão)
// ============================================================

function telaLogin(res, status, { error = null, codigo = '' } = {}) {
    return res.status(status).render('admin/login', {
        adminStyle: CSS_LOGIN,
        error,
        codigo
    });
}

function mostrarLogin(req, res) {
    if (req.session?.painel?.codigo) {
        return res.redirect(URL_DASHBOARD);
    }

    return telaLogin(res, 200);
}

async function loginAdmin(req, res) {
    const codigoDigitado = String(req.body.codigo || '').trim();
    const ip = req.ip;

    if (!codigoDigitado) {
        return telaLogin(res, 400, {
            error: 'Informe o código do salão.'
        });
    }

    if (limitador.bloqueado(ip)) {
        return telaLogin(res, 429, {
            error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
            codigo: codigoDigitado
        });
    }

    try {
        // Valida o código no Go (o mesmo endpoint já devolve o salão e o dia)
        await painelApi.agenda({ codigo: codigoDigitado });

        const codigo = painelApi.normalizarCodigo(codigoDigitado);

        // Nova sessão ao entrar (evita fixação de sessão)
        await regenerarSessao(req);

        req.session.painel = { codigo };

        await salvarSessao(req);

        return res.redirect(URL_DASHBOARD);

    } catch (error) {
        console.error('Erro ao validar código do painel:', {
            status: error.status,
            message: error.message
        });

        if (error.status === 404) {
            limitador.registrarFalha(ip);

            return telaLogin(res, 401, {
                error: 'Código não encontrado. Confira e tente novamente.',
                codigo: codigoDigitado
            });
        }

        if (error.status === 400) {
            return telaLogin(res, 400, {
                error: 'Código inválido. Use apenas letras e números.',
                codigo: codigoDigitado
            });
        }

        if (error.status === 429) {
            return telaLogin(res, 429, {
                error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
                codigo: codigoDigitado
            });
        }

        return telaLogin(res, 500, {
            error: 'Não foi possível validar o código agora. Tente novamente.',
            codigo: codigoDigitado
        });
    }
}

function logoutAdmin(req, res) {
    req.session.destroy(() => {
        res.redirect(URL_LOGIN);
    });
}

// ============================================================
// DASHBOARD (agenda do dia)
//
// GET /admin/dashboard?data=YYYY-MM-DD&profissional_id=N
// Sem data = "modo vivo": acompanha o dia de hoje, inclusive na virada.
// ============================================================

async function mostrarDashboard(req, res) {
    const codigo = req.session.painel.codigo;
    const { data, profissionalId } = lerFiltros(req);

    try {
        const agenda = await carregarAgenda({ codigo, data, profissionalId });

        const d = agenda.bruto;
        const salao = d.salao || {};
        const dataIso = agenda.data.iso;

        const local = [salao.cidade, salao.estado]
            .filter(Boolean)
            .join(' - ');

        const profissionais = (d.profissionais || []).map((p) => ({
            id: p.id,
            nome: p.nome,
            ativo: p.id === profissionalId,
            url: montarUrl({ data: dataIso, profissional_id: p.id })
        }));

        // Dados que o front-end usa para desenhar e atualizar a lista
        const dadosIniciais = JSON.stringify({
            urlAjax: montarUrlAjax({ data, profissional_id: profissionalId }),
            modoVivo: !data,
            data: agenda.data,
            agendamentos: agenda.agendamentos
        }).replace(/</g, '\\u003c');

        return res.render('admin/dashboard', {
            adminStyle: CSS_PAINEL,
            erro: null,

            salao: {
                nome: salao.nome,
                local,
                logo_url: salao.logo_url || '',
                inicial: String(salao.nome || '?').trim().charAt(0).toUpperCase()
            },

            data: agenda.data,

            navegacao: {
                anterior: montarUrl({
                    data: somarDias(dataIso, -1),
                    profissional_id: profissionalId
                }),
                proxima: montarUrl({
                    data: somarDias(dataIso, 1),
                    profissional_id: profissionalId
                }),
                hoje: montarUrl({ profissional_id: profissionalId }),
                todos: montarUrl({ data: dataIso }),
                todosAtivo: profissionalId === 0
            },

            filtroProfissional: profissionalId,
            profissionais,

            dadosIniciais
        });

    } catch (error) {
        console.error('Erro ao carregar o painel:', {
            status: error.status,
            message: error.message
        });

        // Código removido ou alterado no banco: volta para o login
        if (error.status === 404) {
            return req.session.destroy(() => res.redirect(URL_LOGIN));
        }

        // Data inválida na URL: abre o dia de hoje
        if (error.status === 400 && data) {
            return res.redirect(URL_DASHBOARD);
        }

        const status = error.status === 429 ? 429 : 500;

        return res.status(status).render('admin/dashboard', {
            adminStyle: CSS_PAINEL,
            erro: status === 429
                ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
                : 'Não foi possível carregar a agenda agora. Tente novamente.'
        });
    }
}

// ============================================================
// GET /admin/ajax/agenda - atualização automática (JSON)
// ============================================================

async function agendaAjax(req, res) {
    const codigo = req.session.painel.codigo;
    const { data, profissionalId } = lerFiltros(req);

    res.set('Cache-Control', 'no-store');

    try {
        const agenda = await carregarAgenda({ codigo, data, profissionalId });

        return res.json({
            data: agenda.data,
            agendamentos: agenda.agendamentos
        });

    } catch (error) {
        console.error('Erro ao atualizar o painel:', {
            status: error.status,
            message: error.message
        });

        // Código removido: a sessão não vale mais
        if (error.status === 404) {
            return req.session.destroy(() =>
                res.status(401).json({ erro: 'sessao' })
            );
        }

        return res
            .status(error.status === 400 ? 400 : 502)
            .json({ erro: 'Não foi possível atualizar a agenda.' });
    }
}

module.exports = {
    mostrarLogin,
    loginAdmin,
    logoutAdmin,
    mostrarDashboard,
    agendaAjax
};