const pool = require('../config/db');

// POST /api/programs (Super Admin only)
const createProgram = async (req, res) => {
    const { title, description, start_date, company_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!company_id) return res.status(400).json({ success: false, message: 'Company is required' });

    try {
        const [result] = await pool.query(
            `INSERT INTO programs (title, description, start_date, company_id, created_by) VALUES (?, ?, ?, ?, ?)`,
            [title, description, start_date || null, company_id, req.user.id]
        );
        const [rows] = await pool.query('SELECT * FROM programs WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, program: rows[0] });
    } catch (error) {
        console.error('createProgram error', error);
        res.status(500).json({ success: false, message: 'Error creating program' });
    }
};

// GET /api/programs
const getPrograms = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, u.name AS company_name
            FROM programs p
            LEFT JOIN users u ON u.id = p.company_id
            ORDER BY p.created_at DESC
        `);
        res.status(200).json({ success: true, programs: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching programs' });
    }
};

// GET /api/programs/:id
const getProgramById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM programs WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
        res.status(200).json({ success: true, program: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching program' });
    }
};

// PUT /api/programs/:id (Super Admin only)
const updateProgram = async (req, res) => {
    const { id } = req.params;
    const { title, description, start_date, company_id } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE programs SET title=?, description=?, start_date=?, company_id=? WHERE id=?`,
            [title, description, start_date, company_id || null, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Program not found' });
        const [rows] = await pool.query('SELECT * FROM programs WHERE id = ?', [id]);
        res.status(200).json({ success: true, program: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating program' });
    }
};

// DELETE /api/programs/:id (Admin only)
const deleteProgram = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM programs WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Program not found' });
        res.status(200).json({ success: true, message: 'Program deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting program' });
    }
};

module.exports = { createProgram, getPrograms, getProgramById, updateProgram, deleteProgram };
