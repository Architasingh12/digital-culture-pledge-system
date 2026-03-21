// const pool = require('../config/db');
// const { generateCertificatePDF } = require('../utils/pdfGenerator');

// // POST /api/pledges
// const createPledge = async (req, res) => {
//     const {
//         program_id,
//         problem_statement,
//         north_star,
//         success_metric,
//         timeline,
//         personal_habit,
//         habit_frequency,
//         measure_success,
//         pledge_practices, // Array of { practice_id, selected_action }
//         behaviours, // Array of { behaviour_text, type, why_it_matters, ... }
//         // Section E – Review & Sign-off
//         review_dates,
//         signature_name,
//         signoff_designation,
//         digital_signature,
//         submission_date,
//         // Participant Photo
//         user_photo,
//     } = req.body;

//     const userId = req.user.id;

//     if (!program_id) return res.status(400).json({ success: false, message: 'program_id is required' });

//     const conn = await pool.getConnection();
//     try {
//         await conn.beginTransaction();

//         // 1. Insert Pledge
//         const [pledgeResult] = await conn.query(
//             `INSERT INTO pledges
//         (user_id, program_id, problem_statement, north_star, success_metric, timeline, personal_habit, habit_frequency, measure_success,
//          review_dates, signature_name, signoff_designation, digital_signature, submission_date, user_photo)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [userId, program_id, problem_statement, north_star, success_metric, timeline, personal_habit, habit_frequency, measure_success,
//              review_dates || null, signature_name || null, signoff_designation || null, digital_signature || null, submission_date || null, user_photo || null]
//         );
//         const pledgeId = pledgeResult.insertId;
//         const [pledgeRows] = await conn.query('SELECT * FROM pledges WHERE id = ?', [pledgeId]);
//         const pledge = pledgeRows[0];

//         // 2. Insert Pledge Practices
//         if (pledge_practices && pledge_practices.length > 0) {
//             for (const pp of pledge_practices) {
//                 await conn.query(
//                     "INSERT INTO pledge_practices (pledge_id, practice_id, selected_action) VALUES (?, ?, ?)",
//                     [pledge.id, pp.practice_id, pp.selected_action]
//                 );
//             }
//         }

//         // 3. Insert Behaviours
//         if (behaviours && behaviours.length > 0) {
//             for (const b of behaviours) {
//                 await conn.query(
//                     `INSERT INTO behaviours
//             (pledge_id, behaviour_text, type, why_it_matters, first_action_date, action_taken, action_needed_next)
//            VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                     [pledge.id, b.behaviour_text, b.type, b.why_it_matters, b.first_action_date || null, b.action_taken || '', b.action_needed_next || '']
//                 );
//             }
//         }

//         await conn.commit();
//         return res.status(201).json({ success: true, message: 'Pledge submitted successfully.', pledge });
//     } catch (error) {
//         await conn.rollback();
//         console.error('createPledge error:', error);
//         return res.status(500).json({ success: false, message: 'Error submitting pledge.' });
//     } finally {
//         conn.release();
//     }
// };


// // GET /api/pledges/my
// const getMyPledges = async (req, res) => {
//     try {
//         const [rows] = await pool.query(
//             `SELECT p.*, prog.title as program_title, prog.description as program_description,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('practice_id', pp.practice_id, 'selected_action', pp.selected_action)) FROM pledge_practices pp WHERE pp.pledge_id = p.id) as practices,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', b.id, 'pledge_id', b.pledge_id, 'behaviour_text', b.behaviour_text, 'type', b.type, 'why_it_matters', b.why_it_matters, 'first_action_date', b.first_action_date, 'action_taken', b.action_taken, 'action_needed_next', b.action_needed_next)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
//        FROM pledges p
//        JOIN programs prog ON p.program_id = prog.id
//        WHERE p.user_id = ?
//        ORDER BY p.submitted_at DESC`,
//             [req.user.id]
//         );
//         return res.status(200).json({ success: true, pledges: rows });
//     } catch (error) {
//         console.error('getMyPledges error:', error);
//         return res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// // GET /api/pledges/all (admin)
// const getAllPledges = async (req, res) => {
//     try {
//         const [rows] = await pool.query(
//             `SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('practice_id', pp.practice_id, 'selected_action', pp.selected_action)) FROM pledge_practices pp WHERE pp.pledge_id = p.id) as practices,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', b.id, 'pledge_id', b.pledge_id, 'behaviour_text', b.behaviour_text, 'type', b.type, 'why_it_matters', b.why_it_matters, 'first_action_date', b.first_action_date, 'action_taken', b.action_taken, 'action_needed_next', b.action_needed_next)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
//        FROM pledges p
//        JOIN users u ON u.id = p.user_id
//        JOIN programs prog ON p.program_id = prog.id
//        ORDER BY p.submitted_at DESC LIMIT 100`
//         );

