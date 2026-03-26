require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const pool = require('./config/db');
const cookieParser = require('cookie-parser');
const { createTables } = require('./models/initDb');
const { startCronJobs } = require('./utils/cronJobs');
const authRoutes = require('./routes/authRoutes');
const pledgeRoutes = require('./routes/pledgeRoutes');
const programRoutes = require('./routes/programRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const companyAdminRoutes = require('./routes/companyAdminRoutes');
const surveyRoutes = require('./routes/surveyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company-admin', companyAdminRoutes);
app.use('/api/surveys', surveyRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ success: true, status: 'OK', db: 'connected', timestamp: new Date().toISOString() });
    } catch {
        res.status(500).json({ success: false, status: 'ERROR', db: 'disconnected' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
    try {
        // Test DB connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection verified');

        // Initialize tables
        await createTables();

        // Start cron jobs
        startCronJobs();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

start();
