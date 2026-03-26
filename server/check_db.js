const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDb() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'digital_pledge'
    });

    try {
        const [users] = await pool.query('SELECT id, name, email, role, company_id FROM users');
        console.log('All Users:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkDb();
