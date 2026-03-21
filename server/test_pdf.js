require('dotenv').config({ path: '../.env' });
const pool = require('./config/db');
const { generateCertificatePDF } = require('./utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('📄 Testing PDF Generator...');
        
        // Find a pledge with practices and behaviours
        const result = await pool.query(`
            SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation, u.photo_url as user_photo,
            (SELECT json_agg(json_build_object('practice_id', pp.practice_id, 'selected_action', pp.selected_action, 'title', pr.title, 'type', pr.type)) FROM pledge_practices pp JOIN practices pr ON pp.practice_id = pr.id WHERE pp.pledge_id = p.id) as practices,
            (SELECT json_agg(row_to_json(b)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
            FROM pledges p
            LEFT JOIN users u ON u.id = p.user_id
            LEFT JOIN programs prog ON p.program_id = prog.id
            ORDER BY p.id DESC
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            console.log('No pledges found to test.');
            process.exit(0);
        }

        const pledge = result.rows[0];
        console.log(`Generating PDF for pledge ID: ${pledge.id}`);

        const pdfBuffer = await generateCertificatePDF(pledge);
        
        const outPath = path.join(__dirname, 'test_certificate.pdf');
        fs.writeFileSync(outPath, pdfBuffer);
        
        console.log(`✅ PDF generated successfully: ${outPath}`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Error generating PDF:', err);
        process.exit(1);
    }
})();
