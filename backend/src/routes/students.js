const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search students (public endpoint for sign-in page)
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const result = await pool.query(
      `SELECT id, name, class_category
       FROM students
       WHERE active = true AND name ILIKE $1
       ORDER BY name
       LIMIT 20`,
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Student search error:', error);
    res.status(500).json({ error: 'Server error during search' });
  }
});

// Get all students (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, active } = req.query;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND class_category = $${params.length}`;
    }

    if (active !== undefined) {
      params.push(active === 'true');
      query += ` AND active = $${params.length}`;
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error fetching students' });
  }
});

// Get single student (admin only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Server error fetching student' });
  }
});

// Create student (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, class_category } = req.body;

    if (!name || !class_category) {
      return res.status(400).json({ error: 'Name and class category required' });
    }

    const validCategories = ['Little Lions', 'Juniors', 'Youths', 'Adults'];
    if (!validCategories.includes(class_category)) {
      return res.status(400).json({ error: 'Invalid class category' });
    }

    const result = await pool.query(
      `INSERT INTO students (name, class_category)
       VALUES ($1, $2)
       RETURNING *`,
      [name, class_category]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Server error creating student' });
  }
});

// Update student (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class_category, active } = req.body;

    if (!name || !class_category) {
      return res.status(400).json({ error: 'Name and class category required' });
    }

    const validCategories = ['Little Lions', 'Juniors', 'Youths', 'Adults'];
    if (!validCategories.includes(class_category)) {
      return res.status(400).json({ error: 'Invalid class category' });
    }

    const result = await pool.query(
      `UPDATE students
       SET name = $1, class_category = $2, active = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, class_category, active !== undefined ? active : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Server error updating student' });
  }
});

// Delete student (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE students SET active = false WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Server error deleting student' });
  }
});

module.exports = router;
