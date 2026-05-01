const bcrypt = require('bcryptjs');
const db = require('../db');

const DEFAULT_PERMISSIONS = {
    view_dashboard:      true,
    manage_companies:    false,
    manage_employees:    true,
    generate_documents:  true,
    generate_all:        true,
    salary_increment:    true,
    bulk_payslips:       true,
    internship_cert:     true,
    view_documents:      true,
};

exports.list = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.company_id, u.is_active,
                    u.permissions, u.created_at, c.name AS company_name
             FROM users u
             LEFT JOIN companies c ON u.company_id = c.id
             ORDER BY u.id DESC`
        );
        rows.forEach(r => {
            r.permissions = r.permissions ? JSON.parse(r.permissions) : DEFAULT_PERMISSIONS;
        });
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.get = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.company_id, u.is_active,
                    u.permissions, u.created_at, c.name AS company_name
             FROM users u
             LEFT JOIN companies c ON u.company_id = c.id
             WHERE u.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        const user = rows[0];
        user.permissions = user.permissions ? JSON.parse(user.permissions) : DEFAULT_PERMISSIONS;
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, email, password, role = 'hr', company_id = null, permissions } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });

        const perms = { ...DEFAULT_PERMISSIONS, ...(permissions || {}) };
        if (role === 'super_admin') Object.keys(perms).forEach(k => (perms[k] = true));

        const hash = await bcrypt.hash(password, 10);
        const [r] = await db.query(
            'INSERT INTO users (name, email, password, role, company_id, permissions) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hash, role, company_id || null, JSON.stringify(perms)]
        );
        res.json({ id: r.insertId, name, email, role, permissions: perms });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
        res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, email, password, role, company_id, is_active, permissions } = req.body;
        const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!existing.length) return res.status(404).json({ error: 'User not found' });

        // Prevent changing your own role (safety lock)
        if (parseInt(req.params.id) === req.user.id && role && role !== existing[0].role) {
            return res.status(400).json({ error: 'Cannot change your own role' });
        }

        const curr = existing[0];
        const newPerms = permissions
            ? { ...DEFAULT_PERMISSIONS, ...permissions }
            : (curr.permissions ? JSON.parse(curr.permissions) : DEFAULT_PERMISSIONS);
        const newRole = role || curr.role;
        if (newRole === 'super_admin') Object.keys(newPerms).forEach(k => (newPerms[k] = true));

        let sql, params;
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            sql = `UPDATE users SET name=?, email=?, password=?, role=?, company_id=?, is_active=?, permissions=? WHERE id=?`;
            params = [name || curr.name, email || curr.email, hash, newRole,
                      company_id !== undefined ? company_id : curr.company_id,
                      is_active !== undefined ? is_active : curr.is_active,
                      JSON.stringify(newPerms), req.params.id];
        } else {
            sql = `UPDATE users SET name=?, email=?, role=?, company_id=?, is_active=?, permissions=? WHERE id=?`;
            params = [name || curr.name, email || curr.email, newRole,
                      company_id !== undefined ? company_id : curr.company_id,
                      is_active !== undefined ? is_active : curr.is_active,
                      JSON.stringify(newPerms), req.params.id];
        }

        await db.query(sql, params);
        res.json({ success: true, permissions: newPerms });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
        res.status(500).json({ error: e.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);

        // Prevent deleting yourself
        if (targetId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Prevent deleting the last super_admin
        const [target] = await db.query('SELECT role FROM users WHERE id = ?', [targetId]);
        if (!target.length) return res.status(404).json({ error: 'User not found' });

        if (target[0].role === 'super_admin') {
            const [cnt] = await db.query("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin'");
            if (cnt[0].c <= 1) {
                return res.status(400).json({ error: 'Cannot delete the only Super Admin account' });
            }
        }

        await db.query('DELETE FROM users WHERE id = ?', [targetId]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.stats = async (req, res) => {
    try {
        const [docStats] = await db.query(
            `SELECT u.id, u.name, u.role, COUNT(d.id) as doc_count,
                    MAX(d.created_at) as last_generated
             FROM users u
             LEFT JOIN documents d ON d.created_by = u.id
             GROUP BY u.id, u.name, u.role
             ORDER BY doc_count DESC`
        );
        res.json(docStats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
