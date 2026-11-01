// Limite de tentativas ERRADAS de código por visitante (em memória).
// 5 erros a cada 10 minutos.

const MAX_FALHAS = 5;
const JANELA_MS = 10 * 60 * 1000;

const falhas = new Map();

function bloqueado(chave) {
    const registro = falhas.get(chave);

    if (!registro) return false;

    if (Date.now() - registro.inicio > JANELA_MS) {
        falhas.delete(chave);
        return false;
    }

    return registro.quantidade >= MAX_FALHAS;
}

function registrarFalha(chave) {
    const agora = Date.now();

    // limpeza ocasional para o mapa não crescer sem fim
    if (falhas.size > 10000) {
        for (const [k, v] of falhas) {
            if (agora - v.inicio > JANELA_MS) falhas.delete(k);
        }
    }

    const registro = falhas.get(chave);

    if (!registro || agora - registro.inicio > JANELA_MS) {
        falhas.set(chave, { quantidade: 1, inicio: agora });
        return;
    }

    registro.quantidade++;
}

module.exports = {
    bloqueado,
    registrarFalha
};