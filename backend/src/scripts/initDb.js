const pool = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initializeDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting database initialization...');

    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        registration_number VARCHAR(100) UNIQUE,
        class_category VARCHAR(50) NOT NULL CHECK (class_category IN ('Little Lions', 'Juniors', 'Youths', 'Adults')),
        monthly_lessons INTEGER DEFAULT 8,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Students table created or already exists');

    // Add new columns if they don't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='students' AND column_name='registration_number') THEN
          ALTER TABLE students ADD COLUMN registration_number VARCHAR(100) UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='students' AND column_name='monthly_lessons') THEN
          ALTER TABLE students ADD COLUMN monthly_lessons INTEGER DEFAULT 8;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='students' AND column_name='date_of_birth') THEN
          ALTER TABLE students ADD COLUMN date_of_birth DATE;
        END IF;
      END $$;
    `);
    console.log('Ensured registration_number, monthly_lessons, and date_of_birth columns exist');

    // Create index on name for faster searching
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
    `);

    // Create index on active status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);
    `);

    // Create index on registration_number
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students(registration_number);
    `);

    // Create index on date_of_birth for age range queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_dob ON students(date_of_birth);
    `);

    // Create attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, attendance_date)
      )
    `);
    console.log('Attendance table created or already exists');

    // Create index on attendance_date for faster reporting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
    `);

    // Create index on student_id for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
    `);

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Admin users table created or already exists');

    // Create default admin user if not exists
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await client.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [adminUsername]
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        [adminUsername, hashedPassword]
      );
      console.log(`Default admin user created: ${adminUsername}`);
      console.log(`Default password: ${adminPassword}`);
      console.log('IMPORTANT: Change the admin password after first login!');
    } else {
      console.log('Admin user already exists');
    }

    // Add some sample students for testing
    const sampleStudents = [
      { name: 'John Smith', category: 'Adults', regNum: 'REG001', lessons: 8, dob: '1990-05-15' },
      { name: 'Sarah Johnson', category: 'Youths', regNum: 'REG002', lessons: 12, dob: '2011-08-22' },
      { name: 'Michael Chen', category: 'Juniors', regNum: 'REG003', lessons: 8, dob: '2014-03-10' },
      { name: 'Emma Williams', category: 'Little Lions', regNum: 'REG004', lessons: 4, dob: '2018-11-30' },
      { name: 'David Brown', category: 'Adults', regNum: 'REG005', lessons: 8, dob: '1985-02-28' },
      { name: 'Olivia Davis', category: 'Juniors', regNum: 'REG006', lessons: 12, dob: '2013-07-14' },
    ];

    for (const student of sampleStudents) {
      const existing = await client.query(
        'SELECT * FROM students WHERE name = $1',
        [student.name]
      );

      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO students (name, class_category, registration_number, monthly_lessons, date_of_birth) VALUES ($1, $2, $3, $4, $5)',
          [student.name, student.category, student.regNum, student.lessons, student.dob]
        );
      }
    }
    console.log('Sample students added (if not already present)');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
