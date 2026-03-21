const pool = require('../config/db');

// POST /api/practices (Admin only)
const createPractice = async (req, res) => {
    const { program_id, type, title, actions } = req.body;

    if (!program_id || !title || !type) {
        return res.status(400).json({ success: false, message: 'program_id, type, and title required' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO practices (program_id, type, title, actions) VALUES (?, ?, ?, ?)`,
            [program_id, type, title, JSON.stringify(actions || [])]
        );
        const [rows] = await pool.query('SELECT * FROM practices WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, practice: rows[0] });
    } catch (error) {
        console.error('createPractice error', error);
        res.status(500).json({ success: false, message: 'Error creating practice' });
    }
};

// GET /api/practices/program/:program_id
const getPracticesByProgram = async (req, res) => {
    const { program_id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM practices WHERE program_id = ? ORDER BY id ASC', [program_id]);
        res.status(200).json({ success: true, practices: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching practices' });
    }
};

// PUT /api/practices/:id (Admin only)
const updatePractice = async (req, res) => {
    const { id } = req.params;
    const { type, title, actions } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE practices SET type=?, title=?, actions=? WHERE id=?`,
            [type, title, JSON.stringify(actions || []), id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Practice not found' });
        const [rows] = await pool.query('SELECT * FROM practices WHERE id = ?', [id]);
        res.status(200).json({ success: true, practice: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating practice' });
    }
};

// DELETE /api/practices/:id (Admin only)
const deletePractice = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM practices WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Practice not found' });
        res.status(200).json({ success: true, message: 'Practice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting practice' });
    }
};

module.exports = { createPractice, getPracticesByProgram, updatePractice, deletePractice };
