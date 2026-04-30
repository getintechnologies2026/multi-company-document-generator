const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/stats', async (req, res) => {
    try {
        const [[c]] = await db.query('SELECT COUNT(*) as count FROM companies WHERE is_active = 1');
        const [[e]] = await db.query('SELECT COUNT(*) as count FROM employees');
        const [[d]] = await db.query('SELECT COUNT(*) as count FROM documents');
        const [byType] = await db.query('SELECT doc_type, COUNT(*) as count FROM documents GROUP BY doc_type');
        const [recent] = await db.query(
            `SELECT d.id, d.doc_number, d.doc_type, d.employee_name, d.created_at, c.name as company_name
             FROM documents d LEFT JOIN companies c ON d.company_id = c.id
             ORDER BY d.id DESC LIMIT 10`
        );
        const [monthly] = await db.query(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
             FROM documents
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month`
        );
        res.json({
            totalCompanies: c.count,
            totalEmployees: e.count,
            totalDocuments: d.count,
            documentsByType: byType,
            recentDocuments: recent,
            monthlyTrend: monthly
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