//         return res.status(200).json({
//             success: true,
//             pledges: rows,
//             total: rows.length
//         });
//     } catch (error) {
//         console.error('getAllPledges error:', error);
//         return res.status(500).json({ success: false, message: 'Server error.' });
//     }
// };

// // GET /api/pledges/:id
// const getPledgeById = async (req, res) => {
//     try {
//         const [rows] = await pool.query(
//             `SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('practice_id', pp.practice_id, 'selected_action', pp.selected_action)) FROM pledge_practices pp WHERE pp.pledge_id = p.id) as practices,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', b.id, 'pledge_id', b.pledge_id, 'behaviour_text', b.behaviour_text, 'type', b.type, 'why_it_matters', b.why_it_matters, 'first_action_date', b.first_action_date, 'action_taken', b.action_taken, 'action_needed_next', b.action_needed_next)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
//        FROM pledges p
//        JOIN users u ON u.id = p.user_id
//        JOIN programs prog ON p.program_id = prog.id
//        WHERE p.id = ?`,
//             [req.params.id]
//         );

//         if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pledge not found' });

//         // Auth check (user can only see own pledge unless admin)
//         if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
//             return res.status(403).json({ success: false, message: 'Access denied' });
//         }

//         return res.status(200).json({ success: true, pledge: rows[0] });
//     } catch (error) {
//         console.error('getPledgeById error:', error);
//         return res.status(500).json({ success: false, message: 'Server error.' });
//     }
// };

// // GET /api/pledges/:id/certificate
// const downloadCertificate = async (req, res) => {
//     try {
//         const [rows] = await pool.query(
//             `SELECT p.*, prog.title as program_title, u.name as user_name, u.email as user_email, u.designation as user_designation,
//             COALESCE(p.user_photo, u.photo_url) as user_photo,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('practice_id', pp.practice_id, 'selected_action', pp.selected_action, 'title', pr.title, 'type', pr.type)) FROM pledge_practices pp JOIN practices pr ON pp.practice_id = pr.id WHERE pp.pledge_id = p.id) as practices,
//         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', b.id, 'pledge_id', b.pledge_id, 'behaviour_text', b.behaviour_text, 'type', b.type, 'why_it_matters', b.why_it_matters, 'first_action_date', b.first_action_date, 'action_taken', b.action_taken, 'action_needed_next', b.action_needed_next)) FROM behaviours b WHERE b.pledge_id = p.id) as behaviours
//        FROM pledges p
//        LEFT JOIN users u ON u.id = p.user_id
//        LEFT JOIN programs prog ON p.program_id = prog.id
//        WHERE p.id = ?`,
//             [req.params.id]
//         );

//         if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pledge not found' });

//         const pledge = rows[0];

//         // Auth check (user can only see own pledge unless admin)
//         if (req.user.role !== 'admin' && pledge.user_id !== req.user.id) {
//             return res.status(403).json({ success: false, message: 'Access denied' });
//         }

//         const pdfBuffer = await generateCertificatePDF(pledge);

//         const formattedName = pledge.user_name ? pledge.user_name.replace(/\s+/g, '-') : 'Participant';
//         res.set({
//             'Content-Type': 'application/pdf',
//             'Content-Disposition': 'attachment; filename="pledge-certificate-' + formattedName + '.pdf"'
//         });

