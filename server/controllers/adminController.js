const pool = require('../config/db');

// GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
    try {
        const participantsResult = await pool.query(`SELECT COUNT(DISTINCT user_id) as total_participants FROM pledges`);
        const totalParticipants = parseInt(participantsResult.rows[0].total_participants, 10) || 0;

        const pledgesResult = await pool.query(`SELECT COUNT(*) as total_pledges FROM pledges`);
        const totalPledges = parseInt(pledgesResult.rows[0].total_pledges, 10) || 0;

        const surveysResult = await pool.query(`
            SELECT COUNT(*) as total_responses,
                   SUM(CASE WHEN action_taken_level = 'H' THEN 100 WHEN action_taken_level = 'M' THEN 50 ELSE 0 END) as total_score
            FROM survey_responses
        `);

        const totalResponses = parseInt(surveysResult.rows[0].total_responses, 10) || 0;
        const totalScore = parseInt(surveysResult.rows[0].total_score, 10) || 0;
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
// Body: { title, description, start_date, end_date, max_practices, max_behaviours, practices: [{ type, title, actions[] }] }
const createProgramWithPractices = async (req, res) => {
    const { title, description, start_date, end_date, max_practices, max_behaviours, practices } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Program title is required.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert the program
        const programResult = await client.query(
            `INSERT INTO programs (title, description, start_date, end_date, max_practices, max_behaviours, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description || '', start_date || null, end_date || null, max_practices || 3, max_behaviours || 5, req.user.id]
        );
        const program = programResult.rows[0];

        // 2. Insert all practices atomically
        const insertedPractices = [];
        if (practices && practices.length > 0) {
            for (const p of practices) {
                if (!p.title || !p.title.trim()) continue; // skip untitled practices
                const practiceResult = await client.query(
                    `INSERT INTO practices (program_id, type, title, actions) VALUES ($1, $2, $3, $4) RETURNING *`,
                    [program.id, p.type, p.title.trim(), JSON.stringify(p.actions || [])]
                );
                insertedPractices.push(practiceResult.rows[0]);
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({
            success: true,
            message: `Program "${title}" created with ${insertedPractices.length} practices.`,
            program,
            practices: insertedPractices
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('createProgramWithPractices error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create program. Please try again.' });
    } finally {
        client.release();
    }
};


// GET /api/admin/report
const getDetailedReport = async (req, res) => {
    try {
        // 1. Total participants
        const totalParticipants = parseInt(
            (await pool.query('SELECT COUNT(DISTINCT user_id) AS n FROM pledges')).rows[0].n, 10) || 0;

        // 2. Practice selection counts (for most/least chosen & bar chart)
        const practiceCounts = await pool.query(`
            SELECT pr.title, pr.type, COUNT(pp.id) AS chosen_count
            FROM practices pr
            LEFT JOIN pledge_practices pp ON pp.practice_id = pr.id
            GROUP BY pr.id, pr.title, pr.type
            ORDER BY chosen_count DESC
        `);
        const practiceRows = practiceCounts.rows;
        const mostChosen = practiceRows[0]?.title || '—';
        const leastChosen = practiceRows[practiceRows.length - 1]?.title || '—';

        // 3. Survey level distribution & avg execution scores
        const surveyLevels = await pool.query(`
            SELECT action_taken_level, COUNT(*) AS cnt
            FROM survey_instance_responses
            GROUP BY action_taken_level
        `);
        const levelMap = { H: 0, M: 0, L: 0 };
        let totalResponses = 0, totalScore = 0;
        for (const r of surveyLevels.rows) {
            const level = r.action_taken_level;
            const cnt = parseInt(r.cnt, 10);
            if (levelMap[level] !== undefined) levelMap[level] = cnt;
            totalResponses += cnt;
            totalScore += level === 'H' ? cnt * 100 : level === 'M' ? cnt * 50 : 0;
        }
        const avgExecutionPct = totalResponses > 0 ? Math.round(totalScore / totalResponses) : 0;

        // 4. Weekly vs monthly avg practice execution (based on survey_instance_responses joined to practices)
        const weeklyMonthly = await pool.query(`
            SELECT pr.type,
                   ROUND(AVG(CASE sir.action_taken_level WHEN 'H' THEN 100 WHEN 'M' THEN 50 ELSE 0 END)) AS avg_score
            FROM survey_instance_responses sir
            JOIN practices pr ON pr.id = sir.practice_id
            WHERE pr.type IN ('weekly','monthly')
            GROUP BY pr.type
        `);
        let avgWeekly = 0, avgMonthly = 0;
        for (const r of weeklyMonthly.rows) {
            if (r.type === 'weekly') avgWeekly = parseInt(r.avg_score, 10) || 0;
            if (r.type === 'monthly') avgMonthly = parseInt(r.avg_score, 10) || 0;
        }

        // 5. % with 100% adherence (all their survey responses were H)
        const adherenceRes = await pool.query(`
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
        const perfectCount = parseInt(adherenceRes.rows[0].perfect, 10) || 0;
        const adherencePct = totalParticipants > 0 ? Math.round((perfectCount / totalParticipants) * 100) : 0;

        // 6. Avg improvement score (compare first vs last H-count per participant)
        const firstLastRes = await pool.query(`
            SELECT pledge_id,
                   first_value(avg_score) OVER (PARTITION BY pledge_id ORDER BY wave_rank)  AS first_score,
                   last_value(avg_score)  OVER (PARTITION BY pledge_id ORDER BY wave_rank ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_score
            FROM (
                SELECT si.pledge_id,
                       ROW_NUMBER() OVER (PARTITION BY si.pledge_id ORDER BY si.due_date) AS wave_rank,
                       ROUND(AVG(CASE sir.action_taken_level WHEN 'H' THEN 100 WHEN 'M' THEN 50 ELSE 0 END)) AS avg_score
                FROM survey_instances si
                JOIN survey_instance_responses sir ON sir.instance_id = si.id
                GROUP BY si.pledge_id, si.due_date
            ) waves
        `);
        let improvement = 0;
        if (firstLastRes.rows.length > 0) {
            const diffs = firstLastRes.rows.map(r =>
                (parseInt(r.last_score, 10) || 0) - (parseInt(r.first_score, 10) || 0));
            improvement = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
        }

        // 7. Per-participant rows
        const participantRows = await pool.query(`
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
                        ELSE ROUND(100.0 * (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL)
                               / (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id))
                   END AS completion_pct
            FROM pledges pl
            JOIN users u ON u.id = pl.user_id
            LEFT JOIN programs prog ON prog.id = pl.program_id
            ORDER BY u.name
        `);

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
            participants: participantRows.rows,
        });
    } catch (error) {
        console.error('getDetailedReport error:', error);
        return res.status(500).json({ success: false, message: 'Server error generating report.' });
    }
};

