const pool = require('../config/database');
require('dotenv').config();

const addStudentFields = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting database migration: Adding registration_number and monthly_lessons...');

    // Add registration_number column
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100) UNIQUE
    `);
    console.log('Added registration_number column');

    // Add monthly_lessons column
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS monthly_lessons INTEGER DEFAULT 8
    `);
    console.log('Added monthly_lessons column');

    // Create index on registration_number for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students(registration_number);
    `);
    console.log('Added index on registration_number');

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addStudentFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to migrate database:', error);
    process.exit(1);
  });
