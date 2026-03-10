const pool = require('./config/db');

(async () => {
    try {
        console.log('Seeding survey instances...');
        const pledges = await pool.query('SELECT id as pledge_id, program_id, user_id FROM pledges');
        
        if (pledges.rows.length === 0) {
            console.log('No pledges found');
            process.exit(0);
        }

        for (const pledge of pledges.rows) {
            console.log(`Processing pledge_id: ${pledge.pledge_id}`);
            
            // Check if there's a schedule for this program
            let scheduleRes = await pool.query('SELECT id FROM survey_schedules WHERE program_id = $1 LIMIT 1', [pledge.program_id]);
            let schedId;
            if (scheduleRes.rows.length === 0) {
                console.log(`Creating schedule for program_id: ${pledge.program_id}`);
                const isrt = await pool.query(
                    'INSERT INTO survey_schedules (program_id, label, interval_days, start_date, next_due_date) VALUES ($1, $2, $3, $4, $5) RETURNING id', 
                    [pledge.program_id, 'Monthly Check-in', 30, '2026-03-01', '2026-04-01']
                );
                schedId = isrt.rows[0].id;
            } else {
                schedId = scheduleRes.rows[0].id;
            }

            // Clean up existing instances for this pledge to avoid duplicates
            await pool.query('DELETE FROM survey_instances WHERE pledge_id = $1', [pledge.pledge_id]);

            // Add 1 Completed Instance
            await pool.query(
                `INSERT INTO survey_instances (schedule_id, pledge_id, due_date, completed_at) VALUES ($1, $2, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days')`, 
                [schedId, pledge.pledge_id]
            );
            
            // Add 1 Pending Instance Due soon
            await pool.query(
                `INSERT INTO survey_instances (schedule_id, pledge_id, due_date) VALUES ($1, $2, NOW() + INTERVAL '10 days')`, 
                [schedId, pledge.pledge_id]
            );
            
            // Add 1 Pending Instance Due later
            await pool.query(
                `INSERT INTO survey_instances (schedule_id, pledge_id, due_date) VALUES ($1, $2, NOW() + INTERVAL '40 days')`, 
                [schedId, pledge.pledge_id]
            );
        }

        console.log('Seeding done successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
})();
