require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
    });
    const [rows] = await connection.query(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`);
    if (rows.length === 0) {
      console.log(`Database '${process.env.DB_NAME}' not found. Creating...`);
      await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`Database '${process.env.DB_NAME}' created successfully.`);
    } else {
      console.log(`Database '${process.env.DB_NAME}' already exists.`);
    }
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err.message);
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+07:00',
    logging: false,
  }
);

module.exports = { sequelize, initDatabase };
