const router = require('express').Router();
const ctrl = require('../controllers/document.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/generate', ctrl.generate);
router.post('/generate-all', ctrl.generateAll);
router.post('/generate-payslips-bulk', ctrl.generateBulkPayslips);
router.post('/generate-salary-increment', ctrl.generateSalaryIncrement);
router.post('/generate-internship', ctrl.generateInternshipCertificate);
router.get('/:id/download', ctrl.download);
router.delete('/:id', ctrl.remove);

module.exports = router;
