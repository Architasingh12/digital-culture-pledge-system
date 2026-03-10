const pool = require('../config/db');

// ─── Admin: List schedules for a program ─────────────────────────────────────
const getSchedules = async (req, res) => {
    try {
        const { program_id } = req.query;
        const result = await pool.query(
            `SELECT ss.*, p.title as program_title
             FROM survey_schedules ss
             LEFT JOIN programs p ON p.id = ss.program_id
             WHERE ($1::int IS NULL OR ss.program_id = $1)
             ORDER BY ss.created_at DESC`,
            [program_id || null]
        );
        return res.json({ success: true, schedules: result.rows });
    } catch (err) {
        console.error('getSchedules error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin: Create a schedule ────────────────────────────────────────────────
const createSchedule = async (req, res) => {
    try {
        const { program_id, label, interval_days, start_date } = req.body;
        if (!program_id || !label || !interval_days) {
            return res.status(400).json({ success: false, message: 'program_id, label and interval_days are required' });
        }

        const sd = start_date || new Date().toISOString().slice(0, 10);
        // next_due_date = start_date + interval_days
        const nextDue = new Date(sd);
        nextDue.setDate(nextDue.getDate() + parseInt(interval_days));

        const result = await pool.query(
            `INSERT INTO survey_schedules (program_id, label, interval_days, start_date, next_due_date)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [program_id, label, interval_days, sd, nextDue.toISOString().slice(0, 10)]
        );
        return res.status(201).json({ success: true, schedule: result.rows[0] });
    } catch (err) {
        console.error('createSchedule error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin: Update a schedule ────────────────────────────────────────────────
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, interval_days, is_active, next_due_date } = req.body;
        const result = await pool.query(
            `UPDATE survey_schedules
             SET label = COALESCE($1, label),
                 interval_days = COALESCE($2, interval_days),
                 is_active = COALESCE($3, is_active),
                 next_due_date = COALESCE($4::date, next_due_date)
             WHERE id = $5 RETURNING *`,
            [label, interval_days, is_active, next_due_date || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Schedule not found' });
        return res.json({ success: true, schedule: result.rows[0] });
    } catch (err) {
        console.error('updateSchedule error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



// ─── Admin: Delete a schedule ────────────────────────────────────────────────
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM survey_schedules WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Schedule deleted' });
    } catch (err) {
        console.error('deleteSchedule error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Participant: Get my pending survey instances ────────────────────────────
const getMyInstances = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT si.*, ss.label as schedule_label, ss.interval_days,
                    prog.title as program_title,
                    array_to_string(array_agg(pr.title), ', ') as practice_names
             FROM survey_instances si
             JOIN survey_schedules ss ON ss.id = si.schedule_id
             JOIN pledges pl ON pl.id = si.pledge_id
             JOIN programs prog ON prog.id = pl.program_id
             LEFT JOIN pledge_practices pp ON pp.pledge_id = pl.id
             LEFT JOIN practices pr ON pr.id = pp.practice_id
             WHERE pl.user_id = $1
             GROUP BY si.id, ss.label, ss.interval_days, prog.title
             ORDER BY si.due_date DESC`,
            [userId]
        );
        return res.json({ success: true, instances: result.rows });
    } catch (err) {
        console.error('getMyInstances error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Participant: Get single survey instance with practices ──────────────────
const getSurveyInstance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Get instance
        const instResult = await pool.query(
            `SELECT si.*, ss.label as schedule_label, prog.title as program_title,
                    pl.user_id
             FROM survey_instances si
             JOIN survey_schedules ss ON ss.id = si.schedule_id
             JOIN pledges pl ON pl.id = si.pledge_id
             JOIN programs prog ON prog.id = pl.program_id
             WHERE si.id = $1`,
            [id]
        );
        if (instResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Survey not found' });
        const instance = instResult.rows[0];
        if (instance.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
 
        // Get practices from this pledge
        const practicesResult = await pool.query(
            `SELECT pp.practice_id, pp.selected_action, pr.title, pr.type
             FROM pledge_practices pp
             JOIN practices pr ON pr.id = pp.practice_id
             WHERE pp.pledge_id = $1`,
            [instance.pledge_id]
        );

        // Get existing responses if any
        const responsesResult = await pool.query(
            `SELECT * FROM survey_instance_responses WHERE instance_id = $1`,
            [id]
        );

        return res.json({
            success: true,
            instance,
            practices: practicesResult.rows,
            responses: responsesResult.rows,
        });
    } catch (err) {
        console.error('getSurveyInstance error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Participant: Submit survey responses ────────────────────────────────────
const submitSurveyResponse = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params; // instance id
        const { responses } = req.body; // [{practice_id, action_taken_level, action_needed_next}]
        const userId = req.user.id;

        await client.query('BEGIN');

        // Verify ownership
        const instResult = await client.query(
            `SELECT si.*, pl.user_id FROM survey_instances si
             JOIN pledges pl ON pl.id = si.pledge_id
             WHERE si.id = $1`,
            [id]
        );
        if (instResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Survey not found' });
        const instance = instResult.rows[0];
        if (instance.user_id !== userId && req.user.role !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (instance.completed_at) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Survey already completed' });
        }

        // Delete old responses (idempotent)
        await client.query('DELETE FROM survey_instance_responses WHERE instance_id = $1', [id]);

        // Insert new responses
        for (const r of (responses || [])) {
            await client.query(
                `INSERT INTO survey_instance_responses (instance_id, practice_id, action_taken_level, action_needed_next)
                 VALUES ($1, $2, $3, $4)`,
                [id, r.practice_id, r.action_taken_level, r.action_needed_next || '']
            );
        }

        // Mark as completed
        await client.query(
            `UPDATE survey_instances SET completed_at = NOW() WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');
        return res.json({ success: true, message: 'Survey submitted successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('submitSurveyResponse error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
};

// ─── Admin: Get all instances (for admin summary view) ──────────────────────
const getAllInstances = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT si.*, ss.label, u.name as user_name, u.email,
                    prog.title as program_title,
                    (SELECT COUNT(*) FROM survey_instance_responses sir WHERE sir.instance_id = si.id) as response_count
             FROM survey_instances si
             JOIN survey_schedules ss ON ss.id = si.schedule_id
             JOIN pledges pl ON pl.id = si.pledge_id
             JOIN users u ON u.id = pl.user_id
             JOIN programs prog ON prog.id = pl.program_id
             ORDER BY si.created_at DESC`
        );
        return res.json({ success: true, instances: result.rows });
    } catch (err) {
        console.error('getAllInstances error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
        
    }
};

module.exports = {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getMyInstances,
    getSurveyInstance,
    submitSurveyResponse,
    getAllInstances,
};
