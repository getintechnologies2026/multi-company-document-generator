const db = require('../db');

const FIELDS = ['company_id', 'emp_code', 'full_name', 'father_name', 'dob', 'gender', 'email', 'phone',
    'address',
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

/**
 * GET /api/employees/next-code?company_id=X
 * Returns the next unique employee code for a company.
 * Format: {company.doc_number_prefix}{4-digit-number}
 * - First employee of a company  → random 4-digit seed  (e.g. GETINT4267)
 * - Every next employee          → previous max + 1     (e.g. GETINT4268)
 */
exports.nextCode = async (req, res) => {
    try {
        const { company_id } = req.query;
        if (!company_id) return res.status(400).json({ error: 'company_id required' });

        // Fetch company prefix
        const [companies] = await db.query('SELECT doc_number_prefix FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const prefix = (companies[0].doc_number_prefix || 'EMP').toUpperCase();

        // Get all existing emp_codes for this company
        const [employees] = await db.query(
            'SELECT emp_code FROM employees WHERE company_id = ? AND emp_code IS NOT NULL',
            [company_id]
        );

        let nextNum;
        if (employees.length === 0) {
            // No employees yet — pick a random 4-digit seed unique to this company
            nextNum = Math.floor(Math.random() * 9000) + 1000; // 1000–9999
        } else {
            // Extract all numeric suffixes from codes that match this prefix
            const nums = employees
                .map(e => {
                    const code = (e.emp_code || '').trim().toUpperCase();
                    if (!code.startsWith(prefix)) return NaN;
                    return parseInt(code.slice(prefix.length), 10);
                })
                .filter(n => !isNaN(n) && n >= 1000);

            if (nums.length === 0) {
                // Existing codes don't follow the prefix pattern — start a fresh random seed
                nextNum = Math.floor(Math.random() * 9000) + 1000;
            } else {
                nextNum = Math.max(...nums) + 1;
            }
        }

        // Guarantee uniqueness (handles edge cases like manual codes already taken)
        let emp_code = `${prefix}${nextNum}`;
        for (let i = 0; i < 100; i++) {
            const [exists] = await db.query(
                'SELECT id FROM employees WHERE company_id = ? AND emp_code = ? LIMIT 1',
                [company_id, emp_code]
            );
            if (!exists.length) break;
            nextNum++;
            emp_code = `${prefix}${nextNum}`;
        }

        res.json({ emp_code });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
