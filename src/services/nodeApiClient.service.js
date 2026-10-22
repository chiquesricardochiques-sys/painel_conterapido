// services/goData.service.js
const axios = require("axios");
const API_URL = process.env.NODE_BACKEND_URL;
const API_KEY = process.env.NODE_API_KEY; // ou PROJECT_API_KEY se você mudou o .env
const INSTANCE_ID = process.env.ID_INSTANCIA;
const PROJECT_ID = process.env.PROJECT_ID; // ✅ ADICIONE ESTA LINHA

const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

async function callGoEngine(endpoint, payload = {}) {
  try {
    const response = await axios.post(
      `${API_URL}/${endpoint}`,
      {
        project_id: PROJECT_ID,
        id_instancia: INSTANCE_ID,
        ...payload,
      },
      { headers }
    );

    const result = response.data;
    return result.data.data;
    // 🔥 NORMALIZAÇÃO GLOBAL DE RETORNO

    // Caso padrão do Go → { success, count, data: [] }
    if (result && Array.isArray(result.data)) {
      return result.data;
    }

    // Caso já venha array
    if (Array.isArray(result)) {
      return result;
    }

    // Caso venha objeto único
    if (result && typeof result === "object") {
      return [result];
    }

    // Caso inválido
    return [];

  } catch (err) {
    console.error(`[GoEngine ERROR] ${endpoint}:`, err.response?.data || err.message);
    return []; // 🔥 nunca quebrar quem consome
  }
}



function cleanPayload(payload) {
  const cleaned = {};
  for (const key in payload) {
    const value = payload[key];
    // remove undefined, mantém null, array ou objeto vazio
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Funções CRUD simplificadas
 */
const get = async ({ table, filter = {}, fields = [], join = null, order = null, limit = null }) =>{

  const payload = cleanPayload({ table, filter, fields, join, order, limit });

  return callGoEngine("get", payload);
}

const insert = async ({ table, data }) =>
  callGoEngine("insert", { table, data });

const update = async ({ table, id, data }) =>
  callGoEngine("update", { table, id, data });

const remove = async ({ table, id }) =>
  callGoEngine("delete", { table, id });

/**
 * Funções batch e agregações (opcionais para consultas complexas)
 */
const batchInsert = async ({ table, data }) =>
  callGoEngine("batch-insert", { table, data });

const batchUpdate = async ({ table, filter, data }) =>
  callGoEngine("batch-update", { table, filter, data });

const aggregate = async ({ table, pipeline }) =>
  callGoEngine("aggregate", { table, pipeline });

module.exports = {
  get,
  insert,
  update,
  remove,
  batchInsert,
  batchUpdate,
  aggregate,
};

