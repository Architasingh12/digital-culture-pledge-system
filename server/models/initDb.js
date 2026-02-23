const pool = require('../config/db');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🏗️  Ensuring database tables exist...');

    // 1. users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          designation VARCHAR(255),
          photo_url TEXT,
          role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. otp_tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_tokens (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. programs
    await client.query(`
      CREATE TABLE IF NOT EXISTS programs (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          start_date DATE,
          end_date DATE,
          max_practices INTEGER DEFAULT 3,
          max_behaviours INTEGER DEFAULT 5,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add new columns to programs if they don't exist (safe migration)
    await client.query(`
      ALTER TABLE programs
        ADD COLUMN IF NOT EXISTS max_practices INTEGER DEFAULT 3,
        ADD COLUMN IF NOT EXISTS max_behaviours INTEGER DEFAULT 5;
    `);

    // 4. practices
    await client.query(`
      CREATE TABLE IF NOT EXISTS practices (
          id SERIAL PRIMARY KEY,
          program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
          type VARCHAR(50) CHECK (type IN ('weekly', 'monthly', 'quarterly', 'daily')),
          title VARCHAR(255) NOT NULL,
          actions JSONB,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. pledges
    await client.query(`
      CREATE TABLE IF NOT EXISTS pledges (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
          north_star TEXT,
          success_metric TEXT,
          timeline VARCHAR(255),
          personal_habit TEXT,
          habit_frequency VARCHAR(255),
          measure_success TEXT,
          submitted_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. pledge_practices
    await client.query(`
      CREATE TABLE IF NOT EXISTS pledge_practices (
          id SERIAL PRIMARY KEY,
          pledge_id INTEGER REFERENCES pledges(id) ON DELETE CASCADE,
          practice_id INTEGER REFERENCES practices(id) ON DELETE CASCADE,
          selected_action TEXT,
          UNIQUE(pledge_id, practice_id)
      );
    `);

    // 7. behaviours
    await client.query(`
      CREATE TABLE IF NOT EXISTS behaviours (
          id SERIAL PRIMARY KEY,
          pledge_id INTEGER REFERENCES pledges(id) ON DELETE CASCADE,
          behaviour_text TEXT NOT NULL,
          type VARCHAR(50) CHECK (type IN ('start', 'reduce', 'stop')),
          why_it_matters TEXT,
          first_action_date DATE,
          action_taken TEXT,
          action_needed_next TEXT
      );
    `);

    // 8. surveys
    await client.query(`
      CREATE TABLE IF NOT EXISTS surveys (
          id SERIAL PRIMARY KEY,
          pledge_id INTEGER REFERENCES pledges(id) ON DELETE CASCADE,
          survey_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 9. survey_responses
    await client.query(`
      CREATE TABLE IF NOT EXISTS survey_responses (
          id SERIAL PRIMARY KEY,
          survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
          practice_id INTEGER REFERENCES practices(id) ON DELETE CASCADE,
          action_taken_level VARCHAR(10) CHECK (action_taken_level IN ('H', 'M', 'L')),
          action_needed_next TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables ready');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
