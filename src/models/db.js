// // src/models/db.js
// const mysql = require('mysql2/promise');
// require('dotenv').config();

// // Criar conexão com o MySQL
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
//   port: 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });
// db.getConnection()
//   .then(conn => {
//     console.log("MySQL conectado na Railway");
//     conn.release();
//   })
//   .catch(err => {
//     console.error("Erro MySQL:", err);
//   });

// module.exports = db;
