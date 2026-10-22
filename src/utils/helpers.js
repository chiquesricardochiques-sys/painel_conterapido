// src/utils/helpers.js


module.exports = {
    ifEquals: (a, b, options) => {
        return a == b ? options.fn(this) : options.inverse(this);
    },

    eq: function(a, b) {
        return a === b;
    },
    formatMoney(value) {
      return Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2
      });
    },
    iniciais(nome) {
      if (!nome) return '';
      return nome
        .split(' ')
        .slice(0, 2)
        .map(p => p[0])
        .join('')
        .toUpperCase();
    },
    neq: (a, b) =>{ a !== b},

    // 🔧 novo: checa se um array contém um valor (usado pra marcar
    // checkboxes de serviço de volta como "checked")
    includes: (array, value) => {
        if (!Array.isArray(array)) return false;
        return array.includes(value);
    },

    // 🔧 novo: comparação numérica "maior que" (usado pro plural
    // "Serviço"/"Serviços" em mySchedules.hbs)
    gt: (a, b) => {
        return a > b;
    }

};