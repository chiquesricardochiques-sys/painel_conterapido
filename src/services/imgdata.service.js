// services/imgData.service.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// ============================================================================
// CONFIGURAÇÃO DO AMBIENTE
// ============================================================================
// Base do distribuidor Node + prefixo /img (rotas: upload, update, delete, url)
const IMG_API_URL = process.env.NODE_IMG_URL || "http://localhost:3000/img";
const API_KEY = process.env.NODE_API_KEY;

const headers = {
  "x-api-key": "rick-456",
};

// ============================================================================
// FUNÇÃO CENTRAL DE COMUNICAÇÃO COM O PACOTE DE IMG
// ============================================================================
async function callImgEngine(method, endpoint, { payload = null, form = null, params = null, debugFields = null } = {}) {
  try {
    const url = `${IMG_API_URL}/${endpoint}`;

    console.log(`[ImgEngine] 📤 ${method.toUpperCase()} ${endpoint}`);
    console.log(`[ImgEngine]     url: ${url}`);
    console.log(`[ImgEngine]     x-api-key presente: ${API_KEY ? "sim" : "NÃO — checar .env"}`);

    if (debugFields) {
      console.log(`[ImgEngine]     campos:`, JSON.stringify(debugFields, null, 2));
    }
    if (params) {
      console.log(`[ImgEngine]     params:`, JSON.stringify(params, null, 2));
    }

    const config = { headers: { ...headers } };
    if (params) config.params = params;

    let response;

    if (form) {
      // upload / update -> multipart/form-data
      config.headers = { ...config.headers, ...form.getHeaders() };
      response = await axios({ method, url, data: form, ...config });
    } else if (payload) {
      // delete -> JSON no body
      response = await axios({ method, url, data: payload, ...config });
    } else {
      // url -> só query params, sem body
      response = await axios({ method, url, ...config });
    }

    console.log(`[ImgEngine] 📥 ${endpoint} OK (status ${response.status}):`, JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (err) {
    const erroReal = err.response?.data || err.message;
    console.error(`[ImgEngine] ❌ ${endpoint} (status ${err.response?.status || "sem resposta"}):`, JSON.stringify(erroReal, null, 2));
    throw err;
  }
}

// ============================================================================
// FUNÇÕES DO PACOTE DE IMG - NÃO MEXEM EM BANCO, SÓ CLOUDINARY
// ============================================================================

/**
 * UPLOAD - Sobe uma nova imagem
 * filePath: caminho local do arquivo (temp, vindo do multer do site)
 * project_code, id_instancia, table: só organizam a pasta no Cloudinary
 * Retorna: { url, public_id, width, height }
 */
const uploadImagem = async ({ filePath, project_code, id_instancia, table }) => {
  const form = new FormData();
  form.append("imagem", fs.createReadStream(filePath));
  form.append("project_code", project_code);
  form.append("id_instancia", id_instancia);
  form.append("table", table);

  return callImgEngine("post", "upload", {
    form,
    debugFields: { filePath, project_code, id_instancia, table },
  });
};

/**
 * UPDATE - Substitui uma imagem existente (sobe a nova, apaga a antiga)
 * Retorna: { url, public_id, width, height } (da nova imagem)
 */
const atualizarImagem = async ({ filePath, public_id_antigo, project_code, id_instancia, table }) => {
  const form = new FormData();
  form.append("imagem", fs.createReadStream(filePath));
  form.append("project_code", project_code);
  form.append("id_instancia", id_instancia);
  form.append("table", table);
  if (public_id_antigo) form.append("public_id_antigo", public_id_antigo);

  return callImgEngine("put", "update", {
    form,
    debugFields: { filePath, public_id_antigo, project_code, id_instancia, table },
  });
};

/**
 * DELETE - Remove a imagem do Cloudinary pelo public_id
 */
const deletarImagem = async (public_id) =>
  callImgEngine("delete", "delete", {
    payload: { public_id },
    debugFields: { public_id },
  });

/**
 * URL - Gera uma url otimizada/transformada a partir do public_id
 */
const urlOtimizada = async (public_id, { width, height, crop } = {}) =>
  callImgEngine("get", "url", { params: { public_id, width, height, crop } });

// ============================================================================
// EXPORT
// ============================================================================
module.exports = {
  uploadImagem,
  atualizarImagem,
  deletarImagem,
  urlOtimizada,
};