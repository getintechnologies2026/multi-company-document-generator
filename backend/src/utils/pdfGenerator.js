const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const moment = require('moment');

// Helpers
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
Handlebars.registerHelper('eq', (a, b) => a === b);

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

function renderTemplate(docType, ctx) {
    const file = path.join(__dirname, '..', 'templates', TEMPLATE_FILES[docType]);
    const src = fs.readFileSync(file, 'utf8');
    const tpl = Handlebars.compile(src);

    // Use HTTP URLs so Puppeteer can load images served by the Express server.
    // file:// URLs with spaces in the path (e.g. "Document Software") break Chromium.
    const PORT = process.env.PORT || 5000;
    const uploadsBase = `http://localhost:${PORT}/uploads`;
    const company = { ...ctx.company };
    if (company.logo_path)      company.logo_url      = `${uploadsBase}/${company.logo_path}`;
    if (company.signature_path) company.signature_url = `${uploadsBase}/${company.signature_path}`;
    if (company.stamp_path)     company.stamp_url     = `${uploadsBase}/${company.stamp_path}`;

    return tpl({ ...ctx, company });
}

const BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-zygote',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
    '--disable-software-rasterizer',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
];

/**
 * Launch a Puppeteer browser instance.
 * Priority:
 * 1. System Chrome (google-chrome-stable / google-chrome) — most stable on VPS
 * 2. Puppeteer bundled chrome-headless-shell ('shell' mode)
 * 3. Puppeteer bundled full Chrome ('new' mode)
 */
async function createBrowser() {
    // Check for system-installed Chrome first (installed via apt / Google .deb)
    const SYSTEM_CHROME_PATHS = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
    ];
    const systemChrome = SYSTEM_CHROME_PATHS.find(p => {
        try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; }
    });

    if (systemChrome) {
        try {
            console.log('[pdfGenerator] Using system Chrome:', systemChrome);
            return await puppeteer.launch({
                executablePath: systemChrome,
                headless: 'new',
                args: BROWSER_ARGS,
                timeout: 60000,
            });
        } catch (e) {
            console.warn('[pdfGenerator] System Chrome failed, falling back:', e.message);
        }
    }

    // Fallback 1: bundled chrome-headless-shell
    try {
        return await puppeteer.launch({
            headless: 'shell',
            args: BROWSER_ARGS,
            timeout: 60000,
        });
    } catch (e) {
        console.warn('[pdfGenerator] shell headless failed, trying new mode:', e.message);
    }

    // Fallback 2: bundled full Chrome
    return await puppeteer.launch({
        headless: true,
        args: BROWSER_ARGS,
        timeout: 60000,
    });
}

/**
 * Generate a single PDF.
 * @param {string} docType
 * @param {object} ctx
 * @param {string} outputPath
 * @param {import('puppeteer').Browser|null} sharedBrowser
 *   Pass an existing browser to reuse it (caller is responsible for closing it).
 *   Omit / pass null to launch+close a fresh browser automatically.
 */
async function generatePDF(docType, ctx, outputPath, sharedBrowser = null) {
    const html = renderTemplate(docType, ctx);
    const browser = sharedBrowser || await createBrowser();
    let page;
    try {
        page = await browser.newPage();
        // networkidle2 (≤2 active connections) is more forgiving than networkidle0 on VPS
        await page.setContent(html, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });
    } finally {
        if (page) await page.close().catch(() => {});
        if (!sharedBrowser) await browser.close();
    }
    return outputPath;
}

module.exports = { generatePDF, renderTemplate, createBrowser };
