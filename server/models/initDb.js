const pool = require('../config/db');

const createTables = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('🏗️  Ensuring database tables exist...');

    // 1. users
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          designation VARCHAR(255),
          photo_url TEXT,
          password VARCHAR(255),
          role VARCHAR(50) DEFAULT 'participant',
          created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Safe migration: add password column if it doesn't exist
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`);
    } catch (e) { /* column may already exist */ }

    // Safe migration: ensure role column is wide enough and drop/re-add CHECK
    try {
      await conn.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'participant'`);
    } catch (e) { /* ignore */ }
    try {
      await conn.query(`ALTER TABLE users DROP CHECK users_role_check`);
    } catch (e) { /* constraint may not exist */ }
    try {
      await conn.query(`
        ALTER TABLE users ADD CONSTRAINT users_role_check
          CHECK (role IN ('participant', 'admin', 'super_admin', 'company_admin'))
      `);
    } catch (e) { /* ignore if already exists */ }

    // 2. otp_tokens
    await conn.query(`
      CREATE TABLE IF NOT EXISTS otp_tokens (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 3. programs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS programs (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          start_date DATE,
          end_date DATE,
          max_practices INT DEFAULT 3,
          max_behaviours INT DEFAULT 5,
          created_by INT,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Safe migration: add new columns to programs if they don't exist
    try {
      await conn.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS max_practices INT DEFAULT 3`);
    } catch (e) { /* ignore */ }
    try {
      await conn.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS max_behaviours INT DEFAULT 5`);
    } catch (e) { /* ignore */ }
    try {
      await conn.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS company_id INT`);
    } catch (e) { /* ignore */ }
    try {
      await conn.query(`ALTER TABLE programs ADD CONSTRAINT fk_programs_company FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE SET NULL`);
    } catch (e) { /* ignore — FK may already exist */ }

    // 4. practices
    await conn.query(`
      CREATE TABLE IF NOT EXISTS practices (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          program_id INT,
          type VARCHAR(50),
          title VARCHAR(255) NOT NULL,
          actions JSON,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
      )
    `);

    // 5. pledges
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pledges (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          program_id INT,
          problem_statement TEXT,
          north_star TEXT,
          success_metric TEXT,
          timeline VARCHAR(255),
          personal_habit TEXT,
          habit_frequency VARCHAR(255),
          measure_success TEXT,
          review_dates TEXT,
          signature_name VARCHAR(255),
          signoff_designation VARCHAR(255),
          user_photo TEXT,
          digital_signature TEXT,
          submission_date DATE,
          submitted_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
      )
    `);

    // Safe migrations for pledge columns
    const pledgeCols = [
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS problem_statement TEXT`,
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS review_dates TEXT`,
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS signature_name VARCHAR(255)`,
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS signoff_designation VARCHAR(255)`,
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS user_photo TEXT`,
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS digital_signature TEXT`,
      `ALTER TABLE pledges ADD COLUMN IF NOT EXISTS submission_date DATE`,
    ];
    for (const sql of pledgeCols) {
      try { await conn.query(sql); } catch (e) { /* already exists */ }
    }

    // 6. pledge_practices
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pledge_practices (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          pledge_id INT,
          practice_id INT,
          selected_action TEXT,
          UNIQUE KEY unique_pledge_practice (pledge_id, practice_id),
          FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE,
          FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE
      )
    `);

    // 7. behaviours
    await conn.query(`
      CREATE TABLE IF NOT EXISTS behaviours (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          pledge_id INT,
          behaviour_text TEXT NOT NULL,
          type VARCHAR(50),
          why_it_matters TEXT,
          first_action_date DATE,
          action_taken TEXT,
          action_needed_next TEXT,
          FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
      )
    `);

    // 8. surveys
    await conn.query(`
      CREATE TABLE IF NOT EXISTS surveys (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          pledge_id INT,
          survey_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
      )
    `);

    // 9. survey_responses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS survey_responses (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          survey_id INT,
          practice_id INT,
          action_taken_level VARCHAR(10),
          action_needed_next TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
          FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE
      )
    `);

    // 10. survey_schedules
    await conn.query(`
      CREATE TABLE IF NOT EXISTS survey_schedules (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          program_id INT,
          label VARCHAR(255) NOT NULL,
          interval_days INT NOT NULL DEFAULT 30,
          start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
          next_due_date DATE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
      )
    `);

    // 11. survey_instances
    await conn.query(`
      CREATE TABLE IF NOT EXISTS survey_instances (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          schedule_id INT,
          pledge_id INT,
          due_date DATE NOT NULL,
          completed_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (schedule_id) REFERENCES survey_schedules(id) ON DELETE CASCADE,
          FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
      )
    `);

    // 12. survey_instance_responses
    await conn.query(`
      CREATE TABLE IF NOT EXISTS survey_instance_responses (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          instance_id INT,
          practice_id INT,
          action_taken_level VARCHAR(10),
          action_needed_next TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (instance_id) REFERENCES survey_instances(id) ON DELETE CASCADE,
          FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE CASCADE
      )
    `);

    // Safe migration for survey_schedules
    try {
      await conn.query(`ALTER TABLE survey_schedules ADD COLUMN IF NOT EXISTS next_due_date DATE`);
    } catch (e) { /* ignore */ }

    await conn.commit();
    console.log('✅ Database tables ready');
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error initializing database tables:', error.message);
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = { createTables };
