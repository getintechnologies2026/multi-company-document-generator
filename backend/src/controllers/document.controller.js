const db = require('../db');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { generatePDF, createBrowser, WKHTMLTOPDF_BIN } = require('../utils/pdfGenerator');

/**
 * Extract the year from a document's own date string.
 * Falls back to the current year only when no valid date is provided.
 * Accepts YYYY-MM-DD, DD-MM-YYYY, or any string parseable by Date().
 */
function docYear(dateStr) {
    if (!dateStr) return new Date().getFullYear();
    // Handle plain 4-digit year (e.g. from pay_year)
    if (/^\d{4}$/.test(String(dateStr))) return Number(dateStr);
    const y = new Date(dateStr).getFullYear();
    return isNaN(y) ? new Date().getFullYear() : y;
}

exports.list = async (req, res) => {
    const { company_id, doc_type, employee_id, search } = req.query;
    let sql = `SELECT d.*, c.name as company_name, u.name as created_by_name
               FROM documents d
               LEFT JOIN companies c ON d.company_id = c.id
               LEFT JOIN users u ON d.created_by = u.id
               WHERE 1=1`;
    const params = [];
    if (company_id) { sql += ' AND d.company_id = ?'; params.push(company_id); }
    if (doc_type) { sql += ' AND d.doc_type = ?'; params.push(doc_type); }
    if (employee_id) { sql += ' AND d.employee_id = ?'; params.push(employee_id); }
    if (search) { sql += ' AND (d.employee_name LIKE ? OR d.doc_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const limit  = Math.min(parseInt(req.query.limit)  || 100, 200);
    const page   = Math.max(parseInt(req.query.page)   || 1, 1);
    const offset = (page - 1) * limit;
    sql += ' ORDER BY d.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
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

        // Generate doc number — year comes from the document's own date, not the server clock
        const prefix = company.doc_number_prefix || 'DOC';
        const typeShort = { offer_letter: 'OFR', payslip: 'PAY', experience_letter: 'EXP', relieving_letter: 'REL' }[doc_type];
        const year = docYear(
            data.offer_release_date ||   // offer letter: release date field
            data.release_date       ||   // experience letter: release date field
            data.relieving_date     ||   // relieving letter: relieving date
            data.joining_date       ||   // offer letter: joining date fallback
            data.lwd_date           ||   // relieving: last working day fallback
            data.date_of_leaving    ||   // experience: leaving date fallback
            null
        );
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
        const { company_id, employee_id, employee, payslip, offer, experience, relieving, increment } = req.body;
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
        const typeShorts = { offer_letter: 'OFR', payslip: 'PAY', experience_letter: 'EXP', relieving_letter: 'REL' };

        // Year lookup per doc type — use the document's own date, not the server clock
        const yearByType = {
            offer_letter:      docYear(offer?.offer_release_date || offer?.joining_date || empData.date_of_joining),
            payslip:           docYear(payslip?.pay_year ? String(payslip.pay_year) : null),
            experience_letter: docYear(experience?.release_date || relieving?.relieving_date || empData.date_of_leaving),
            relieving_letter:  docYear(relieving?.relieving_date || relieving?.lwd_date || empData.date_of_leaving),
        };

        const results = {};
        const docTypes = ['offer_letter', 'payslip', 'experience_letter', 'relieving_letter'];
        const extraData = { offer_letter: offer || {}, payslip: payslip || {}, experience_letter: experience || {}, relieving_letter: relieving || {} };

        // ── Open ONE browser for the entire batch (skipped when wkhtmltopdf is available) ──
        const browser = WKHTMLTOPDF_BIN ? null : await createBrowser();
        try {
            for (const doc_type of docTypes) {
                try {
                    const data = { ...empData, ...extraData[doc_type] };
                    const year = yearByType[doc_type];
                    const [cnt] = await db.query('SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = ?', [company_id, doc_type]);
                    const seq = String(cnt[0].c + 1).padStart(4, '0');
                    const doc_number = `${prefix}/${typeShorts[doc_type]}/${year}/${seq}`;
                    const filename = `${doc_number.replace(/\//g, '_')}.pdf`;
                    const outPath = path.join(__dirname, '..', '..', 'generated', filename);

                    await generatePDF(doc_type, { company, employee: empData, data, doc_number }, outPath, browser);

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

            // ── 5th doc: Salary Increment (optional — only if increment data provided) ──
            if (increment && increment.increment_value && Number(increment.increment_value) > 0) {
                try {
                    const fmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
                    const cur = {
                        basic: Number(empData.basic || 0), hra: Number(empData.hra || 0),
                        da: Number(empData.da || 0), conv: Number(empData.conveyance || 0),
                        med: Number(empData.medical || 0), special: Number(empData.special_allowance || 0),
                        ctc: Number(empData.ctc || 0),
                    };
                    cur.gross = cur.basic + cur.hra + cur.da + cur.conv + cur.med + cur.special;
                    cur.pf = Math.round(cur.basic * 0.12);
                    cur.net = cur.gross - cur.pf;

                    const incType = increment.increment_type || 'percentage';
                    const incValue = Number(increment.increment_value);
                    let newAnnualCtc, incrementDisplay, incrementLabel, incrementAmount;
                    if (incType === 'percentage') {
                        newAnnualCtc = Math.round(cur.ctc * (1 + incValue / 100));
                        incrementDisplay = `${incValue}%`; incrementLabel = 'Increment (%)';
                        incrementAmount = newAnnualCtc - cur.ctc;
                    } else {
                        incrementAmount = Math.round(incValue * 12);
                        newAnnualCtc = cur.ctc + incrementAmount;
                        incrementDisplay = `₹${fmt(incValue)}/month`; incrementLabel = 'Flat Increment';
                    }
                    const newMonthly = Math.round(newAnnualCtc / 12);
                    const curMonthly = Math.round(cur.ctc / 12) || newMonthly;
                    const ratio = curMonthly > 0 ? newMonthly / curMonthly : 1;
                    const nw = {
                        basic: Math.round(cur.basic * ratio), hra: Math.round(cur.hra * ratio),
                        da: Math.round(cur.da * ratio), conv: Math.round(cur.conv * ratio),
                        med: Math.round(cur.med * ratio),
                    };
                    nw.special = Math.max(0, newMonthly - nw.basic - nw.hra - nw.da - nw.conv - nw.med);
                    nw.gross = nw.basic + nw.hra + nw.da + nw.conv + nw.med + nw.special;
                    nw.pf = Math.round(nw.basic * 0.12); nw.net = nw.gross - nw.pf;

                    const today2 = new Date();
                    const issueDate2 = today2.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                    const incData = {
                        increment_date: increment.increment_date || issueDate2, issue_date: issueDate2,
                        increment_type: incType, increment_value: incValue,
                        increment_label: incrementLabel, increment_display: incrementDisplay, increment_amount: incrementAmount,
                        current_ctc: cur.ctc, current_ctc_fmt: fmt(cur.ctc),
                        cur_basic_fmt: fmt(cur.basic), cur_hra_fmt: fmt(cur.hra), cur_da_fmt: fmt(cur.da),
                        cur_conv_fmt: fmt(cur.conv), cur_med_fmt: fmt(cur.med), cur_special_fmt: fmt(cur.special),
                        cur_gross_fmt: fmt(cur.gross), cur_pf_fmt: fmt(cur.pf), cur_net_fmt: fmt(cur.net),
                        new_ctc: newAnnualCtc, new_ctc_fmt: fmt(newAnnualCtc), new_monthly: newMonthly,
                        new_basic_fmt: fmt(nw.basic), new_hra_fmt: fmt(nw.hra), new_da_fmt: fmt(nw.da),
                        new_conv_fmt: fmt(nw.conv), new_med_fmt: fmt(nw.med), new_special_fmt: fmt(nw.special),
                        new_gross_fmt: fmt(nw.gross), new_pf_fmt: fmt(nw.pf), new_net_fmt: fmt(nw.net),
                    };
                    const [cntInc] = await db.query(
                        "SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = 'salary_increment'", [company_id]
                    );
                    const seqInc = String(cntInc[0].c + 1).padStart(4, '0');
                    const incYear = docYear(increment.increment_date);
                    const incDocNum = `${prefix}/INC/${incYear}/${seqInc}`;
                    const incFilename = `${incDocNum.replace(/\//g, '_')}.pdf`;
                    const incOutPath = path.join(__dirname, '..', '..', 'generated', incFilename);
                    await generatePDF('salary_increment', { company, employee: empData, data: incData, doc_number: incDocNum }, incOutPath, browser);
                    const [rInc] = await db.query(
                        `INSERT INTO documents (doc_number, doc_type, company_id, employee_id, employee_name, issue_date, pdf_path, extra_data, created_by)
                         VALUES (?, 'salary_increment', ?, ?, ?, CURDATE(), ?, ?, ?)`,
                        [incDocNum, company_id, employee_id || null, empData.full_name || '', incFilename, JSON.stringify(incData), req.user.id]
                    );
                    results.salary_increment = { id: rInc.insertId, doc_number: incDocNum, filename: incFilename, url: `/generated/${incFilename}`, new_ctc: newAnnualCtc };
                } catch (err) {
                    results.salary_increment = { error: err.message };
                }
            }
        } finally {
            if (browser) await browser.close();
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
        // Note: payslip doc numbers use monthData.pay_year per-row — no global year variable needed

        const results = [];

        // ── Open ONE browser for the entire payslip batch (skipped when wkhtmltopdf is available) ──
        const browser = WKHTMLTOPDF_BIN ? null : await createBrowser();
        try {
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

                    await generatePDF('payslip', { company, employee: empData, data, doc_number }, outPath, browser);

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
        } finally {
            if (browser) await browser.close();
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

exports.generateSalaryIncrement = async (req, res) => {
    try {
        const { company_id, employee_id, employee, increment } = req.body;
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

        // ── Salary calculations ──
        const fmt  = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
        const cur  = {
            basic:   Number(empData.basic   || 0),
            hra:     Number(empData.hra     || 0),
            da:      Number(empData.da      || 0),
            conv:    Number(empData.conveyance || 0),
            med:     Number(empData.medical || 0),
            special: Number(empData.special_allowance || 0),
            ctc:     Number(empData.ctc     || 0),
        };
        cur.gross  = cur.basic + cur.hra + cur.da + cur.conv + cur.med + cur.special;
        cur.pf     = Math.round(cur.basic * 0.12);
        cur.net    = cur.gross - cur.pf;

        // New CTC
        const incType  = increment.increment_type || 'percentage';
        const incValue = Number(increment.increment_value || 0);
        let newAnnualCtc;
        let incrementDisplay, incrementLabel, incrementAmount;

        if (incType === 'percentage') {
            newAnnualCtc     = Math.round(cur.ctc * (1 + incValue / 100));
            incrementDisplay = `${incValue}%`;
            incrementLabel   = 'Increment (%)';
            incrementAmount  = newAnnualCtc - cur.ctc;
        } else {
            // flat monthly amount
            incrementAmount  = Math.round(incValue * 12);
            newAnnualCtc     = cur.ctc + incrementAmount;
            incrementDisplay = `₹${fmt(incValue)}/month`;
            incrementLabel   = 'Flat Increment';
        }

        // New monthly breakdown — keep same proportions
        const newMonthly   = Math.round(newAnnualCtc / 12);
        const curMonthly   = Math.round(cur.ctc / 12) || newMonthly;
        const ratio        = curMonthly > 0 ? newMonthly / curMonthly : 1;

        const nw = {
            basic:   Math.round(cur.basic   * ratio),
            hra:     Math.round(cur.hra     * ratio),
            da:      Math.round(cur.da      * ratio),
            conv:    Math.round(cur.conv    * ratio),
            med:     Math.round(cur.med     * ratio),
        };
        nw.special = Math.max(0, newMonthly - nw.basic - nw.hra - nw.da - nw.conv - nw.med);
        nw.gross   = nw.basic + nw.hra + nw.da + nw.conv + nw.med + nw.special;
        nw.pf      = Math.round(nw.basic * 0.12);
        nw.net     = nw.gross - nw.pf;

        // Build template data
        const today = new Date();
        const issueDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

        const data = {
            increment_date:    increment.increment_date || issueDate,
            issue_date:        issueDate,
            increment_type:    incType,
            increment_value:   incValue,
            increment_label:   incrementLabel,
            increment_display: incrementDisplay,
            increment_amount:  incrementAmount,
            // Current
            current_ctc:       cur.ctc,
            current_ctc_fmt:   fmt(cur.ctc),
            cur_basic_fmt:     fmt(cur.basic),
            cur_hra_fmt:       fmt(cur.hra),
            cur_da_fmt:        fmt(cur.da),
            cur_conv_fmt:      fmt(cur.conv),
            cur_med_fmt:       fmt(cur.med),
            cur_special_fmt:   fmt(cur.special),
            cur_gross_fmt:     fmt(cur.gross),
            cur_pf_fmt:        fmt(cur.pf),
            cur_net_fmt:       fmt(cur.net),
            // New
            new_ctc:           newAnnualCtc,
            new_ctc_fmt:       fmt(newAnnualCtc),
            new_monthly:       newMonthly,
            new_basic_fmt:     fmt(nw.basic),
            new_hra_fmt:       fmt(nw.hra),
            new_da_fmt:        fmt(nw.da),
            new_conv_fmt:      fmt(nw.conv),
            new_med_fmt:       fmt(nw.med),
            new_special_fmt:   fmt(nw.special),
            new_gross_fmt:     fmt(nw.gross),
            new_pf_fmt:        fmt(nw.pf),
            new_net_fmt:       fmt(nw.net),
            // New salary fields for storage
            new_basic:  nw.basic, new_hra: nw.hra, new_da: nw.da,
            new_conveyance: nw.conv, new_medical: nw.med,
            new_special_allowance: nw.special,
        };

        // Doc number — year from increment's own effective date
        const prefix   = company.doc_number_prefix || 'DOC';
        const year     = docYear(increment.increment_date);
        const [cnt]    = await db.query(
            "SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = 'salary_increment'",
            [company_id]
        );
        const seq      = String(cnt[0].c + 1).padStart(4, '0');
        const doc_number = `${prefix}/INC/${year}/${seq}`;
        const filename   = `${doc_number.replace(/\//g, '_')}.pdf`;
        const outPath    = path.join(__dirname, '..', '..', 'generated', filename);

        await generatePDF('salary_increment', { company, employee: empData, data, doc_number }, outPath);

        const [r] = await db.query(
            `INSERT INTO documents
             (doc_number, doc_type, company_id, employee_id, employee_name, issue_date,
              pdf_path, extra_data, created_by)
             VALUES (?, 'salary_increment', ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [doc_number, company_id, employee_id || null,
             empData.full_name || '', filename, JSON.stringify(data), req.user.id]
        );

        res.json({
            id: r.insertId,
            doc_number,
            url: `/generated/${filename}`,
            new_ctc: newAnnualCtc,
            increment_amount: incrementAmount,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.generateInternshipCertificate = async (req, res) => {
    try {
        const { company_id, employee_id, intern } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id required' });

        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        // Optional: fetch linked employee record (mentor or HR)
        let empRecord = null;
        if (employee_id) {
            const [emps] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
            if (emps.length) empRecord = emps[0];
        }

        // ── Duration text ──
        const fromDate = intern.from_date ? new Date(intern.from_date) : null;
        const toDate   = intern.to_date   ? new Date(intern.to_date)   : null;
        let durationText = '';
        if (fromDate && toDate) {
            const diffMs    = toDate - fromDate;
            const diffDays  = Math.round(diffMs / (1000 * 60 * 60 * 24));
            const months    = Math.floor(diffDays / 30);
            const days      = diffDays % 30;
            const parts = [];
            if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
            if (days   > 0) parts.push(`${days} Day${days   > 1 ? 's' : ''}`);
            durationText = parts.join(' ') || '1 Day';
        }

        // ── Format dates for display ──
        const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
        const today   = new Date();
        const issueDate = fmtDate(today.toISOString().split('T')[0]);

        // Skills array
        const skillsArr = intern.skills
            ? intern.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const data = {
            intern_name:    intern.intern_name    || '',
            roll_no:        intern.roll_no        || '',
            college:        intern.college        || '',
            course:         intern.course         || '',
            branch:         intern.branch         || '',
            department:     intern.department     || '',
            project_title:  intern.project_title  || '',
            from_date:      fmtDate(intern.from_date),
            to_date:        fmtDate(intern.to_date),
            duration_text:  intern.duration_text  || durationText,
            mentor_name:    intern.mentor_name    || (empRecord ? empRecord.full_name : ''),
            performance:    intern.performance    || '',
            skills:         intern.skills         || '',
            skills_arr:     skillsArr,
            remarks:        intern.remarks        || '',
            issue_date:     issueDate,
        };

        // Doc number — year from intern's completion (to_date) or start date
        const prefix   = company.doc_number_prefix || 'DOC';
        const year     = docYear(intern.to_date || intern.from_date);
        const [cnt]    = await db.query(
            "SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = 'internship_certificate'",
            [company_id]
        );
        const seq        = String(cnt[0].c + 1).padStart(4, '0');
        const doc_number = `${prefix}/INT/${year}/${seq}`;
        const filename   = `${doc_number.replace(/\//g, '_')}.pdf`;
        const outPath    = path.join(__dirname, '..', '..', 'generated', filename);

        await generatePDF('internship_certificate', { company, employee: empRecord || {}, data, doc_number }, outPath);

        const [r] = await db.query(
            `INSERT INTO documents
             (doc_number, doc_type, company_id, employee_id, employee_name, issue_date,
              pdf_path, extra_data, created_by)
             VALUES (?, 'internship_certificate', ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [doc_number, company_id, employee_id || null,
             data.intern_name, filename, JSON.stringify(data), req.user.id]
        );

        res.json({
            id:         r.insertId,
            doc_number,
            pdf_path:   filename,
            url:        `/generated/${filename}`,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.generateInternshipOffer = async (req, res) => {
    try {
        const { company_id, employee_id, intern } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id required' });
        if (!intern || !intern.intern_name) return res.status(400).json({ error: 'intern_name required' });

        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
        const today    = new Date();
        const issueDate = fmtDate(today.toISOString().split('T')[0]);

        // Duration
        const fromDate = intern.from_date ? new Date(intern.from_date) : null;
        const toDate   = intern.to_date   ? new Date(intern.to_date)   : null;
        let durationText = '';
        if (fromDate && toDate) {
            const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
            const months   = Math.floor(diffDays / 30);
            const days     = diffDays % 30;
            const parts    = [];
            if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
            if (days   > 0) parts.push(`${days} Day${days   > 1 ? 's' : ''}`);
            durationText = parts.join(' ') || '1 Day';
        }

        const data = {
            intern_name:          intern.intern_name         || '',
            roll_no:              intern.roll_no             || '',
            college:              intern.college             || '',
            course:               intern.course              || '',
            branch:               intern.branch              || '',
            department:           intern.department          || '',
            project_title:        intern.project_title       || '',
            from_date:            fmtDate(intern.from_date),
            to_date:              fmtDate(intern.to_date),
            duration_text:        intern.duration_text       || durationText,
            stipend:              intern.stipend             || '',
            mentor_name:          intern.mentor_name         || '',
            joining_instructions: intern.joining_instructions || '',
            remarks:              intern.remarks             || '',
            issue_date:           issueDate,
        };

        // Doc number — year from internship start date
        const prefix   = company.doc_number_prefix || 'DOC';
        const year     = docYear(intern.from_date || intern.to_date);
        const [cnt]    = await db.query(
            "SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = 'internship_offer'", [company_id]
        );
        const seq        = String(cnt[0].c + 1).padStart(4, '0');
        const doc_number = `${prefix}/IOF/${year}/${seq}`;
        const filename   = `${doc_number.replace(/\//g, '_')}.pdf`;
        const outPath    = path.join(__dirname, '..', '..', 'generated', filename);

        await generatePDF('internship_offer', { company, employee: {}, data, doc_number }, outPath);

        const [r] = await db.query(
            `INSERT INTO documents (doc_number, doc_type, company_id, employee_id, employee_name, issue_date, pdf_path, extra_data, created_by)
             VALUES (?, 'internship_offer', ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [doc_number, company_id, employee_id || null, data.intern_name, filename, JSON.stringify(data), req.user.id]
        );

        res.json({ id: r.insertId, doc_number, pdf_path: filename, url: `/generated/${filename}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.generateInternshipConfirmation = async (req, res) => {
    try {
        const { company_id, employee_id, intern } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id required' });
        if (!intern || !intern.intern_name) return res.status(400).json({ error: 'intern_name required' });

        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
        const today    = new Date();
        const issueDate = fmtDate(today.toISOString().split('T')[0]);

        const fromDate = intern.from_date ? new Date(intern.from_date) : null;
        const toDate   = intern.to_date   ? new Date(intern.to_date)   : null;
        let durationText = '';
        if (fromDate && toDate) {
            const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
            const months   = Math.floor(diffDays / 30);
            const days     = diffDays % 30;
            const parts    = [];
            if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
            if (days   > 0) parts.push(`${days} Day${days   > 1 ? 's' : ''}`);
            durationText = parts.join(' ') || '1 Day';
        }

        const data = {
            intern_name:   intern.intern_name  || '',
            roll_no:       intern.roll_no      || '',
            college:       intern.college      || '',
            course:        intern.course       || '',
            branch:        intern.branch       || '',
            department:    intern.department   || '',
            joining_date:  fmtDate(intern.joining_date || intern.from_date),
            from_date:     fmtDate(intern.from_date),
            to_date:       fmtDate(intern.to_date),
            duration_text: intern.duration_text || durationText,
            mentor_name:   intern.mentor_name  || '',
            remarks:       intern.remarks      || '',
            issue_date:    issueDate,
        };

        // Doc number — year from internship joining / start date
        const prefix   = company.doc_number_prefix || 'DOC';
        const year     = docYear(intern.joining_date || intern.from_date || intern.to_date);
        const [cnt]    = await db.query(
            "SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = 'internship_confirmation'", [company_id]
        );
        const seq        = String(cnt[0].c + 1).padStart(4, '0');
        const doc_number = `${prefix}/ICF/${year}/${seq}`;
        const filename   = `${doc_number.replace(/\//g, '_')}.pdf`;
        const outPath    = path.join(__dirname, '..', '..', 'generated', filename);

        await generatePDF('internship_confirmation', { company, employee: {}, data, doc_number }, outPath);

        const [r] = await db.query(
            `INSERT INTO documents (doc_number, doc_type, company_id, employee_id, employee_name, issue_date, pdf_path, extra_data, created_by)
             VALUES (?, 'internship_confirmation', ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [doc_number, company_id, employee_id || null, data.intern_name, filename, JSON.stringify(data), req.user.id]
        );

        res.json({ id: r.insertId, doc_number, pdf_path: filename, url: `/generated/${filename}` });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.generateInternshipAttendance = async (req, res) => {
    try {
        const { company_id, employee_id, intern } = req.body;
        if (!company_id) return res.status(400).json({ error: 'company_id required' });
        if (!intern || !intern.intern_name) return res.status(400).json({ error: 'intern_name required' });
        if (!intern.total_working_days || !intern.days_present) {
            return res.status(400).json({ error: 'total_working_days and days_present are required' });
        }

        const [companies] = await db.query('SELECT * FROM companies WHERE id = ?', [company_id]);
        if (!companies.length) return res.status(404).json({ error: 'Company not found' });
        const company = companies[0];

        let empRecord = null;
        if (employee_id) {
            const [emps] = await db.query('SELECT * FROM employees WHERE id = ?', [employee_id]);
            if (emps.length) empRecord = emps[0];
        }

        // Duration text
        const fromDate = intern.from_date ? new Date(intern.from_date) : null;
        const toDate   = intern.to_date   ? new Date(intern.to_date)   : null;
        let durationText = '';
        if (fromDate && toDate) {
            const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
            const months   = Math.floor(diffDays / 30);
            const days     = diffDays % 30;
            const parts    = [];
            if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
            if (days   > 0) parts.push(`${days} Day${days   > 1 ? 's' : ''}`);
            durationText = parts.join(' ') || '1 Day';
        }

        const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
        const today    = new Date();
        const issueDate = fmtDate(today.toISOString().split('T')[0]);

        // Attendance records (date-wise)
        const attendanceRecords = Array.isArray(intern.attendance_records)
            ? intern.attendance_records.map((r, i) => ({
                index:        i + 1,
                date:         r.date         || '',
                display_date: r.display_date || (r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
                day:          r.day          || '',
                status:       r.status       || 'P',   // P / A / H / W
                topics:       r.topics       || '',
            }))
            : [];

        // Derive totals from records if provided, else use manual inputs
        let totalDays, daysPresent, daysAbsent;
        if (attendanceRecords.length > 0) {
            const working = attendanceRecords.filter(r => r.status !== 'W');
            totalDays  = working.length;
            daysPresent = working.filter(r => r.status === 'P').length;
            daysAbsent  = working.filter(r => r.status === 'A').length;
        } else {
            totalDays   = Number(intern.total_working_days) || 0;
            daysPresent = Number(intern.days_present) || 0;
            daysAbsent  = totalDays - daysPresent;
        }
        const attendancePct = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;

        // Covered topics — collect unique non-empty topics from daily records + manual input
        const topicsFromRecords = attendanceRecords
            .map(r => r.topics).filter(Boolean)
            .join(', ');
        const topicsSource = intern.covered_topics || topicsFromRecords;
        const topicsArr = topicsSource
            ? [...new Set(topicsSource.split(',').map(s => s.trim()).filter(Boolean))]
            : [];

        const data = {
            intern_name:         intern.intern_name    || '',
            roll_no:             intern.roll_no        || '',
            college:             intern.college        || '',
            course:              intern.course         || '',
            branch:              intern.branch         || '',
            department:          intern.department     || '',
            from_date:           fmtDate(intern.from_date),
            to_date:             fmtDate(intern.to_date),
            duration_text:       intern.duration_text  || durationText,
            mentor_name:         intern.mentor_name    || (empRecord ? empRecord.full_name : ''),
            total_working_days:  totalDays,
            days_present:        daysPresent,
            days_absent:         daysAbsent,
            attendance_pct:      attendancePct,
            performance:         intern.performance    || '',
            covered_topics:      topicsSource,
            topics_arr:          topicsArr,
            attendance_records:  attendanceRecords,
            remarks:             intern.remarks        || '',
            issue_date:          issueDate,
        };

        const prefix   = company.doc_number_prefix || 'DOC';
        const year     = docYear(intern.from_date || intern.to_date);
        const [cnt]    = await db.query(
            "SELECT COUNT(*) as c FROM documents WHERE company_id = ? AND doc_type = 'internship_attendance'",
            [company_id]
        );
        const seq        = String(cnt[0].c + 1).padStart(4, '0');
        const doc_number = `${prefix}/INA/${year}/${seq}`;
        const filename   = `${doc_number.replace(/\//g, '_')}.pdf`;
        const outPath    = path.join(__dirname, '..', '..', 'generated', filename);

        await generatePDF('internship_attendance', { company, employee: empRecord || {}, data, doc_number }, outPath);

        const [r] = await db.query(
            `INSERT INTO documents
             (doc_number, doc_type, company_id, employee_id, employee_name, issue_date,
              pdf_path, extra_data, created_by)
             VALUES (?, 'internship_attendance', ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [doc_number, company_id, employee_id || null,
             data.intern_name, filename, JSON.stringify(data), req.user.id]
        );

        res.json({
            id:         r.insertId,
            doc_number,
            pdf_path:   filename,
            url:        `/generated/${filename}`,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

exports.download = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    // Path traversal protection — pdf_path must be a plain filename with no directory components
    const pdfPath = rows[0].pdf_path || '';
    if (!pdfPath || pdfPath.includes('..') || pdfPath.includes('/') || pdfPath.includes('\\')) {
        return res.status(400).json({ error: 'Invalid file reference' });
    }

    const filePath = path.join(__dirname, '..', '..', 'generated', pdfPath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file missing' });
    res.download(filePath, pdfPath);
};

exports.remove = async (req, res) => {
    const [rows] = await db.query('SELECT pdf_path FROM documents WHERE id = ?', [req.params.id]);
    if (rows.length && rows[0].pdf_path) {
        try {
            const filePath = path.join(__dirname, '..', '..', 'generated', rows[0].pdf_path);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
            console.warn('Could not delete PDF file:', e.message);
        }
    }
    await db.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
};
