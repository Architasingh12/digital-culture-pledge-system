const pool = require('../config/db');
const { sendReminderEmail } = require('../utils/emailUtil');
const puppeteer = require('puppeteer');

// Reusable PDF generator for downloads
const tableHtml = (title, headers, rows) => {
    const ths = headers.map(h => `<th style="padding:12px;border-bottom:2px solid #e2e8f0;text-align:left;color:#475569;font-size:12px;text-transform:uppercase;">${h}</th>`).join('');
    const trs = rows.map(r => {
        const tds = r.map(c => `<td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;">${c}</td>`).join('');
        return `<tr>${tds}</tr>`;
    }).join('');

    return `
    <html>
      <head>
        <style>body{font-family:sans-serif;padding:40px;}</style>
      </head>
      <body>
        <h1 style="color:#1e293b;margin-bottom:20px;font-size:24px;">${title}</h1>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <thead><tr>${ths}</tr></thead>
          <tbody>${trs}</tbody>
        </table>
      </body>
    </html>
    `;
};

const buildPdfBuffer = async (htmlContent) => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
    await browser.close();
    return pdfBuffer;
};

const getCompanyAdminStatus = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.name, u.email, u.last_login as last_login,
            (SELECT COUNT(*) FROM pledges WHERE user_id = u.id) as pledge_count,
            (SELECT COUNT(*) FROM surveys s JOIN pledges p ON p.id = s.pledge_id WHERE p.user_id = u.id) as survey_count
            FROM users u
            WHERE u.company_id = ? AND u.role = 'participant'
            ORDER BY u.name
        `, [req.user.id]);

        const participants = rows.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            status: r.last_login ? 'Active' : 'Inactive',
            last_login: r.last_login,
            pledge_status: r.pledge_count > 0 ? 'Submitted' : 'Pending',
            survey_status: r.survey_count > 0 ? 'Submitted' : 'Pending'
        }));

        res.status(200).json({ success: true, participants });
    } catch (error) {
        console.error('getCompanyAdminStatus error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getCompanyDownloads = async (req, res) => {
    const { type, format } = req.params;
    const companyId = req.user.id;
    try {
        let rows = [], headers = [], csvRows = [], tableName = '';

        if (type === 'participants') {
            [rows] = await pool.query(`
                SELECT u.name, u.email, u.designation, u.created_at,
                       prog.title AS program_title,
                       COUNT(DISTINCT pl.id) AS total_pledges,
                       COUNT(DISTINCT CASE WHEN si.completed_at IS NOT NULL THEN si.id END) AS surveys_done
                FROM users u
                LEFT JOIN pledges pl ON pl.user_id = u.id
                LEFT JOIN programs prog ON prog.id = pl.program_id
                LEFT JOIN survey_instances si ON si.pledge_id = pl.id
                WHERE u.company_id = ? AND u.role = 'participant'
                GROUP BY u.id, prog.title
                ORDER BY u.name
            `, [companyId]);

            headers = ['Name', 'Email', 'Designation', 'Program', 'Total Pledges', 'Surveys Completed', 'Joined'];
            csvRows = rows.map(r => [
                r.name, r.email, r.designation || '', r.program_title || '—',
                r.total_pledges, r.surveys_done, new Date(r.created_at).toLocaleDateString()
            ]);
            tableName = 'Company Participants Report';

        } else if (type === 'pledges') {
            [rows] = await pool.query(`
                SELECT pl.submitted_at, prog.title AS program_title,
                       u.name, u.email,
                       (SELECT COUNT(*) FROM pledge_practices pp WHERE pp.pledge_id = pl.id) as practices_count,
                       (SELECT COUNT(*) FROM behaviours b WHERE b.pledge_id = pl.id) as behaviours_count
                FROM pledges pl
                JOIN users u ON u.id = pl.user_id
                JOIN programs prog ON prog.id = pl.program_id
                WHERE u.company_id = ?
                ORDER BY pl.submitted_at DESC
            `, [companyId]);

            headers = ['Participant', 'Email', 'Program', 'Practices Selected', 'Behaviours Selected', 'Submitted At'];
            csvRows = rows.map(r => [
                r.name, r.email, r.program_title || '—',
                r.practices_count, r.behaviours_count, new Date(r.submitted_at).toLocaleDateString()
            ]);
            tableName = 'Company Pledges Report';

        } else if (type === 'surveys') {
            [rows] = await pool.query(`
                SELECT u.name, u.email,
                       prog.title AS program_title,
                       COUNT(si.id) AS total_surveys,
                       COUNT(CASE WHEN si.completed_at IS NOT NULL THEN 1 END) AS completed_surveys
                FROM users u
                JOIN pledges pl ON pl.user_id = u.id
                JOIN programs prog ON prog.id = pl.program_id
                LEFT JOIN survey_instances si ON si.pledge_id = pl.id
                WHERE u.company_id = ?
                GROUP BY pl.id, u.name
                ORDER BY u.name
            `, [companyId]);

            headers = ['Participant', 'Email', 'Program', 'Total Surveys', 'Completed', 'Completion %'];
            csvRows = rows.map(r => {
                const total = r.total_surveys;
                const completed = r.completed_surveys;
                const pct = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
                return [r.name, r.email, r.program_title || '—', total, completed, pct + '%'];
            });
            tableName = 'Company Surveys Report';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid report type.' });
        }

        if (format === 'csv') {
            const csv = [headers, ...csvRows].map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="' + type + '-report.csv"');
            return res.send(csv);
        } else if (format === 'pdf') {
            const buf = await buildPdfBuffer(tableHtml(tableName, headers, csvRows));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="' + type + '-report.pdf"');
            return res.send(buf);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid format.' });
        }

    } catch (error) {
        console.error('getCompanyDownloads error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate download.' });
    }
};

const getCompanyReminderConfig = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT audience, frequency, last_sent FROM company_reminders WHERE company_id = ?', [req.user.id]);
        res.json({ success: true, configs: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const saveCompanyReminderConfig = async (req, res) => {
    const { audience, frequency } = req.body;
    try {
        const [existing] = await pool.query('SELECT id FROM company_reminders WHERE company_id = ? AND audience = ?', [req.user.id, audience]);
        if (existing.length > 0) {
            await pool.query('UPDATE company_reminders SET frequency = ? WHERE id = ?', [frequency, existing[0].id]);
        } else {
            await pool.query('INSERT INTO company_reminders (company_id, audience, frequency) VALUES (?, ?, ?)', [req.user.id, audience, frequency]);
        }
        res.json({ success: true, message: 'Reminder configuration saved.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const triggerCompanyReminders = async (req, res) => {
    const { audience } = req.body;
    try {
        let targetUsers = [];
        if (audience === 'inactive') {
            const [users] = await pool.query("SELECT email, name FROM users WHERE company_id = ? AND last_login IS NULL AND role='participant'", [req.user.id]);
            targetUsers = users;
        } else if (audience === 'pending_pledge') {
            const [users] = await pool.query(`
                SELECT u.email, u.name FROM users u
                LEFT JOIN pledges p ON p.user_id = u.id
                WHERE u.company_id = ? AND p.id IS NULL AND u.role='participant'
            `, [req.user.id]);
            targetUsers = users;
        } else if (audience === 'pending_survey') {
            const [users] = await pool.query(`
                SELECT DISTINCT u.email, u.name 
                FROM users u
                JOIN pledges p ON p.user_id = u.id
                JOIN survey_instances si ON si.pledge_id = p.id
                WHERE u.company_id = ? AND si.completed_at IS NULL AND u.role='participant'
            `, [req.user.id]);
            targetUsers = users;
        }

        for (const u of targetUsers) {
            try {
                // Send reminder basic email
                await sendReminderEmail(u.email, u.name, 1);
            } catch (e) { console.error('Email send failed:', e); }
        }

        await pool.query('UPDATE company_reminders SET last_sent = NOW() WHERE company_id = ? AND audience = ?', [req.user.id, audience]);
        res.json({ success: true, message: 'Sent ' + targetUsers.length + ' reminders successfully.' });
    } catch (error) {
        console.error('triggerCompanyReminders error:', error);
        res.status(500).json({ success: false, message: 'Server error triggering reminders.' });
    }
};

const addCompanyParticipant = async (req, res) => {
    const { name, email, designation } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required' });
    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (existing.length > 0) {
            await pool.query('UPDATE users SET company_id = ?, name = COALESCE(?, name), designation = COALESCE(?, designation) WHERE email = ?', [req.user.id, name.trim(), designation, email.toLowerCase().trim()]);
        } else {
            await pool.query('INSERT INTO users (name, email, designation, role, company_id) VALUES (?, ?, ?, ?, ?)', [name.trim(), email.toLowerCase().trim(), designation || '', 'participant', req.user.id]);
        }
        res.json({ success: true, message: 'Participant added successfully!' });
    } catch (error) {
        console.error('addCompanyParticipant error:', error);
        res.status(500).json({ success: false, message: 'Server error adding participant.' });
    }
};

module.exports = {
    addCompanyParticipant,
    getCompanyAdminStatus,
    getCompanyDownloads,
    getCompanyReminderConfig,
    saveCompanyReminderConfig,
    triggerCompanyReminders
};
