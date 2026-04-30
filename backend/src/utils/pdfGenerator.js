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
    offer_letter: 'offer_letter.hbs',
    payslip: 'payslip.hbs',
    experience_letter: 'experience_letter.hbs',
    relieving_letter: 'relieving_letter.hbs',
    salary_increment: 'salary_increment.hbs',
    internship_certificate: 'internship_certificate.hbs'
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
    '--disable-extensions',
    '--no-first-run',
    '--disable-default-apps',
];

/**
 * Launch a Puppeteer browser instance.
 * Call this once for a batch; pass the result to generatePDF as sharedBrowser.
 */
async function createBrowser() {
    return puppeteer.launch({ headless: 'new', args: BROWSER_ARGS });
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
        await page.setContent(html, { waitUntil: 'networkidle0' });
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
