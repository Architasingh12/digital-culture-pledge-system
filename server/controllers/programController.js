const pool = require('../config/db');

// POST /api/programs (Admin only)
const createProgram = async (req, res) => {
    const { title, description, start_date, end_date } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    try {
        const result = await pool.query(
            `INSERT INTO programs (title, description, start_date, end_date, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, description, start_date || null, end_date || null, req.user.id]
        );
        res.status(201).json({ success: true, program: result.rows[0] });
    } catch (error) {
        console.error('createProgram error', error);
        res.status(500).json({ success: false, message: 'Error creating program' });
    }
};

// GET /api/programs
const getPrograms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM programs ORDER BY created_at DESC');
        res.status(200).json({ success: true, programs: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching programs' });
    }
};

// GET /api/programs/:id
const getProgramById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
        res.status(200).json({ success: true, program: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching program' });
    }
};

// PUT /api/programs/:id (Admin only)
const updateProgram = async (req, res) => {
    const { id } = req.params;
    const { title, description, start_date, end_date } = req.body;

    try {
        const result = await pool.query(
            `UPDATE programs SET title=$1, description=$2, start_date=$3, end_date=$4 
       WHERE id=$5 RETURNING *`,
            [title, description, start_date, end_date, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
        res.status(200).json({ success: true, program: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating program' });
    }
};

// DELETE /api/programs/:id (Admin only)  
const deleteProgram = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM programs WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
        res.status(200).json({ success: true, message: 'Program deleted' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting program' });
    }
};

module.exports = { createProgram, getPrograms, getProgramById, updateProgram, deleteProgram };


