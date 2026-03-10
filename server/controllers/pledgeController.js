const pool = require('../config/db');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

// POST /api/pledges
const createPledge = async (req, res) => {
    const {
        program_id,
        problem_statement,
        north_star,
        success_metric,
        timeline,
        personal_habit,
        habit_frequency,
        measure_success,
        pledge_practices, // Array of { practice_id, selected_action }
        behaviours, // Array of { behaviour_text, type, why_it_matters, ... }
        // Section E – Review & Sign-off
        review_dates,
        signature_name,
        signoff_designation,
        digital_signature,
        submission_date,
    } = req.body;

    const userId = req.user.id;

    if (!program_id) return res.status(400).json({ success: false, message: 'program_id is required' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert Pledge
        const pledgeResult = await client.query(
            `INSERT INTO pledges 
        (user_id, program_id, problem_statement, north_star, success_metric, timeline, personal_habit, habit_frequency, measure_success,
         review_dates, signature_name, signoff_designation, digital_signature, submission_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [userId, program_id, problem_statement, north_star, success_metric, timeline, personal_habit, habit_frequency, measure_success,
             review_dates || null, signature_name || null, signoff_designation || null, digital_signature || null, submission_date || null]
        );

        const pledge = pledgeResult.rows[0];

        // 2. Insert Pledge Practices
        if (pledge_practices && pledge_practices.length > 0) {
            for (const pp of pledge_practices) {
                await client.query(
                    "INSERT INTO pledge_practices (pledge_id, practice_id, selected_action) VALUES ($1, $2, $3)",
                    [pledge.id, pp.practice_id, pp.selected_action]
                );
            }
        }

        // 3. Insert Behaviours
        if (behaviours && behaviours.length > 0) {
            for (const b of behaviours) {
                await client.query(
                    `INSERT INTO behaviours 
            (pledge_id, behaviour_text, type, why_it_matters, first_action_date, action_taken, action_needed_next) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [pledge.id, b.behaviour_text, b.type, b.why_it_matters, b.first_action_date || null, b.action_taken || '', b.action_needed_next || '']
                );
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Pledge submitted successfully.', pledge });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('createPledge error:', error);
        return res.status(500).json({ success: false, message: 'Error submitting pledge.' });
    } finally {
        client.release();
    }
};


// GET /api/pledges/my
const getMyPledges = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, prog.title as program_title, prog.description as program_description,
        (SELECT json_agg(json_build_object('practice_id', pp.practice_id, 'selected_action', pp.selected_action)) FROM pledge_practices pp WHERE pp.pledge_id = p.id) as practices,
        (SELECT json_agg(row_to_json(b)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
       FROM pledges p
       JOIN programs prog ON p.program_id = prog.id
       WHERE p.user_id = $1
       ORDER BY p.submitted_at DESC`,
            [req.user.id]
        );
        return res.status(200).json({ success: true, pledges: result.rows });
    } catch (error) {
        console.error('getMyPledges error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/pledges/all (admin)
const getAllPledges = async (req, res) => {
    try {
        // Basic implementation for all pledges, can be paginated later
        const result = await pool.query(
            `SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation,
        (SELECT json_agg(json_build_object('practice_id', pp.practice_id, 'selected_action', pp.selected_action)) FROM pledge_practices pp WHERE pp.pledge_id = p.id) as practices,
        (SELECT json_agg(row_to_json(b)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
       FROM pledges p
       JOIN users u ON u.id = p.user_id
       JOIN programs prog ON p.program_id = prog.id
       ORDER BY p.submitted_at DESC LIMIT 100`
        );

        return res.status(200).json({
            success: true,
            pledges: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('getAllPledges error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/pledges/:id
const getPledgeById = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation,
        (SELECT json_agg(json_build_object('practice_id', pp.practice_id, 'selected_action', pp.selected_action)) FROM pledge_practices pp WHERE pp.pledge_id = p.id) as practices,
        (SELECT json_agg(row_to_json(b)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
       FROM pledges p
       JOIN users u ON u.id = p.user_id
       JOIN programs prog ON p.program_id = prog.id
       WHERE p.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Pledge not found' });

        // Auth check (user can only see own pledge unless admin)
        if (req.user.role !== 'admin' && result.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        return res.status(200).json({ success: true, pledge: result.rows[0] });
    } catch (error) {
        console.error('getPledgeById error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/pledges/:id/certificate
const downloadCertificate = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation, u.photo_url as user_photo,
        (SELECT json_agg(json_build_object('practice_id', pp.practice_id, 'selected_action', pp.selected_action, 'title', pr.title, 'type', pr.type)) FROM pledge_practices pp JOIN practices pr ON pp.practice_id = pr.id WHERE pp.pledge_id = p.id) as practices,
        (SELECT json_agg(row_to_json(b)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
       FROM pledges p
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN programs prog ON p.program_id = prog.id
       WHERE p.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Pledge not found' });

        const pledge = result.rows[0];

        // Auth check (user can only see own pledge unless admin)
        if (req.user.role !== 'admin' && pledge.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const pdfBuffer = await generateCertificatePDF(pledge);

        const formattedName = pledge.user_name ? pledge.user_name.replace(/\\s+/g, '-') : 'Participant';
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="pledge-certificate-' + formattedName + '.pdf"'
        });

        return res.send(pdfBuffer);
    } catch (error) {
        console.error('downloadCertificate error:', error);
        return res.status(500).json({ success: false, message: 'Server error while generating PDF.' });
    }
};

module.exports = {
    createPledge,
    getMyPledges,
    getAllPledges,
    getPledgeById,
    downloadCertificate,
};
