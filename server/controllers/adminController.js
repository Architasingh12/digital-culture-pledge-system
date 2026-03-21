const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Password regex for enforcing strong passwords during admin creation
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).{8,}$/;

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
    try {
        const [partRows] = await pool.query(`SELECT COUNT(DISTINCT user_id) as total_participants FROM pledges`);
        const totalParticipants = parseInt(partRows[0].total_participants, 10) || 0;

        const [pledgeRows] = await pool.query(`SELECT COUNT(*) as total_pledges FROM pledges`);
        const totalPledges = parseInt(pledgeRows[0].total_pledges, 10) || 0;

        const [surveyRows] = await pool.query(`
            SELECT COUNT(*) as total_responses,
                   SUM(CASE WHEN action_taken_level = 'H' THEN 100 WHEN action_taken_level = 'M' THEN 50 ELSE 0 END) as total_score
            FROM survey_responses
        `);

        const totalResponses = parseInt(surveyRows[0].total_responses, 10) || 0;
        const totalScore = parseInt(surveyRows[0].total_score, 10) || 0;
        let avgExecutionPercentage = 0;
        if (totalResponses > 0) avgExecutionPercentage = Math.round(totalScore / totalResponses);

        const surveyCompletionRate = totalResponses > 0 ? '100%' : '0%';

        return res.status(200).json({
            success: true,
            stats: { totalParticipants, totalPledges, surveyCompletionRate, avgExecutionPercentage: `${avgExecutionPercentage}%` }
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        return res.status(500).json({ success: false, message: 'Server error fetching stats.' });
    }
};


// POST /api/admin/create-program-with-practices
const createProgramWithPractices = async (req, res) => {
    const { title, description, start_date, end_date, max_practices, max_behaviours, practices, company_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Program title is required.' });
    if (!company_id) return res.status(400).json({ success: false, message: 'Company is required.' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert the program
        const [programResult] = await conn.query(
            `INSERT INTO programs (title, description, start_date, end_date, max_practices, max_behaviours, company_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || '', start_date || null, end_date || null, max_practices || 3, max_behaviours || 5, company_id, req.user.id]
        );
        const [programRows] = await conn.query('SELECT * FROM programs WHERE id = ?', [programResult.insertId]);
        const program = programRows[0];

        // 2. Insert all practices atomically
        const insertedPractices = [];
        if (practices && practices.length > 0) {
            for (const p of practices) {
                if (!p.title || !p.title.trim()) continue; // skip untitled practices
                const [practiceResult] = await conn.query(
                    `INSERT INTO practices (program_id, type, title, actions) VALUES (?, ?, ?, ?)`,
                    [program.id, p.type, p.title.trim(), JSON.stringify(p.actions || [])]
                );
                const [practiceRows] = await conn.query('SELECT * FROM practices WHERE id = ?', [practiceResult.insertId]);
                insertedPractices.push(practiceRows[0]);
            }
        }

        await conn.commit();
        return res.status(201).json({
            success: true,
            message: `Program "${title}" created with ${insertedPractices.length} practices.`,
            program,
            practices: insertedPractices
        });
    } catch (error) {
        await conn.rollback();
        console.error('createProgramWithPractices error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create program. Please try again.' });
    } finally {
        conn.release();
    }
};


// GET /api/admin/report
const getDetailedReport = async (req, res) => {
    let totalParticipants = 0;
    let practiceRows = [];
    let mostChosen = '—';
    let leastChosen = '—';
    let levelMap = { H: 0, M: 0, L: 0 };
    let avgExecutionPct = 0;
    let avgWeekly = 0;
    let avgMonthly = 0;
    let adherencePct = 0;
    let improvement = 0;
    let participantRows = [];

    try {
        // 1. Total participants
        try {
            const [rows] = await pool.query('SELECT COUNT(DISTINCT user_id) AS n FROM pledges');
            totalParticipants = parseInt(rows[0].n, 10) || 0;
        } catch (error) {
            console.warn('Error fetching total participants:', error.message);
        }

        // 2. Practice selection counts
        try {
            const [rows] = await pool.query(`
                SELECT pr.title, pr.type, COUNT(pp.id) AS chosen_count
                FROM practices pr
                LEFT JOIN pledge_practices pp ON pp.practice_id = pr.id
                GROUP BY pr.id, pr.title, pr.type
                ORDER BY chosen_count DESC
            `);
            practiceRows = rows;
            if (practiceRows.length > 0) {
                mostChosen = practiceRows[0]?.title || '—';
                leastChosen = practiceRows[practiceRows.length - 1]?.title || '—';
            }
        } catch (error) {
            console.warn('Error fetching practice counts:', error.message);
        }

        // 3. Survey level distribution & avg execution scores
        try {
            const [rows] = await pool.query(`
                SELECT action_taken_level, COUNT(*) AS cnt
                FROM survey_instance_responses
                GROUP BY action_taken_level
            `);
            let totalResponses = 0, totalScore = 0;
            for (const r of rows) {
                const level = r.action_taken_level;
                const cnt = parseInt(r.cnt, 10);
                if (levelMap[level] !== undefined) levelMap[level] = cnt;
                totalResponses += cnt;
                totalScore += level === 'H' ? cnt * 100 : level === 'M' ? cnt * 50 : 0;
            }
            avgExecutionPct = totalResponses > 0 ? Math.round(totalScore / totalResponses) : 0;
        } catch (error) {
            console.warn('Error fetching survey level distribution:', error.message);
        }

        // 4. Weekly vs monthly avg practice execution
        try {
            const [rows] = await pool.query(`
                SELECT pr.type,
                       ROUND(AVG(CASE sir.action_taken_level WHEN 'H' THEN 100 WHEN 'M' THEN 50 ELSE 0 END)) AS avg_score
                FROM survey_instance_responses sir
                JOIN practices pr ON pr.id = sir.practice_id
                WHERE pr.type IN ('weekly','monthly')
                GROUP BY pr.type
            `);
            for (const r of rows) {
                if (r.type === 'weekly') avgWeekly = parseInt(r.avg_score, 10) || 0;
                if (r.type === 'monthly') avgMonthly = parseInt(r.avg_score, 10) || 0;
            }
        } catch (error) {
            console.warn('Error fetching weekly/monthly execution:', error.message);
        }

        // 5. % with 100% adherence
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) AS perfect
                FROM (
                    SELECT si.pledge_id
                    FROM survey_instances si
                    JOIN survey_instance_responses sir ON sir.instance_id = si.id
                    GROUP BY si.pledge_id
                    HAVING SUM(CASE WHEN sir.action_taken_level = 'H' THEN 1 ELSE 0 END) = COUNT(sir.id)
                       AND COUNT(sir.id) > 0
                ) sub
            `);
            const perfectCount = parseInt(rows[0].perfect, 10) || 0;
            adherencePct = totalParticipants > 0 ? Math.round((perfectCount / totalParticipants) * 100) : 0;
        } catch (error) {
            console.warn('Error fetching adherence percentage:', error.message);
        }

        // 6. Avg improvement score (first vs last score per participant — computed in JS)
        try {
            const [rows] = await pool.query(`
                SELECT si.pledge_id,
                       si.due_date,
                       ROUND(AVG(CASE sir.action_taken_level WHEN 'H' THEN 100 WHEN 'M' THEN 50 ELSE 0 END)) AS avg_score
                FROM survey_instances si
                JOIN survey_instance_responses sir ON sir.instance_id = si.id
                GROUP BY si.pledge_id, si.due_date
                ORDER BY si.pledge_id, si.due_date
            `);

            const pledgeScoresMap = new Map();
            for (const row of rows) {
                if (!pledgeScoresMap.has(row.pledge_id)) {
                    pledgeScoresMap.set(row.pledge_id, []);
                }
                pledgeScoresMap.get(row.pledge_id).push(parseInt(row.avg_score, 10) || 0);
            }

            const diffs = [];
            for (const scores of pledgeScoresMap.values()) {
                if (scores.length > 1) {
                    diffs.push(scores[scores.length - 1] - scores[0]);
                }
            }

            if (diffs.length > 0) {
                improvement = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
            }
        } catch (error) {
            console.warn('Error fetching and calculating improvement score:', error.message);
        }

        // 7. Per-participant rows
        try {
            const [rows] = await pool.query(`
                SELECT u.name,
                       u.email,
                       pl.id AS pledge_id,
                       prog.title AS program_title,
                       (SELECT COUNT(*) FROM pledge_practices pp JOIN practices pr ON pr.id = pp.practice_id WHERE pp.pledge_id = pl.id AND pr.type = 'weekly')  AS weekly_count,
                       (SELECT COUNT(*) FROM pledge_practices pp JOIN practices pr ON pr.id = pp.practice_id WHERE pp.pledge_id = pl.id AND pr.type = 'monthly') AS monthly_count,
                       (SELECT b.behaviour_text FROM behaviours b WHERE b.pledge_id = pl.id AND b.type IN ('stop','reduce') ORDER BY b.id LIMIT 1) AS key_behaviour,
                       (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL) AS surveys_completed,
                       (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id) AS surveys_total,
                       CASE WHEN (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id) = 0 THEN 0
                            ELSE ROUND(100 * (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL)
                                   / (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id))
                       END AS completion_pct
                FROM pledges pl
                JOIN users u ON u.id = pl.user_id
                LEFT JOIN programs prog ON prog.id = pl.program_id
                ORDER BY u.name
            `);
            participantRows = rows;
        } catch (error) {
            console.warn('Error fetching participant rows:', error.message);
        }

        return res.json({
            success: true,
            summary: {
                totalParticipants,
                avgWeeklyExecution: avgWeekly,
                avgMonthlyExecution: avgMonthly,
                adherencePct,
                mostChosenPractice: mostChosen,
                leastChosenPractice: leastChosen,
                avgImprovementScore: improvement,
                avgExecutionPct,
            },
            levelDistribution: levelMap,
            practiceCounts: practiceRows.map(r => ({
                name: r.title.length > 28 ? r.title.slice(0, 28) + '…' : r.title,
                fullName: r.title,
                type: r.type,
                count: parseInt(r.chosen_count, 10),
            })),
            participants: participantRows,
        });
    } catch (error) {
        console.error('getDetailedReport general error:', error);
        return res.status(500).json({ success: false, message: 'Server error generating report.' });
    }
};

// GET /api/admin/report/pdf
const getReportPdf = async (req, res) => {
    try {
        // --- DATA FETCHING ---
        const [partRows] = await pool.query('SELECT COUNT(DISTINCT user_id) AS n FROM pledges');
        const totalParticipants = parseInt(partRows[0].n, 10) || 0;

        const [practiceCountRows] = await pool.query(
            `SELECT pr.title, pr.type, COUNT(pp.id) AS chosen_count FROM practices pr LEFT JOIN pledge_practices pp ON pp.practice_id = pr.id GROUP BY pr.id, pr.title, pr.type ORDER BY chosen_count DESC`
        );
        const mostChosen = practiceCountRows[0]?.title || '—';
        const leastChosen = practiceCountRows[practiceCountRows.length - 1]?.title || '—';

        const [surveyLevelRows] = await pool.query(
            `SELECT action_taken_level, COUNT(*) AS cnt FROM survey_instance_responses GROUP BY action_taken_level`
        );
        const levelMap = { H: 0, M: 0, L: 0 };
        let totalResponses = 0, totalScore = 0;
        for (const r of surveyLevelRows) {
            const level = r.action_taken_level;
            const cnt = parseInt(r.cnt, 10);
            levelMap[level] = cnt;
            totalResponses += cnt;
            totalScore += level === 'H' ? cnt * 100 : level === 'M' ? cnt * 50 : 0;
        }
        const avgExecutionPct = totalResponses > 0 ? Math.round(totalScore / totalResponses) : 0;

        const [adherenceRows] = await pool.query(`
            SELECT COUNT(*) AS perfect FROM (
                SELECT si.pledge_id FROM survey_instances si
                JOIN survey_instance_responses sir ON sir.instance_id = si.id
                GROUP BY si.pledge_id
                HAVING SUM(CASE WHEN sir.action_taken_level = 'H' THEN 1 ELSE 0 END) = COUNT(sir.id) AND COUNT(sir.id) > 0
            ) sub
        `);
        const adherencePct = totalParticipants > 0
            ? Math.round((parseInt(adherenceRows[0].perfect, 10) || 0) / totalParticipants * 100)
            : 0;

        // JS-based improvement calculation (first vs last score per pledge)
        const [allScoreRows] = await pool.query(`
            SELECT si.pledge_id, si.due_date,
                   ROUND(AVG(CASE sir.action_taken_level WHEN 'H' THEN 100 WHEN 'M' THEN 50 ELSE 0 END)) AS avg_score
            FROM survey_instances si
            JOIN survey_instance_responses sir ON sir.instance_id = si.id
            GROUP BY si.pledge_id, si.due_date
            ORDER BY si.pledge_id, si.due_date
        `);
        const pledgeScoresMap = new Map();
        for (const row of allScoreRows) {
            if (!pledgeScoresMap.has(row.pledge_id)) pledgeScoresMap.set(row.pledge_id, []);
            pledgeScoresMap.get(row.pledge_id).push(parseInt(row.avg_score, 10) || 0);
        }
        const diffs = [];
        for (const scores of pledgeScoresMap.values()) {
            if (scores.length > 1) diffs.push(scores[scores.length - 1] - scores[0]);
        }
        const improvement = diffs.length > 0
            ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
            : 0;

        const [participantRows] = await pool.query(`
            SELECT u.name, u.email, pl.id AS pledge_id, prog.title AS program_title,
                   (SELECT COUNT(*) FROM pledge_practices pp JOIN practices pr ON pr.id = pp.practice_id WHERE pp.pledge_id = pl.id AND pr.type = 'weekly') AS weekly_count,
                   (SELECT COUNT(*) FROM pledge_practices pp JOIN practices pr ON pr.id = pp.practice_id WHERE pp.pledge_id = pl.id AND pr.type = 'monthly') AS monthly_count,
                   (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL) AS surveys_completed,
                   (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id) AS surveys_total,
                   CASE WHEN (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id) = 0 THEN 0
                        ELSE ROUND(100 * (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL) / (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id))
                   END AS completion_pct
            FROM pledges pl JOIN users u ON u.id = pl.user_id LEFT JOIN programs prog ON prog.id = pl.program_id ORDER BY u.name
        `);

        const reportData = {
            summary: {
                totalParticipants, avgExecutionPct, adherencePct,
                mostChosenPractice: mostChosen, leastChosenPractice: leastChosen,
                avgImprovementScore: improvement
            },
            practiceCounts: practiceCountRows,
            levelDistribution: levelMap,
            participants: participantRows,
        };

        const { generateReportPDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generateReportPDF(reportData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="digital-pledge-report.pdf"'
        });

        return res.send(pdfBuffer);
    } catch (error) {
        console.error('getReportPdf error:', error);
        return res.status(500).json({ success: false, message: 'Server error generating PDF report.' });
    }
};

// GET /api/admin/company-admins
const getCompanyAdmins = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, email, designation, role, created_at FROM users WHERE role = 'company_admin' ORDER BY created_at DESC"
        );
        return res.status(200).json({ success: true, companyAdmins: rows });
    } catch (error) {
        console.error('getCompanyAdmins error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch company admins.' });
    }
};

