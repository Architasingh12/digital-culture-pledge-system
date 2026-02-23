const pool = require('../config/db');

// POST /api/practices (Admin only)
const createPractice = async (req, res) => {
    const { program_id, type, title, actions } = req.body;

    if (!program_id || !title || !type) {
        return res.status(400).json({ success: false, message: 'program_id, type, and title required' });
    }

    try {
        // Expected actions format: ["Action 1", "Action 2", ...] -> stored as JSON array
        const result = await pool.query(
            `INSERT INTO practices (program_id, type, title, actions) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [program_id, type, title, JSON.stringify(actions || [])]
        );
        res.status(201).json({ success: true, practice: result.rows[0] });
    } catch (error) {
        console.error('createPractice error', error);
        res.status(500).json({ success: false, message: 'Error creating practice' });
    }
};

// GET /api/practices/program/:program_id
const getPracticesByProgram = async (req, res) => {
    const { program_id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM practices WHERE program_id = $1 ORDER BY id ASC', [program_id]);
        res.status(200).json({ success: true, practices: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching practices' });
    }
};

// PUT /api/practices/:id (Admin only)
const updatePractice = async (req, res) => {
    const { id } = req.params;
    const { type, title, actions } = req.body;

    try {
        const result = await pool.query(
            `UPDATE practices SET type=$1, title=$2, actions=$3 
       WHERE id=$4 RETURNING *`,
            [type, title, JSON.stringify(actions || []), id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Practice not found' });
        res.status(200).json({ success: true, practice: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating practice' });
    }
};

// DELETE /api/practices/:id (Admin only)
const deletePractice = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM practices WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Practice not found' });
        res.status(200).json({ success: true, message: 'Practice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting practice' });
    }
};

module.exports = { createPractice, getPracticesByProgram, updatePractice, deletePractice };
