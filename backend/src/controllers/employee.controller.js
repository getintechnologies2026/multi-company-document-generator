const db = require('../db');

const FIELDS = ['company_id', 'emp_code', 'full_name', 'father_name', 'dob', 'gender', 'email', 'phone',
    'address', 'blood_group', 'nationality', 'marital_status', 'emergency_contact_name', 'emergency_contact_phone',
    'designation', 'department', 'date_of_joining', 'date_of_leaving', 'employment_type',
    'reporting_manager', 'location', 'notice_period_days',
    'ctc', 'basic', 'hra', 'da', 'conveyance', 'medical', 'special_allowance',
    'pf', 'esi', 'professional_tax', 'tds',
    'bank_name', 'bank_account', 'ifsc_code', 'pan', 'aadhaar', 'uan', 'pf_no', 'status'];

exports.list = async (req, res) => {
    const { company_id, search } = req.query;
    let sql = 'SELECT e.*, c.name as company_name FROM employees e LEFT JOIN companies c ON e.company_id = c.id WHERE 1=1';
    const params = [];
    if (company_id) { sql += ' AND e.company_id = ?'; params.push(company_id); }
    if (search) {
        sql += ' AND (e.full_name LIKE ? OR e.emp_code LIKE ? OR e.email LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
    }
    sql += ' ORDER BY e.id DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
};

exports.get = async (req, res) => {
    const [rows] = await db.query('SELECT e.*, c.name as company_name FROM employees e LEFT JOIN companies c ON e.company_id = c.id WHERE e.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
};

exports.create = async (req, res) => {
    try {
        const data = req.body;
        const cols = FIELDS.join(', ');
        const placeholders = FIELDS.map(() => '?').join(', ');
        const values = FIELDS.map(k => data[k] === '' ? null : (data[k] ?? null));
        const [r] = await db.query(`INSERT INTO employees (${cols}) VALUES (${placeholders})`, values);
        res.json({ id: r.insertId, ...data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = req.body;
        const entries = Object.entries(data).filter(([k]) => FIELDS.includes(k));
        const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
        const values = entries.map(([, v]) => v === '' ? null : v);
        values.push(req.params.id);
        await db.query(`UPDATE employees SET ${setClause} WHERE id = ?`, values);
        res.json({ message: 'Updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.remove = async (req, res) => {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
};
