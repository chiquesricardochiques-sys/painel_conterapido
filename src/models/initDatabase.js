const db = require('./db'); // sua conexão MySQL
const bcrypt = require('bcrypt');

async function initializeAdmin() {
  // verifica se já existe admin
  const [rows] = await db.query('SELECT COUNT(*) as total FROM admin');

  if (rows[0].total === 0) {
    const nome = 'Ricardo';
    const email = 'admin@gmail.com';
    const senha = '123456';
    const senha_hash = await bcrypt.hash(senha, 10);
    await db.query(
      `INSERT INTO admin (nome, email, senha_hash)
       VALUES (?, ?, ?)`,
      [nome, email, senha_hash]
    );

    
  } 
}

async function initializeDatabase() {
  try {
    // ============================================
    // CRIAR BANCO DE DADOS
    // ============================================
    await db.query(`CREATE DATABASE IF NOT EXISTS salao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await db.query(`USE salao`);

    // ============================================
    // TABELA: site_texts
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS site_texts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(50) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Inicialização das chaves do site (só insere se não existir)
    const defaultTexts = [
      ['header_title', 'Salão de Beleza'],
      ['mainbanner_heading', 'Veja nossos serviços'],
      ['mainbanner_subheading', 'Seu lugar para cortes de cabelo e barba'],
      ['footer_text', '© 2025 Salão de Beleza • Todos os direitos reservados'],
      ['mainbanner_img1', 'img1.png'],
      ['mainbanner_img2', 'img2.png'],
      ['mainbanner_img3', 'img3.png']
    ];

    for (const [key_name, value] of defaultTexts) {
      await db.query(
        `INSERT IGNORE INTO site_texts (key_name, value) VALUES (?, ?)`,
        [key_name, value]
      );
    }

    // ============================================
    // TABELA: comments
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nome VARCHAR(100),
        comentario TEXT,
        img VARCHAR(255),
        ativo BOOLEAN DEFAULT TRUE
      )
    `);

    // ============================================
    // TABELA: clientes
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        telefone VARCHAR(20),
        senha_hash VARCHAR(255) NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expira DATETIME

      )
    `);

    // ============================================
    // TABELA: servicos
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        duracao_min INT NOT NULL,
        preco DECIMAL(10,2) NOT NULL,
        img VARCHAR(500),
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================
    // TABELA: profissionais
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS profissionais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        especialidade VARCHAR(100),
        ativo TINYINT(1) DEFAULT 1,
        img VARCHAR(500),
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================
    // TABELA: agendamentos
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        servico_id INT NOT NULL,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        hora TIME NOT NULL,
        status ENUM('agendado','cancelado','concluido') DEFAULT 'agendado',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        observacoes TEXT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE,
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
      )
    `);

    // ============================================
    // TABELA: admin
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ============================================
    // TABELA: horarios_profissionais
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS horarios_profissionais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        dia_semana ENUM('seg','ter','qua','qui','sex','sab','dom') NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fim TIME NOT NULL,
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TABELA: bloqueios_profissionais
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS bloqueios_profissionais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fim TIME NOT NULL,
        motivo VARCHAR(255),
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TABELA: horarios_disponiveis
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS horarios_disponiveis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        hora TIME NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TABELA: horarios
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS horarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        hora TIME NOT NULL,
        status ENUM('livre','bloqueado','agendado') DEFAULT 'livre',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profissional_id, data, hora),
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TABELA: professional_schedule
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS professional_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        dia_semana ENUM('seg','ter','qua','qui','sex','sab','dom') NOT NULL,
        abre TINYINT(1) DEFAULT 1,
        abertura TIME NOT NULL,
        pausa_inicio TIME DEFAULT NULL,
        pausa_fim TIME DEFAULT NULL,
        fechamento TIME NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profissional_id, dia_semana),
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TABELA: dia_null
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS dia_null (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        motivo VARCHAR(255),
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profissional_id, data),
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // TABELA: orarios_null
    // ============================================
    await db.query(`
      CREATE TABLE IF NOT EXISTS orarios_null (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        hora TIME NOT NULL,
        motivo VARCHAR(255),
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profissional_id, data, hora),
        FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar o banco:', err);
  }
  initializeAdmin()
}

module.exports = initializeDatabase;
