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

const TEMPLATE_FILES = {
    offer_letter: 'offer_letter.hbs',
    payslip: 'payslip.hbs',
    experience_letter: 'experience_letter.hbs',
    relieving_letter: 'relieving_letter.hbs'
};

function renderTemplate(docType, ctx) {
    const file = path.join(__dirname, '..', 'templates', TEMPLATE_FILES[docType]);
    const src = fs.readFileSync(file, 'utf8');
    const tpl = Handlebars.compile(src);

    // Build absolute file URLs for assets
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads').replace(/\\/g, '/');
    const company = { ...ctx.company };
    if (company.logo_path) company.logo_url = `file:///${uploadsDir}/${company.logo_path}`;
    if (company.signature_path) company.signature_url = `file:///${uploadsDir}/${company.signature_path}`;
    if (company.stamp_path) company.stamp_url = `file:///${uploadsDir}/${company.stamp_path}`;

    return tpl({ ...ctx, company });
}

async function generatePDF(docType, ctx, outputPath) {
    const html = renderTemplate(docType, ctx);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });
    } finally {
        await browser.close();
    }
    return outputPath;
}

module.exports = { generatePDF, renderTemplate };
