const db = require('../db');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { generatePDF } = require('../utils/pdfGenerator');

exports.list = async (req, res) => {
    const { company_id, doc_type, employee_id, search } = req.query;
    let sql = `SELECT d.*, c.name as company_name
               FROM documents d LEFT JOIN companies c ON d.company_id = c.id WHERE 1=1`;
    const params = [];
    if (company_id) { sql += ' AND d.company_id = ?'; params.push(company_id); }
    if (doc_type) { sql += ' AND d.doc_type = ?'; params.push(doc_type); }
    if (employee_id) { sql += ' AND d.employee_id = ?'; params.push(employee_id); }
    if (search) { sql += ' AND (d.employee_name LIKE ? OR d.doc_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY d.id DESC LIMIT 500';
    const [rows] = await db.query(sql, params);
    res.json(rows);
};

exports.get = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Document not found' });
    res.json(rows[0]);
};

exports.generate = async (req, res) => {
    try {
        const { doc_type, company_id, employee_id, data = {} } = req.body;
        if (!doc_type || !company_id) return res.status(400).json({ error: 'doc_type and company_id required' });

        // Fetch company
        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        // Fetch employee (if id provided)
        let employee = null;
        if (employee_id) {
            const [emps] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
            if (emps.length) employee = emps[0];
        }
        // Merge employee with overrides from form
        const empData = { ...(employee || {}), ...data };

        // Generate doc number
        const prefix = company.doc_number_prefix || 'DOC';
        const typeShort = { offer_letter: 'OFR', payslip: 'PAY', experience_letter: 'EXP', relieving_letter: 'REL' }[doc_type];
        const year = new Date().getFullYear();
        const [cnt] = await db.query('SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = ?', [company_id, doc_type]);
        const seq = String(cnt[0].c + 1).padStart(4, '0');
        const doc_number = `${prefix}/${typeShort}/${year}/${seq}`;

        // Render PDF
        const filename = `${doc_number.replace(/\//g, '_')}.pdf`;
        const outPath = path.join(__dirname, '..', '..', 'generated', filename);
        await generatePDF(doc_type, { company, employee: empData, data, doc_number }, outPath);

        // Insert record
        const [r] = await db.query(
            `INSERT INTO documents
             (doc_number, doc_type, company_id, employee_id, employee_name, issue_date,
              pay_month, pay_year, working_days, paid_days, lop_days,
              gross_earnings, total_deductions, net_pay,
              joining_date, offered_designation, offered_ctc, relieving_date,
              pdf_path, extra_data, created_by)
             VALUES (?, ?, ?, ?, ?, CURDATE(),
              ?, ?, ?, ?, ?,
              ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?)`,
            [doc_number, doc_type, company_id, employee_id || null,
             empData.full_name || data.employee_name || '',
             data.pay_month || null, data.pay_year || null,
             data.working_days || null, data.paid_days || null, data.lop_days || 0,
             data.gross_earnings || null, data.total_deductions || null, data.net_pay || null,
             data.joining_date || empData.date_of_joining || null,
             data.offered_designation || empData.designation || null,
             data.offered_ctc || empData.ctc || null,
             data.relieving_date || empData.date_of_leaving || null,
             filename, JSON.stringify(data), req.user.id]
        );

        res.json({
            id: r.insertId,
            doc_number,
            pdf_path: filename,
            url: `/generated/${filename}`,
            download_url: `/api/documents/${r.insertId}/download`
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.generateAll = async (req, res) => {
    try {
        const { company_id, employee_id, employee, payslip, offer, experience, relieving } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id required' });

        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        let empRecord = null;
        if (employee_id) {
            const [emps] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
            if (emps.length) empRecord = emps[0];
        }
        const empData = { ...(empRecord || {}), ...(employee || {}) };

        const prefix = company.doc_number_prefix || 'DOC';
        const year = new Date().getFullYear();
        const typeShorts = { offer_letter: 'OFR', payslip: 'PAY', experience_letter: 'EXP', relieving_letter: 'REL' };

        const results = {};
        const docTypes = ['offer_letter', 'payslip', 'experience_letter', 'relieving_letter'];
        const extraData = { offer_letter: offer || {}, payslip: payslip || {}, experience_letter: experience || {}, relieving_letter: relieving || {} };

        for (const doc_type of docTypes) {
            try {
                const data = { ...empData, ...extraData[doc_type] };
                const [cnt] = await db.query('SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = ?', [company_id, doc_type]);
                const seq = String(cnt[0].c + 1).padStart(4, '0');
                const doc_number = `${prefix}/${typeShorts[doc_type]}/${year}/${seq}`;
                const filename = `${doc_number.replace(/\//g, '_')}.pdf`;
                const outPath = path.join(__dirname, '..', '..', 'generated', filename);

                await generatePDF(doc_type, { company, employee: empData, data, doc_number }, outPath);

                const [r] = await db.query(
                    `INSERT INTO documents
                     (doc_number, doc_type, company_id, employee_id, employee_name, issue_date,
                      pay_month, pay_year, working_days, paid_days, lop_days,
                      gross_earnings, total_deductions, net_pay,
                      joining_date, offered_designation, offered_ctc, relieving_date,
                      pdf_path, extra_data, created_by)
                     VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [doc_number, doc_type, company_id, employee_id || null,
                     empData.full_name || '',
                     payslip?.pay_month || null, payslip?.pay_year || null,
                     payslip?.working_days || null, payslip?.paid_days || null, payslip?.lop_days || 0,
                     payslip?.gross_earnings || null, payslip?.total_deductions || null, payslip?.net_pay || null,
                     offer?.joining_date || empData.date_of_joining || null,
                     offer?.designation || empData.designation || null,
                     offer?.ctc || empData.ctc || null,
                     relieving?.relieving_date || empData.date_of_leaving || null,
                     filename, JSON.stringify(data), req.user.id]
                );

                results[doc_type] = { id: r.insertId, doc_number, filename, url: `/generated/${filename}` };
            } catch (err) {
                results[doc_type] = { error: err.message };
            }
        }

        res.json({ success: true, documents: results });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.generateBulkPayslips = async (req, res) => {
    try {
        const { company_id, employee_id, employee, months } = req.body;
        // months: [{ pay_month, pay_year, working_days, paid_days, lop_days, gross_earnings, total_deductions, net_pay, amount_in_words }]
        if (!company_id) return res.status(400).json({ error: 'company_id required' });
        if (!months || !months.length) return res.status(400).json({ error: 'months array required' });

        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        let empRecord = null;
        if (employee_id) {
            const [emps] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
            if (emps.length) empRecord = emps[0];
        }
        const empData = { ...(empRecord || {}), ...(employee || {}) };
        const prefix = company.doc_number_prefix || 'DOC';
        const year = new Date().getFullYear();

        const results = [];

        for (const monthData of months) {
            try {
                const [cnt] = await db.query(
                    'SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = ?',
                    [company_id, 'payslip']
                );
                const seq = String(cnt[0].c + 1).padStart(4, '0');
                const doc_number = `${prefix}/PAY/${monthData.pay_year}/${seq}`;
                const filename = `${doc_number.replace(/\//g, '_')}_${monthData.pay_month}.pdf`;
                const outPath = path.join(__dirname, '..', '..', 'generated', filename);
                const data = { ...monthData };

                await generatePDF('payslip', { company, employee: empData, data, doc_number }, outPath);

                const [r] = await db.query(
                    `INSERT INTO documents
                     (doc_number, doc_type, company_id, employee_id, employee_name, issue_date,
                      pay_month, pay_year, working_days, paid_days, lop_days,
                      gross_earnings, total_deductions, net_pay, pdf_path, extra_data, created_by)
                     VALUES (?, 'payslip', ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [doc_number, company_id, employee_id || null, empData.full_name || '',
                     monthData.pay_month, monthData.pay_year,
                     monthData.working_days || 30, monthData.paid_days || 30, monthData.lop_days || 0,
                     monthData.gross_earnings || 0, monthData.total_deductions || 0, monthData.net_pay || 0,
                     filename, JSON.stringify(monthData), req.user.id]
                );

                results.push({
                    id: r.insertId, doc_number, filename,
                    pay_month: monthData.pay_month, pay_year: monthData.pay_year,
                    net_pay: monthData.net_pay,
                    url: `/generated/${filename}`, success: true
                });
            } catch (err) {
                results.push({ pay_month: monthData.pay_month, pay_year: monthData.pay_year, success: false, error: err.message });
            }
        }

        // Create ZIP of all generated PDFs
        const successFiles = results.filter(r => r.success);
        let zipUrl = null;
        if (successFiles.length > 1) {
            const empName = (empData.full_name || 'Employee').replace(/\s+/g, '_');
            const zipName = `Payslips_${empName}_${Date.now()}.zip`;
            const zipPath = path.join(__dirname, '..', '..', 'generated', zipName);
            await new Promise((resolve, reject) => {
                const output = fs.createWriteStream(zipPath);
                const archive = archiver('zip', { zlib: { level: 9 } });
                output.on('close', resolve);
                archive.on('error', reject);
                archive.pipe(output);
                successFiles.forEach(r => {
                    const fp = path.join(__dirname, '..', '..', 'generated', r.filename);
                    if (fs.existsSync(fp)) archive.file(fp, { name: r.filename });
                });
                archive.finalize();
            });
            zipUrl = `/generated/${zipName}`;
        }

        res.json({ success: true, total: months.length, generated: successFiles.length, results, zipUrl });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.download = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(__dirname, '..', '..', 'generated', rows[0].pdf_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file missing' });
    res.download(filePath, rows[0].pdf_path);
};

exports.remove = async (req, res) => {
    const [rows] = await db.query('SELECT pdf_path FROM documents WHERE id = ?', [req.params.id]);
    if (rows.length) {
        const filePath = path.join(__dirname, '..', '..', 'generated', rows[0].pdf_path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
};