// POST /api/admin/company-admins
const createCompanyAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Check if user exists
        const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await conn.query(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'company_admin')`,
            [name.trim(), email.toLowerCase().trim(), passwordHash]
        );
        const [userRows] = await conn.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        await conn.commit();

        return res.status(201).json({
            success: true,
            message: 'Company created successfully.',
            companyAdmin: userRows[0],
        });
    } catch (error) {
        await conn.rollback();
        console.error('createCompanyAdmin error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create company admin.' });
    } finally {
        conn.release();
    }
};

// GET /api/admin/super-dashboard-stats
const getSuperAdminStats = async (req, res) => {
    try {
        const [companiesRows] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'company_admin'");
        const [participantsRows] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'participant'");
        const [programsRows] = await pool.query('SELECT COUNT(*) AS total FROM programs');

        return res.status(200).json({
            success: true,
            stats: {
                totalCompanies: parseInt(companiesRows[0].total, 10) || 0,
                companyAdmins: parseInt(companiesRows[0].total, 10) || 0,
                totalParticipants: parseInt(participantsRows[0].total, 10) || 0,
                activeProgrammes: parseInt(programsRows[0].total, 10) || 0,
            },
        });
    } catch (error) {
        console.error('getSuperAdminStats error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
    }
};

module.exports = {
    getDashboardStats,
    createProgramWithPractices,
    getDetailedReport,
    getReportPdf,
    getCompanyAdmins,
    createCompanyAdmin,
    getSuperAdminStats,
};