// GET /api/admin/report/pdf
const getReportPdf = async (req, res) => {
    try {
        // Just reuse getDetailedReport internal objects, but since getting the same data easily:
        // Instead of true code duplication we just mock req, res for getDetailedReport? No, express doesn't like that.
        // I will just copy the top-level query results from getDetailedReport here, but properly we would extract a service function.
        // For expediency:

        // --- DATA FETCHING (same as getDetailedReport) ---
        const totalParticipants = parseInt((await pool.query('SELECT COUNT(DISTINCT user_id) AS n FROM pledges')).rows[0].n, 10) || 0;
        const practiceCounts = await pool.query(`SELECT pr.title, pr.type, COUNT(pp.id) AS chosen_count FROM practices pr LEFT JOIN pledge_practices pp ON pp.practice_id = pr.id GROUP BY pr.id, pr.title, pr.type ORDER BY chosen_count DESC`);
        const mostChosen = practiceCounts.rows[0]?.title || '—';
        const leastChosen = practiceCounts.rows[practiceCounts.rows.length - 1]?.title || '—';

        const surveyLevels = await pool.query(`SELECT action_taken_level, COUNT(*) AS cnt FROM survey_instance_responses GROUP BY action_taken_level`);
        const levelMap = { H: 0, M: 0, L: 0 };
        let totalResponses = 0, totalScore = 0;
        for (const r of surveyLevels.rows) {
            const level = r.action_taken_level;
            const cnt = parseInt(r.cnt, 10);
            levelMap[level] = cnt;
            totalResponses += cnt;
            totalScore += level === 'H' ? cnt * 100 : level === 'M' ? cnt * 50 : 0;
        }
        const avgExecutionPct = totalResponses > 0 ? Math.round(totalScore / totalResponses) : 0;

        const adherenceRes = await pool.query(`
            SELECT COUNT(*) AS perfect FROM (SELECT si.pledge_id FROM survey_instances si JOIN survey_instance_responses sir ON sir.instance_id = si.id GROUP BY si.pledge_id HAVING SUM(CASE WHEN sir.action_taken_level = 'H' THEN 1 ELSE 0 END) = COUNT(sir.id) AND COUNT(sir.id) > 0) sub
        `);
        const adherencePct = totalParticipants > 0 ? Math.round((parseInt(adherenceRes.rows[0].perfect, 10) || 0) / totalParticipants * 100) : 0;

        const firstLastRes = await pool.query(`
            SELECT pledge_id, first_value(avg_score) OVER (PARTITION BY pledge_id ORDER BY wave_rank) AS first_score, last_value(avg_score) OVER (PARTITION BY pledge_id ORDER BY wave_rank ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_score FROM (SELECT si.pledge_id, ROW_NUMBER() OVER (PARTITION BY si.pledge_id ORDER BY si.due_date) AS wave_rank, ROUND(AVG(CASE sir.action_taken_level WHEN 'H' THEN 100 WHEN 'M' THEN 50 ELSE 0 END)) AS avg_score FROM survey_instances si JOIN survey_instance_responses sir ON sir.instance_id = si.id GROUP BY si.pledge_id, si.due_date) waves
        `);
        let improvement = 0;
        if (firstLastRes.rows.length > 0) {
            const diffs = firstLastRes.rows.map(r => (parseInt(r.last_score, 10) || 0) - (parseInt(r.first_score, 10) || 0));
            improvement = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
        }

        const participantRows = await pool.query(`
            SELECT u.name, u.email, pl.id AS pledge_id, prog.title AS program_title,
                   (SELECT COUNT(*) FROM pledge_practices pp JOIN practices pr ON pr.id = pp.practice_id WHERE pp.pledge_id = pl.id AND pr.type = 'weekly') AS weekly_count,
                   (SELECT COUNT(*) FROM pledge_practices pp JOIN practices pr ON pr.id = pp.practice_id WHERE pp.pledge_id = pl.id AND pr.type = 'monthly') AS monthly_count,
                   (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL) AS surveys_completed,
                   (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id) AS surveys_total,
                   CASE WHEN (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id) = 0 THEN 0
                        ELSE ROUND(100.0 * (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id AND si.completed_at IS NOT NULL) / (SELECT COUNT(*) FROM survey_instances si WHERE si.pledge_id = pl.id))
                   END AS completion_pct
            FROM pledges pl JOIN users u ON u.id = pl.user_id LEFT JOIN programs prog ON prog.id = pl.program_id ORDER BY u.name
        `);

        const reportData = {
            summary: {
                totalParticipants, avgExecutionPct, adherencePct,
                mostChosenPractice: mostChosen, leastChosenPractice: leastChosen,
                avgImprovementScore: improvement
            },
            practiceCounts: practiceCounts.rows,
            levelDistribution: levelMap,
            participants: participantRows.rows,
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

module.exports = {
    getDashboardStats,
    createProgramWithPractices,
    getDetailedReport,
    getReportPdf,
};

