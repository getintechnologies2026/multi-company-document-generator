require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/auth.routes');
const companyRoutes = require('./src/routes/company.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const documentRoutes = require('./src/routes/document.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const salaryRoutes    = require('./src/routes/salary.routes');
const userRoutes      = require('./src/routes/user.routes');

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (same-origin, mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// ── In-memory rate limiter for /api/auth/login ────────────────────────────────
const loginAttempts = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_MAX       = 20;              // max attempts per window

app.use('/api/auth/login', (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let rec = loginAttempts.get(ip);
    if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rec.count++;
    loginAttempts.set(ip, rec);
    if (rec.count > RATE_MAX) {
        const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
    next();
});
// Clean up stale entries every hour
setInterval(() => {
    const now = Date.now();
    loginAttempts.forEach((v, k) => { if (now > v.resetAt) loginAttempts.delete(k); });
}, 60 * 60 * 1000);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/salary',   salaryRoutes);
app.use('/api/users',    userRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Doc Software API is running', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