//         return res.send(pdfBuffer);
//     } catch (error) {
//         console.error('downloadCertificate error:', error);
//         return res.status(500).json({ success: false, message: 'Server error while generating PDF.' });
//     }
// };

// module.exports = {
//     createPledge,
//     getMyPledges,
//     getAllPledges,
//     getPledgeById,
//     downloadCertificate,
// };


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
        pledge_practices,
        behaviours,
        review_dates,
        signature_name,
        signoff_designation,
        digital_signature,
        submission_date,
        user_photo,
    } = req.body;

    const userId = req.user.id;

    if (!program_id) {
        return res.status(400).json({ success: false, message: 'program_id is required' });
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO pledges
            (user_id, program_id, problem_statement, north_star, success_metric, timeline,
             personal_habit, habit_frequency, measure_success,
             review_dates, signature_name, signoff_designation,
             digital_signature, submission_date, user_photo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                program_id,
                problem_statement,
                north_star,
                success_metric,
                timeline,
                personal_habit,
                habit_frequency,
                measure_success,
                review_dates || null,
                signature_name || null,
                signoff_designation || null,
                digital_signature || null,
                submission_date || null,
                user_photo || null
            ]
        );

        const pledgeId = result.insertId;

        // Insert practices
        if (pledge_practices && pledge_practices.length > 0) {
            for (const p of pledge_practices) {
                await conn.query(
                    `INSERT INTO pledge_practices (pledge_id, practice_id, selected_action)
                     VALUES (?, ?, ?)`,
                    [pledgeId, p.practice_id, p.selected_action]
                );
            }
        }

        // Insert behaviours
        if (behaviours && behaviours.length > 0) {
            for (const b of behaviours) {
                await conn.query(
                    `INSERT INTO behaviours
                    (pledge_id, behaviour_text, type, why_it_matters, first_action_date, action_taken, action_needed_next)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        pledgeId,
                        b.behaviour_text,
                        b.type,
                        b.why_it_matters,
                        b.first_action_date || null,
                        b.action_taken || '',
                        b.action_needed_next || ''
                    ]
                );
            }
        }

        await conn.commit();

        return res.status(201).json({
            success: true,
            message: "Pledge submitted successfully",
            pledge_id: pledgeId
        });

    } catch (error) {
        await conn.rollback();
        console.error("createPledge error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    } finally {
        conn.release();
    }
};



/* ------------------------------------------------------------- */
/* GET MY PLEDGES */
/* ------------------------------------------------------------- */

const getMyPledges = async (req, res) => {
    try {

        const [pledges] = await pool.query(
            `SELECT p.*, prog.title as program_title
             FROM pledges p
             JOIN programs prog ON p.program_id = prog.id
             WHERE p.user_id = ?
             ORDER BY p.submitted_at DESC`,
            [req.user.id]
        );

        for (const pledge of pledges) {

            const [practices] = await pool.query(
                `SELECT practice_id, selected_action
                 FROM pledge_practices
                 WHERE pledge_id = ?`,
                [pledge.id]
            );

            const [behaviours] = await pool.query(
                `SELECT *
                 FROM behaviours
                 WHERE pledge_id = ?`,
                [pledge.id]
            );

            pledge.practices = practices;
            pledge.behaviours = behaviours;
        }

        return res.json({ success: true, pledges });

    } catch (error) {
        console.error("getMyPledges error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



/* ------------------------------------------------------------- */
/* GET ALL PLEDGES (ADMIN) */
/* ------------------------------------------------------------- */

const getAllPledges = async (req, res) => {

    try {

        const [pledges] = await pool.query(
            `SELECT p.*, prog.title as program_title,
                    u.name as user_name,
                    u.email as user_email,
                    u.designation as user_designation
             FROM pledges p
             JOIN users u ON u.id = p.user_id
             JOIN programs prog ON prog.id = p.program_id
             ORDER BY p.submitted_at DESC
             LIMIT 100`
        );

        for (const pledge of pledges) {

            const [practices] = await pool.query(
                `SELECT practice_id, selected_action
                 FROM pledge_practices
                 WHERE pledge_id = ?`,
                [pledge.id]
            );

            const [behaviours] = await pool.query(
                `SELECT *
                 FROM behaviours
                 WHERE pledge_id = ?`,
                [pledge.id]
            );

            pledge.practices = practices;
            pledge.behaviours = behaviours;
        }

        res.json({
            success: true,
            pledges,
            total: pledges.length
        });

    } catch (error) {
        console.error("getAllPledges error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



/* ------------------------------------------------------------- */
/* GET SINGLE PLEDGE */
/* ------------------------------------------------------------- */

const getPledgeById = async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT p.*, prog.title as program_title,
                    u.name as user_name,
                    u.email as user_email,
                    u.designation as user_designation
             FROM pledges p
             JOIN users u ON u.id = p.user_id
             JOIN programs prog ON prog.id = p.program_id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Pledge not found" });
        }

        const pledge = rows[0];

        const [practices] = await pool.query(
            `SELECT practice_id, selected_action
             FROM pledge_practices
             WHERE pledge_id = ?`,
            [pledge.id]
        );

        const [behaviours] = await pool.query(
            `SELECT *
             FROM behaviours
             WHERE pledge_id = ?`,
            [pledge.id]
        );

        pledge.practices = practices;
        pledge.behaviours = behaviours;

        return res.json({ success: true, pledge });

    } catch (error) {
        console.error("getPledgeById error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



/* ------------------------------------------------------------- */
/* DOWNLOAD CERTIFICATE */
/* ------------------------------------------------------------- */

const downloadCertificate = async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT p.*, prog.title as program_title,
                    u.name as user_name,
                    u.email as user_email,
                    u.designation as user_designation,
                    COALESCE(p.user_photo, u.photo_url) as user_photo
             FROM pledges p
             LEFT JOIN users u ON u.id = p.user_id
             LEFT JOIN programs prog ON prog.id = p.program_id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Pledge not found" });
        }

        const pledge = rows[0];

        const [practices] = await pool.query(
            `SELECT pp.practice_id, pp.selected_action, pr.title, pr.type
             FROM pledge_practices pp
             JOIN practices pr ON pr.id = pp.practice_id
             WHERE pp.pledge_id = ?`,
            [pledge.id]
        );

        const [behaviours] = await pool.query(
            `SELECT *
             FROM behaviours
             WHERE pledge_id = ?`,
            [pledge.id]
        );

        pledge.practices = practices;
        pledge.behaviours = behaviours;

        const pdfBuffer = await generateCertificatePDF(pledge);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=pledge-${pledge.user_name}.pdf`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("downloadCertificate error:", error);
        res.status(500).json({ success: false, message: "Error generating certificate" });
    }
};

const getCertificateData = async (req, res) => {
    try {

        const [rows] = await pool.query(
            `SELECT p.*, prog.title as program_title,
                    u.name as user_name,
                    u.email as user_email,
                    u.designation as user_designation,
                    COALESCE(p.user_photo, u.photo_url) as user_photo
             FROM pledges p
             LEFT JOIN users u ON u.id = p.user_id
             LEFT JOIN programs prog ON prog.id = p.program_id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Pledge not found"
            });
        }

        const pledge = rows[0];

        const [practices] = await pool.query(
            `SELECT pp.practice_id, pp.selected_action, pr.title, pr.type
             FROM pledge_practices pp
             JOIN practices pr ON pr.id = pp.practice_id
             WHERE pp.pledge_id = ?`,
            [pledge.id]
        );

        const [behaviours] = await pool.query(
            `SELECT *
             FROM behaviours
             WHERE pledge_id = ?`,
            [pledge.id]
        );

        pledge.practices = practices;
        pledge.behaviours = behaviours;

        return res.json({
            success: true,
            certificate_data: pledge
        });

    } catch (error) {

        console.error("getCertificateData error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    createPledge,
    getMyPledges,
    getAllPledges,
    getPledgeById,
    downloadCertificate,
    getCertificateData,
};