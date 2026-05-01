const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execFile } = require('child_process');
const Handlebars = require('handlebars');
const puppeteer  = require('puppeteer');
const moment     = require('moment');

// ── Handlebars helpers ────────────────────────────────────
Handlebars.registerHelper('formatDate', (date, fmt) => {
    if (!date) return '';
    return moment(date).format(typeof fmt === 'string' ? fmt : 'DD-MMM-YYYY');
});
Handlebars.registerHelper('inr', (n) => {
    const num = Number(n || 0);
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});
Handlebars.registerHelper('today', () => moment().format('DD-MMM-YYYY'));
Handlebars.registerHelper('upper', (s) => (s || '').toString().toUpperCase());
Handlebars.registerHelper('eq',  (a, b) => a === b);
Handlebars.registerHelper('inc', (n)    => Number(n) + 1);

// ── Template map ──────────────────────────────────────────
const TEMPLATE_FILES = {
    offer_letter:              'offer_letter.hbs',
    payslip:                   'payslip.hbs',
    experience_letter:         'experience_letter.hbs',
    relieving_letter:          'relieving_letter.hbs',
    salary_increment:          'salary_increment.hbs',
    internship_certificate:    'internship_certificate.hbs',
    internship_attendance:     'internship_attendance.hbs',
    internship_offer:          'internship_offer.hbs',
    internship_confirmation:   'internship_confirmation.hbs',
};

// ── Template renderer ─────────────────────────────────────
function renderTemplate(docType, ctx) {
    const file = path.join(__dirname, '..', 'templates', TEMPLATE_FILES[docType]);
    const src  = fs.readFileSync(file, 'utf8');
    const tpl  = Handlebars.compile(src);

    // Use HTTP URLs so the renderer can load images served by Express.
    const PORT        = process.env.PORT || 5000;
    const uploadsBase = `http://localhost:${PORT}/uploads`;
    const company     = { ...ctx.company };
    if (company.logo_path)      company.logo_url      = `${uploadsBase}/${company.logo_path}`;
    if (company.signature_path) company.signature_url = `${uploadsBase}/${company.signature_path}`;
    if (company.stamp_path)     company.stamp_url     = `${uploadsBase}/${company.stamp_path}`;

    return tpl({ ...ctx, company });
}

// ── wkhtmltopdf detection (checked once at startup) ───────
const WKHTML_PATHS = [
    '/usr/bin/wkhtmltopdf',
    '/usr/local/bin/wkhtmltopdf',
    '/opt/wkhtmltopdf/bin/wkhtmltopdf',
];
const WKHTMLTOPDF_BIN = WKHTML_PATHS.find(p => {
    try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; }
}) || null;

if (WKHTMLTOPDF_BIN) {
    console.log('[pdfGenerator] PDF engine: wkhtmltopdf —', WKHTMLTOPDF_BIN);
} else {
    console.log('[pdfGenerator] wkhtmltopdf not found — will use puppeteer/Chrome');
}

// ── wkhtmltopdf PDF generation ────────────────────────────
function generateWithWkhtmltopdf(html, outputPath) {
    return new Promise((resolve, reject) => {
        const tmpHtml = path.join(os.tmpdir(), `docgen_${Date.now()}_${Math.random().toString(36).slice(2)}.html`);
        fs.writeFileSync(tmpHtml, html, 'utf8');

        const args = [
            '--quiet',
            '--page-size',    'A4',
            '--margin-top',   '0mm',
            '--margin-right', '0mm',
            '--margin-bottom','0mm',
            '--margin-left',  '0mm',
            '--print-media-type',
            '--enable-local-file-access',
            '--javascript-delay', '300',
            '--no-stop-slow-scripts',
            '--load-error-handling', 'ignore',
            '--load-media-error-handling', 'ignore',
            tmpHtml,
            outputPath,
        ];

        execFile(WKHTMLTOPDF_BIN, args, { timeout: 90000 }, (err) => {
            try { fs.unlinkSync(tmpHtml); } catch {}
            // wkhtmltopdf returns exit code 1 for warnings but still writes the file
            if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
                resolve();
            } else {
                reject(new Error(err ? err.message : 'wkhtmltopdf produced empty/no output'));
            }
        });
    });
}

// ── Puppeteer fallback ────────────────────────────────────
const BROWSER_ARGS = [
    '--no-sandbox', '--disable-setuid-sandbox',
    '--disable-gpu', '--disable-dev-shm-usage',
    '--no-zygote', '--disable-extensions',
    '--disable-background-networking', '--disable-default-apps',
    '--disable-sync', '--disable-translate', '--hide-scrollbars',
    '--metrics-recording-only', '--mute-audio', '--no-first-run',
    '--safebrowsing-disable-auto-update', '--disable-software-rasterizer',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
];

async function createBrowser() {
    try {
        return await puppeteer.launch({ headless: 'shell', args: BROWSER_ARGS, timeout: 60000 });
    } catch (e) {
        console.warn('[pdfGenerator] shell headless failed:', e.message);
        return await puppeteer.launch({ headless: true,  args: BROWSER_ARGS, timeout: 60000 });
    }
}

// ── Main PDF generator ────────────────────────────────────
/**
 * Generate a PDF from a document type and context.
 *
 * @param {string}  docType
 * @param {object}  ctx
 * @param {string}  outputPath
 * @param {object|null} sharedBrowser  — ignored when wkhtmltopdf is used
 */
async function generatePDF(docType, ctx, outputPath, sharedBrowser = null) {
    const html = renderTemplate(docType, ctx);

    // ① wkhtmltopdf — works on OpenVZ/LXC containers, no Chrome needed
    if (WKHTMLTOPDF_BIN) {
        await generateWithWkhtmltopdf(html, outputPath);
        return outputPath;
    }

    // ② Puppeteer/Chrome fallback
    const browser = sharedBrowser || await createBrowser();
    let page;
    try {
        page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        });
    } finally {
        if (page) await page.close().catch(() => {});
        if (!sharedBrowser) await browser.close();
    }
    return outputPath;
}

module.exports = { generatePDF, renderTemplate, createBrowser, WKHTMLTOPDF_BIN };
