const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate age from date of birth
const calculateAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper function to get testing age range
const getTestingAgeRange = (age) => {
  if (age === null) return null;
  if (age <= 8) return '8 and below';
  if (age >= 9 && age <= 12) return '9-12 years';
  if (age >= 13 && age <= 17) return '13-17 years';
  return '18 and above';
};

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
       WHERE active = true AND (name ILIKE $1 OR registration_number ILIKE $1)
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

    query += ' ORDER BY class_category, name';

    const result = await pool.query(query, params);
    
    // Add calculated age and testing age range to each student
    const studentsWithAge = result.rows.map(student => {
      const age = calculateAge(student.date_of_birth);
      return {
        ...student,
        age,
        testing_age_range: getTestingAgeRange(age)
      };
    });
    
    res.json(studentsWithAge);
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

    const student = result.rows[0];
    const age = calculateAge(student.date_of_birth);
    
    res.json({
      ...student,
      age,
      testing_age_range: getTestingAgeRange(age)
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Server error fetching student' });
  }
});

// Create student (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, class_category, registration_number, monthly_lessons, date_of_birth } = req.body;

    if (!name || !class_category) {
      return res.status(400).json({ error: 'Name and class category required' });
    }

    const validCategories = ['Little Lions', 'Juniors', 'Youths', 'Adults'];
    if (!validCategories.includes(class_category)) {
      return res.status(400).json({ error: 'Invalid class category' });
    }

    // Check if registration_number already exists
    if (registration_number) {
      const existing = await pool.query(
        'SELECT * FROM students WHERE registration_number = $1',
        [registration_number]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Registration number already exists' });
      }
    }

    const result = await pool.query(
      `INSERT INTO students (name, class_category, registration_number, monthly_lessons, date_of_birth)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, class_category, registration_number || null, monthly_lessons || 8, date_of_birth || null]
    );

    const student = result.rows[0];
    const age = calculateAge(student.date_of_birth);

    res.status(201).json({
      ...student,
      age,
      testing_age_range: getTestingAgeRange(age)
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Registration number already exists' });
    }
    res.status(500).json({ error: 'Server error creating student' });
  }
});

// Update student (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class_category, registration_number, monthly_lessons, date_of_birth, active } = req.body;

    if (!name || !class_category) {
      return res.status(400).json({ error: 'Name and class category required' });
    }

    const validCategories = ['Little Lions', 'Juniors', 'Youths', 'Adults'];
    if (!validCategories.includes(class_category)) {
      return res.status(400).json({ error: 'Invalid class category' });
    }

    // Check if registration_number already exists for a different student
    if (registration_number) {
      const existing = await pool.query(
        'SELECT * FROM students WHERE registration_number = $1 AND id != $2',
        [registration_number, id]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Registration number already exists' });
      }
    }

    const result = await pool.query(
      `UPDATE students
       SET name = $1, class_category = $2, registration_number = $3, 
           monthly_lessons = $4, date_of_birth = $5, active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        name, 
        class_category, 
        registration_number || null, 
        monthly_lessons || 8,
        date_of_birth || null,
        active !== undefined ? active : true, 
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = result.rows[0];
    const age = calculateAge(student.date_of_birth);

    res.json({
      ...student,
      age,
      testing_age_range: getTestingAgeRange(age)
    });
  } catch (error) {
    console.error('Update student error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Registration number already exists' });
    }
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
