const pool = require('../config/db');

// ─── Admin: List schedules for a program ─────────────────────────────────────
const getSchedules = async (req, res) => {
    try {
        const { program_id } = req.query;
        // Build query conditionally to avoid the PostgreSQL $1::int IS NULL pattern
        let sql = `SELECT ss.*, p.title as program_title
                   FROM survey_schedules ss
                   LEFT JOIN programs p ON p.id = ss.program_id`;
        const params = [];
        if (program_id) {
            sql += ` WHERE ss.program_id = ?`;
            params.push(program_id);
        }
        sql += ` ORDER BY ss.created_at DESC`;

        const [rows] = await pool.query(sql, params);
        return res.json({ success: true, schedules: rows });
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

        const [result] = await pool.query(
            `INSERT INTO survey_schedules (program_id, label, interval_days, start_date, next_due_date)
             VALUES (?, ?, ?, ?, ?)`,
            [program_id, label, interval_days, sd, nextDue.toISOString().slice(0, 10)]
        );
        const [rows] = await pool.query('SELECT * FROM survey_schedules WHERE id = ?', [result.insertId]);
        return res.status(201).json({ success: true, schedule: rows[0] });
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
        const [result] = await pool.query(
            `UPDATE survey_schedules
             SET label = COALESCE(?, label),
                 interval_days = COALESCE(?, interval_days),
                 is_active = COALESCE(?, is_active),
                 next_due_date = COALESCE(?, next_due_date)
             WHERE id = ?`,
            [label, interval_days, is_active, next_due_date || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Schedule not found' });
        const [rows] = await pool.query('SELECT * FROM survey_schedules WHERE id = ?', [id]);
        return res.json({ success: true, schedule: rows[0] });
    } catch (err) {
        console.error('updateSchedule error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin: Delete a schedule ────────────────────────────────────────────────
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM survey_schedules WHERE id = ?', [id]);
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
        const [rows] = await pool.query(
            `SELECT si.*, ss.label as schedule_label, ss.interval_days,
                    prog.title as program_title,
                    GROUP_CONCAT(pr.title SEPARATOR ', ') as practice_names
             FROM survey_instances si
             JOIN survey_schedules ss ON ss.id = si.schedule_id
             JOIN pledges pl ON pl.id = si.pledge_id
             JOIN programs prog ON prog.id = pl.program_id
             LEFT JOIN pledge_practices pp ON pp.pledge_id = pl.id
             LEFT JOIN practices pr ON pr.id = pp.practice_id
             WHERE pl.user_id = ?
             GROUP BY si.id, ss.label, ss.interval_days, prog.title
             ORDER BY si.due_date DESC`,
            [userId]
        );
        return res.json({ success: true, instances: rows });
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
        const [instRows] = await pool.query(
            `SELECT si.*, ss.label as schedule_label, prog.title as program_title,
                    pl.user_id
             FROM survey_instances si
             JOIN survey_schedules ss ON ss.id = si.schedule_id
             JOIN pledges pl ON pl.id = si.pledge_id
             JOIN programs prog ON prog.id = pl.program_id
             WHERE si.id = ?`,
            [id]
        );
        if (instRows.length === 0) return res.status(404).json({ success: false, message: 'Survey not found' });
        const instance = instRows[0];
        if (instance.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get practices from this pledge
        const [practicesRows] = await pool.query(
            `SELECT pp.practice_id, pp.selected_action, pr.title, pr.type
             FROM pledge_practices pp
             JOIN practices pr ON pr.id = pp.practice_id
             WHERE pp.pledge_id = ?`,
            [instance.pledge_id]
        );

        // Get existing responses if any
        const [responsesRows] = await pool.query(
            `SELECT * FROM survey_instance_responses WHERE instance_id = ?`,
            [id]
        );

        return res.json({
            success: true,
            instance,
            practices: practicesRows,
            responses: responsesRows,
        });
    } catch (err) {
        console.error('getSurveyInstance error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Participant: Submit survey responses ────────────────────────────────────
const submitSurveyResponse = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { id } = req.params; // instance id
        const { responses } = req.body; // [{practice_id, action_taken_level, action_needed_next}]
        const userId = req.user.id;

        await conn.beginTransaction();

        // Verify ownership
        const [instRows] = await conn.query(
            `SELECT si.*, pl.user_id FROM survey_instances si
             JOIN pledges pl ON pl.id = si.pledge_id
             WHERE si.id = ?`,
            [id]
        );
        if (instRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
        const instance = instRows[0];
        if (instance.user_id !== userId && req.user.role !== 'admin') {
            await conn.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (instance.completed_at) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: 'Survey already completed' });
        }

        // Delete old responses (idempotent)
        await conn.query('DELETE FROM survey_instance_responses WHERE instance_id = ?', [id]);

        // Insert new responses
        for (const r of (responses || [])) {
            await conn.query(
                `INSERT INTO survey_instance_responses (instance_id, practice_id, action_taken_level, action_needed_next)
                 VALUES (?, ?, ?, ?)`,
                [id, r.practice_id, r.action_taken_level, r.action_needed_next || '']
            );
        }

        // Mark as completed
        await conn.query(
            `UPDATE survey_instances SET completed_at = NOW() WHERE id = ?`,
            [id]
        );

        await conn.commit();
        return res.json({ success: true, message: 'Survey submitted successfully.' });
    } catch (err) {
        await conn.rollback();
        console.error('submitSurveyResponse error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        conn.release();
    }
};

// ─── Admin: Get all instances (for admin summary view) ──────────────────────
const getAllInstances = async (req, res) => {
    try {
        const [rows] = await pool.query(
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
        return res.json({ success: true, instances: rows });
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
