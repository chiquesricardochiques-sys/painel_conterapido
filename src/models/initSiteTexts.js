// models/initializeSiteTexts.js
const goData = require('../services/nodeApiClient.service.js');

const TABLE = 'site_texts';

// Chaves padrão do site
const defaultTexts = [
    { key_name: 'header_title', value: 'Salão de Beleza' },
    { key_name: 'mainbanner_heading', value: 'Veja nossos serviços' },
    { key_name: 'mainbanner_subheading', value: 'Seu lugar para cortes de cabelo e barba' },
    { key_name: 'footer_text', value: '© 2026 Salão de Beleza • Todos os direitos reservados' },
    { key_name: 'mainbanner_img1', value: 'img1.png' },
    { key_name: 'mainbanner_img2', value: 'img2.png' },
    { key_name: 'mainbanner_img3', value: 'img3.png' },
    { key_name: 'facebook', value: '' },
    { key_name: 'instagram', value: '' },
    { key_name: 'whatsapp', value: '' },
    { key_name: 'tiktok', value: '' }
];

/**
 * Inicializa as chaves do site (apenas se não existirem)
 */
async function initializeSiteTexts() {
    try {
        console.log('🔧 Inicializando textos do site...');

        // Busca textos existentes
        const existentes = await goData.get({ table: TABLE });
        const existingKeys = existentes?.data?.map(t => t.key_name) || [];

        // Insere apenas os que não existem
        const toInsert = defaultTexts.filter(
            item => !existingKeys.includes(item.key_name)
        );

        if (toInsert.length > 0) {
            await goData.batchInsert({
                table: TABLE,
                data: toInsert
            });

            console.log(`✅ ${toInsert.length} chaves do site inseridas com sucesso!`);
        } else {
            console.log('✅ Todas as chaves do site já existem.');
        }
    } catch (err) {
        console.error('❌ Erro ao inicializar textos do site:', err.message);
    }
}

module.exports = initializeSiteTexts;
