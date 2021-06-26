var mysql = require('mysql');

var db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSEORD,
    database: process.env.DB_NAME
  });

module.exports = db;
