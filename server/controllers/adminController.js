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

module.exports = {
    getDashboardStats,
    createProgramWithPractices
};
