const cron = require('node-cron');
const pool = require('../config/db');
const { sendReminderEmail } = require('./emailUtil');

const startCronJobs = () => {
    // Runs every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ [CRON] Running daily pledge reminder job...');

        try {
            // Get users with pending pledges
            const result = await pool.query(`
        SELECT u.id, u.name, u.email, COUNT(p.id) AS pending_count
        FROM users u
        INNER JOIN pledges p ON p.user_id = u.id
        WHERE p.status = 'pending'
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(p.id) > 0
      `);

            console.log(`[CRON] Found ${result.rows.length} users with pending pledges`);

            for (const user of result.rows) {
                try {
                    await sendReminderEmail(user.email, user.name, parseInt(user.pending_count));
                    console.log(`[CRON] ✉️  Reminder sent to ${user.email}`);
                } catch (emailError) {
                    console.error(`[CRON] Failed to send reminder to ${user.email}:`, emailError.message);
                }
            }
        } catch (error) {
            console.error('[CRON] Error running reminder job:', error.message);
        }
    });

    // Clean expired OTP tokens every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const result = await pool.query(
                "DELETE FROM otp_tokens WHERE expires_at < NOW() OR used = true"
            );
            if (result.rowCount > 0) {
                console.log(`[CRON] 🧹 Cleaned ${result.rowCount} expired OTP tokens`);
            }
        } catch (error) {
            console.error('[CRON] Error cleaning OTP tokens:', error.message);
        }
    });

    console.log('✅ Cron jobs started');
};

module.exports = { startCronJobs };
