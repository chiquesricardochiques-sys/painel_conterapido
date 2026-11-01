// ============================================================
// painelApi.service.js
//
// Comunicação do painel do cabeleireiro com a API Go.
//
// Rota do Go:
//   POST /painel/agenda  { codigo, data?, profissional_id? }
//
// Variáveis de ambiente (.env):
//   API_URL         URL base da API Go          (ex.: http://localhost:8080)
//   API_TIMEOUT_MS  tempo máximo por chamada    (opcional, padrão 10000)
// ============================================================

const EM_PRODUCAO = process.env.NODE_ENV === 'production';

const API_URL = (
    process.env.API_URL ||
    (EM_PRODUCAO ? '' : 'http://localhost:8080')
).replace(/\/+$/, '');

if (!API_URL) {
    throw new Error(
        'API_URL não foi configurada nas variáveis de ambiente.'
    );
}

const TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS) > 0
    ? Number(process.env.API_TIMEOUT_MS)
    : 10000;

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_CODIGO = /^[A-Z0-9]{4,20}$/;

// ------------------------------------------------------------
// BASE
// ------------------------------------------------------------

// Erro de validação feito aqui no Node (antes de chamar o Go).
// Tem status 400 para o controller tratar igual aos erros do Go.
function erroValidacao(mensagem) {
    const error = new Error(mensagem);
    error.status = 400;
    return error;
}

// "#0815-332" -> "0815332"
function normalizarCodigo(bruto) {
    return String(bruto ?? '')
        .toUpperCase()
        .replace(/[#\s-]/g, '');
}

// POST na API Go.
async function request(endpoint, body = {}) {
    let response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
    } catch (cause) {
        const error = new Error('Não foi possível falar com a API.');
        error.status = 503;
        error.cause = cause;
        throw error;
    }

    const responseText = await response.text();

    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { message: responseText };
        }
    }

    if (!response.ok || !data || data.success !== true) {
        const error = new Error(
            data?.message ||
            data?.error ||
            `Erro na API Go: HTTP ${response.status}`
        );

        error.status = response.ok ? 502 : response.status;
        error.data = data;

        throw error;
    }

    return data;
}

// ============================================================
// AGENDA DO DIA
//
// Retorna { success, data: {
//   salao: { id, nome, cidade, estado, logo_url },
//   profissionais: [{ id, nome, especialidade, foto_url }],
//   data, dia_semana, hoje, profissional_id,
//   resumo: { total, pendentes, confirmados, concluidos, cancelados,
//             nao_compareceu, valor_previsto },
//   agendamentos: [{ id, hora, hora_fim, duracao_minutos, status,
//     status_label, profissional_id, profissional,
//     cliente: { nome, telefone, origem },
//     servicos: [{ nome, quantidade, preco, duracao_min }],
//     preco_total, observacao }]
// } }
//
// Erros: 400 = dados inválidos, 404 = código não encontrado,
//        429 = muitas tentativas erradas.
// ============================================================
async function agenda({ codigo, data = '', profissional_id = 0 } = {}) {
    const codigoNormalizado = normalizarCodigo(codigo);

    if (!REGEX_CODIGO.test(codigoNormalizado)) {
        throw erroValidacao('Informe o código do salão.');
    }

    if (data && !REGEX_DATA.test(data)) {
        throw erroValidacao('Data inválida.');
    }

    const profissionalId = Number(profissional_id) || 0;

    if (!Number.isInteger(profissionalId) || profissionalId < 0) {
        throw erroValidacao('Profissional inválido.');
    }

    return request('/painel/agenda', {
        codigo: codigoNormalizado,
        data,
        profissional_id: profissionalId
    });
}

module.exports = {
    normalizarCodigo,
    agenda
};