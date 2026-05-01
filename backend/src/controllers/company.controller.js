const db = require('../db');

exports.list = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM companies WHERE is_active = 1 ORDER BY id DESC');
    res.json(rows);
};

exports.get = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Company not found' });
    res.json(rows[0]);
};

exports.create = async (req, res) => {
    try {
        const f = req.files || {};
        const data = {
            ...req.body,
            logo_path: f.logo ? f.logo[0].filename : null,
            signature_path: f.signature ? f.signature[0].filename : null,
            stamp_path: f.stamp ? f.stamp[0].filename : null
        };
        const fields = ['name', 'address', 'city', 'state', 'pincode', 'email', 'phone', 'website',
            'gst_no', 'pan_no', 'cin_no', 'tan_no', 'esic_code', 'pf_reg_no', 'industry', 'founded_year',
            'logo_path', 'signature_path', 'stamp_path',
            'signatory_name', 'signatory_designation', 'doc_number_prefix'];
        const cols = fields.join(', ');
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(k => data[k] || null);

        const [r] = await db.query(`INSERT INTO companies (${cols}) VALUES (${placeholders})`, values);
        res.json({ id: r.insertId, ...data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.update = async (req, res) => {
    try {
        const f = req.files || {};
        const data = { ...req.body };
        if (f.logo) data.logo_path = f.logo[0].filename;
        if (f.signature) data.signature_path = f.signature[0].filename;
        if (f.stamp) data.stamp_path = f.stamp[0].filename;

        const allowed = ['name', 'address', 'city', 'state', 'pincode', 'email', 'phone', 'website',
            'gst_no', 'pan_no', 'cin_no', 'tan_no', 'esic_code', 'pf_reg_no', 'industry', 'founded_year',
            'logo_path', 'signature_path', 'stamp_path',
            'signatory_name', 'signatory_designation', 'doc_number_prefix'];
        const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
        const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
        const values = entries.map(([, v]) => v);
        values.push(req.params.id);

        await db.query(`UPDATE companies SET ${setClause} WHERE id = ?`, values);
        res.json({ message: 'Updated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.remove = async (req, res) => {
    await db.query('UPDATE companies SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
};
