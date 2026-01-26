const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Log attendance (public endpoint for student sign-in)
router.post('/', async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student ID required' });
    }

    // Check if student exists and is active
    const studentResult = await pool.query(
      'SELECT * FROM students WHERE id = $1 AND active = true',
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found or inactive' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Try to insert attendance record
    try {
      const result = await pool.query(
        `INSERT INTO attendance (student_id, attendance_date)
         VALUES ($1, $2)
         RETURNING *`,
        [student_id, today]
      );

      res.status(201).json({
        message: 'Attendance logged successfully',
        attendance: result.rows[0],
        student: studentResult.rows[0],
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Attendance already logged for today',
          student: studentResult.rows[0],
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Log attendance error:', error);
    res.status(500).json({ error: 'Server error logging attendance' });
  }
});

// Get attendance records (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, start_date, end_date, month, year } = req.query;

    let query = `
      SELECT a.*, s.name, s.class_category
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      params.push(student_id);
      query += ` AND a.student_id = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND a.attendance_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND a.attendance_date <= $${params.length}`;
    }

    if (month && year) {
      params.push(year, month);
      query += ` AND EXTRACT(YEAR FROM a.attendance_date) = $${params.length - 1}
                 AND EXTRACT(MONTH FROM a.attendance_date) = $${params.length}`;
    }

    query += ' ORDER BY a.attendance_date DESC, s.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Server error fetching attendance' });
  }
});

// Get attendance report by student (admin only)
router.get('/report/by-student', authenticateToken, async (req, res) => {
  try {
    const { month, year, category } = req.query;

    let query = `
      SELECT
        s.id,
        s.name,
        s.registration_number,
        s.class_category,
        s.monthly_lessons,
        COUNT(a.id) as total_classes
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.active = true
    `;
    const params = [];

    if (month && year) {
      params.push(year, month);
      query += ` AND (a.id IS NULL OR
                 (EXTRACT(YEAR FROM a.attendance_date) = $${params.length - 1}
                  AND EXTRACT(MONTH FROM a.attendance_date) = $${params.length}))`;
    }

    if (category) {
      params.push(category);
      query += ` AND s.class_category = $${params.length}`;
    }

    query += `
      GROUP BY s.id, s.name, s.registration_number, s.class_category, s.monthly_lessons
      ORDER BY s.class_category, s.name
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ error: 'Server error generating report' });
  }
});

// Get attendance statistics (admin only)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    let dateFilter = '';
    const params = [];

    if (month && year) {
      params.push(year, month);
      dateFilter = `WHERE EXTRACT(YEAR FROM attendance_date) = $1
                    AND EXTRACT(MONTH FROM attendance_date) = $2`;
    }

    const result = await pool.query(`
      SELECT
        s.class_category,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(a.id) as total_attendances,
        ROUND(AVG(student_attendance.attendance_count), 2) as avg_classes_per_student
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id ${month && year ? 'AND EXTRACT(YEAR FROM a.attendance_date) = $1 AND EXTRACT(MONTH FROM a.attendance_date) = $2' : ''}
      LEFT JOIN (
        SELECT student_id, COUNT(*) as attendance_count
        FROM attendance
        ${dateFilter}
        GROUP BY student_id
      ) student_attendance ON s.id = student_attendance.student_id
      WHERE s.active = true
      GROUP BY s.class_category
      ORDER BY s.class_category
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Server error generating statistics' });
  }
});

// Get over-attendance report (students exceeding monthly lesson allocation)
router.get('/report/over-attendance', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.registration_number,
        s.class_category,
        s.monthly_lessons,
        COUNT(a.id) as total_attended,
        (COUNT(a.id) - s.monthly_lessons) as over_by
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
        AND EXTRACT(YEAR FROM a.attendance_date) = $1
        AND EXTRACT(MONTH FROM a.attendance_date) = $2
      WHERE s.active = true
      GROUP BY s.id, s.name, s.registration_number, s.class_category, s.monthly_lessons
      HAVING COUNT(a.id) > s.monthly_lessons
      ORDER BY s.class_category, over_by DESC, s.name
    `, [year, month]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get over-attendance report error:', error);
    res.status(500).json({ error: 'Server error generating over-attendance report' });
  }
});

// Delete attendance record (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM attendance WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Server error deleting attendance' });
  }
});

module.exports = router;

// Get age range transitions report (students changing age brackets)
router.get('/report/age-transitions', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Get all active students with DOB
    const students = await pool.query(`
      SELECT id, name, registration_number, class_category, date_of_birth
      FROM students
      WHERE active = true AND date_of_birth IS NOT NULL
      ORDER BY date_of_birth
    `);

    const transitions = [];
    
    students.rows.forEach(student => {
      const dob = new Date(student.date_of_birth);
      const targetDate = new Date(year, month - 1, 1); // Start of the target month
      const endOfMonth = new Date(year, month, 0); // Last day of the target month
      
      // Calculate age at start and end of the target month
      const ageAtStart = targetDate.getFullYear() - dob.getFullYear();
      const ageAtEnd = endOfMonth.getFullYear() - dob.getFullYear();
      
      // Check if birthday is in this month
      const birthdayThisMonth = dob.getMonth() + 1 === parseInt(month);
      
      if (birthdayThisMonth) {
        // Determine testing age ranges
        const getRange = (age) => {
          if (age <= 8) return '8 and below';
          if (age >= 9 && age <= 12) return '9-12 years';
          if (age >= 13 && age <= 17) return '13-17 years';
          return '18 and above';
        };
        
        const rangeBeforeBirthday = getRange(ageAtStart);
        const rangeAfterBirthday = getRange(ageAtEnd);
        
        // Check if they're transitioning to a new range (turning 9, 13, or 18)
        const turningAge = ageAtEnd;
        if (turningAge === 9 || turningAge === 13 || turningAge === 18) {
          transitions.push({
            id: student.id,
            name: student.name,
            registration_number: student.registration_number,
            class_category: student.class_category,
            date_of_birth: student.date_of_birth,
            birthday_date: new Date(year, month - 1, dob.getDate()),
            turning_age: turningAge,
            current_age_range: rangeBeforeBirthday,
            new_age_range: rangeAfterBirthday
          });
        }
      }
    });

    res.json(transitions);
  } catch (error) {
    console.error('Get age transitions report error:', error);
    res.status(500).json({ error: 'Server error generating age transitions report' });
  }
});
