// const mysql = require('mysql2/promise');
// require('dotenv').config({ path: '../.env' });

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT) || 3306,
//   database: process.env.DB_NAME || 'digital_pledge',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   waitForConnections: true,
//   connectionLimit: 20,
//   queueLimit: 0,
//   timezone: '+00:00',
// });

// module.exports = pool;


const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const pool = mysql.createPool({
  host: '103.20.213.213',
  port:  3306,
  database:  'digital_pledge',
  user:  'digital_pledge',
  password: '_A_uLz5xZ8tit7qb',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+00:00'
});

// Test MySQL Connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully!');
    connection.release();
  }
});

// Export promise-based pool
module.exports = pool.promise();