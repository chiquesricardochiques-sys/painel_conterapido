// services/goData.service.js - CORRIGIDO (não duplica prefixo)
const axios = require("axios");

// ============================================================================
// CONFIGURAÇÃO DO AMBIENTE
// ============================================================================
const API_URL = process.env.NODE_BACKEND_URL || "https://api.ricardo-site.tech/api";
const API_KEY = process.env.NODE_API_KEY || "rick-456"; // Chave padrão para desenvolvimento
const INSTANCE_ID = Number(process.env.ID_INSTANCIA) || 1;
const PROJECT_ID = Number(process.env.PROJECT_ID) || 1;

const headers = {
  "Content-Type": "application/json",
  "x-api-key": "rick-456",
};

// ============================================================================
// FUNÇÃO CENTRAL DE COMUNICAÇÃO COM A API
// ============================================================================
async function callGoEngine(endpoint, payload = {}) {
  try {
    // console.log(`[GoEngine] 📤 ${endpoint}:`, JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_URL}/${endpoint}`, payload, { headers });
    
    // console.log(`[GoEngine] 📥 ${endpoint} OK:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (err) {
    const erroReal = err.response?.data || err.message;
    // console.error(`[GoEngine] ❌ ${endpoint}:`, JSON.stringify(erroReal, null, 2));
    throw err;
  }
}

// ============================================================================
// FUNÇÕES CRUD - A API GO JÁ RECEBE O NOME COMPLETO DA TABELA
// ============================================================================

/**
 * GET - Consulta com filtros
 * IMPORTANTE: Passar o nome da tabela SEM prefixo (ex: "clientes")
 * O prefixo "salao_beleza_" será adicionado automaticamente
 */
const get = async ({ table, alias = "", joins = [], where = {}, select = [], order_by = null, limit = null }) => {
  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,
    table: table,
    alias: alias,
    select: Array.isArray(select) && select.length > 0 ? select : [],
    joins: Array.isArray(joins) ? joins : [],
    where: where || {},
    where_raw: "",
    group_by: "",
    having: "",
    order_by: order_by || "",
    limit: limit || 0,
    offset: 0
  };

  const result = await callGoEngine("get", payload);

  if (result?.data?.data && Array.isArray(result.data.data)) {
    return result.data.data;
  }

  if (result?.data && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
};

/**
 * INSERT - Inserir único registro
 */
/**
 * INSERT - Inserir único registro
 */
const insert = async ({ table, data }) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("insert requer 'data' com valores");
  }

  
  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,  // ✅ Aqui está correto (id_instancia, não instance_id)
    table: table,
    data: data
  };

  const result = await callGoEngine("insert", payload);
  
  if (result?.data?.id) {
    return { id: result.data.id, success: true };
  }
  
  return result;
};

/**
 * UPDATE - Atualizar registros
 */
const update = async ({ table, data, where = {} }) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("update requer dados para atualizar");
  }

  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,
    table: table, // ✅ SEM prefixo
    data,
    where: where || {},
    where_raw: ""
  };

  return callGoEngine("update", payload);
};

/**
 * DELETE - Remover registros
 */
const remove = async ({ table, where = {}, mode = "hard" }) => {
  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,
    table: table, // ✅ SEM prefixo
    where: where || {},
    where_raw: "",
    mode
  };

  return callGoEngine("delete", payload);
};

/**
 * BATCH INSERT - Inserir múltiplos registros
 */
/**
 * BATCH INSERT - Inserir múltiplos registros
 */
const batchInsert = async ({ table, data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("batchInsert requer 'data' como array");
  }

  // ✅ TRANSFORMAR cada objeto em array de columns
  
  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,
    table: table,
    data: data  // ✅ MUDOU DE 'data' PARA 'rows'
  };

  return callGoEngine("batch-insert", payload);
};

/**
 * BATCH UPDATE - Atualizar múltiplos registros
 */
const batchUpdate = async ({ table, updates }) => {
  if (!updates || !Array.isArray(updates)) {
    throw new Error("batchUpdate requer 'updates' como array");
  }

  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,
    table: table, // ✅ SEM prefixo
    updates
  };

  return callGoEngine("batch-update", payload);
};

/**
 * AGGREGATE - Operações de agregação
 */
const aggregate = async ({ table, operation, column = null, where = {} }) => {
  if (!operation) throw new Error("aggregate requer 'operation'");

  const payload = {
    project_id: PROJECT_ID,
    id_instancia: INSTANCE_ID,
    table: table, // ✅ SEM prefixo
    operation,
    column: column || null,
    where: where || {}
  };

  const result = await callGoEngine("aggregate", payload);
  
  if (result?.data?.result !== undefined) {
    return result.data.result;
  }
  
  return 0;
};

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  get,
  insert,
  update,
  remove,
  batchInsert,
  batchUpdate,
  aggregate,
  
  PROJECT_ID,
  INSTANCE_ID,
};
