const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUpdate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'digital_pledge'
    });

    try {
        const email = 'miinii01siingh@gmail.com';
        const company_id = 24;
        const name = 'archita';
        const designation = 'frontend';

        console.log('Running update...');
        const [result] = await pool.query(
            'UPDATE users SET company_id = ?, name = COALESCE(?, name), designation = COALESCE(?, designation) WHERE email = ?', 
            [company_id, name, designation, email]
        );
        console.log('Update result:', result);

        const [users] = await pool.query('SELECT id, email, company_id FROM users WHERE email = ?', [email]);
        console.log('User after update:', users);
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        pool.end();
    }
}
testUpdate();
