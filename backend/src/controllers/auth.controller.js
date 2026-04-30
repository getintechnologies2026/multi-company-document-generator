const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role = 'hr', company_id = null } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

        const hash = await bcrypt.hash(password, 10);
        const [r] = await db.query(
            'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, role, company_id]
        );
        res.json({ id: r.insertId, name, email, role });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, company_id: user.company_id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.me = async (req, res) => {
    const [rows] = await db.query('SELECT id, name, email, role, company_id FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0] || null);
};
