const cron = require('node-cron');
const pool = require('../config/db');
const { sendReminderEmail, sendSurveyEmail } = require('./emailUtil');

const startCronJobs = () => {

    // ── 1. Daily survey dispatch job (runs at 8:05 AM each day) ──────────────
    cron.schedule('5 8 * * *', async () => {
        console.log('📊 [CRON] Running survey dispatch job...');
        try {
            const today = new Date().toISOString().slice(0, 10);

            // Find all active schedules that are due today or overdue
            const [schedules] = await pool.query(
                `SELECT * FROM survey_schedules WHERE is_active = true AND next_due_date <= ?`,
                [today]
            );
            console.log(`[CRON] ${schedules.length} survey schedule(s) due`);

            for (const schedule of schedules) {
                // Find all pledges for this program
                const [pledges] = await pool.query(
                    `SELECT pl.id as pledge_id, u.id as user_id, u.name, u.email
                     FROM pledges pl
                     JOIN users u ON u.id = pl.user_id
                     WHERE pl.program_id = ?`,
                    [schedule.program_id]
                );

                for (const pledge of pledges) {
                    try {
                        // Create a survey instance for this pledge
                        const [inst] = await pool.query(
                            `INSERT INTO survey_instances (schedule_id, pledge_id, due_date) VALUES (?, ?, ?)`,
                            [schedule.id, pledge.pledge_id, today]
                        );
                        const instanceId = inst.insertId;

                        // Send email notification
                        const surveyUrl = (process.env.CLIENT_URL || 'http://localhost:5173') + '/survey/' + instanceId;
                        await sendSurveyEmail(pledge.email, pledge.name, surveyUrl, schedule.label);
                        console.log(`[CRON] 📧 Survey email sent to ${pledge.email} (instance #${instanceId})`);
                    } catch (emailErr) {
                        console.error(`[CRON] Failed to create/email survey for pledge ${pledge.pledge_id}:`, emailErr.message);
                    }
                }

                // Advance next_due_date by interval_days
                const nextDue = new Date(schedule.next_due_date);
                nextDue.setDate(nextDue.getDate() + schedule.interval_days);
                await pool.query(
                    `UPDATE survey_schedules SET next_due_date = ? WHERE id = ?`,
                    [nextDue.toISOString().slice(0, 10), schedule.id]
                );
                console.log(`[CRON] ✅ Schedule #${schedule.id} next due: ${nextDue.toISOString().slice(0, 10)}`);
            }
        } catch (error) {
            console.error('[CRON] Survey dispatch error:', error.message);
        }
    });

    // ── 2. Daily pledge reminder job (runs at 8:00 AM) ───────────────────────
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ [CRON] Running daily pledge reminder job...');
        try {
            const [rows] = await pool.query(`
                SELECT u.id, u.name, u.email, COUNT(p.id) AS pending_count
                FROM users u
                INNER JOIN pledges p ON p.user_id = u.id
                WHERE p.status = 'pending'
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(p.id) > 0
            `);
            console.log(`[CRON] Found ${rows.length} users with pending pledges`);
            for (const user of rows) {
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

    // ── 3. Clean expired OTP tokens every hour ───────────────────────────────
    cron.schedule('0 * * * *', async () => {
        try {
            const [result] = await pool.query(
                "DELETE FROM otp_tokens WHERE expires_at < NOW() OR used = true"
            );
            if (result.affectedRows > 0) {
                console.log(`[CRON] 🧹 Cleaned ${result.affectedRows} expired OTP tokens`);
            }
        } catch (error) {
            console.error('[CRON] Error cleaning OTP tokens:', error.message);
        }
    });

    console.log('✅ Cron jobs started');
};

module.exports = { startCronJobs };