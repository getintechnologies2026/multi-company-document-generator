const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const {
  PAY_MATRIX, HRA_CITIES, TRANSPORT_ALLOWANCE,
  PROF_TAX_SLABS, GIS_RATES, MEDICAL_ALLOWANCE,
  CHILDREN_EDUCATION, calculateTNSalary
} = require('../utils/tnSalary');

router.use(verifyToken);

// GET /api/salary/tn-data — return all TN salary reference data
router.get('/tn-data', (req, res) => {
  res.json({
    payMatrix: PAY_MATRIX,
    hraCities: HRA_CITIES,
    transportAllowance: TRANSPORT_ALLOWANCE,
    profTaxSlabs: PROF_TAX_SLABS,
    gisRates: GIS_RATES,
    medicalAllowance: MEDICAL_ALLOWANCE,
    childrenEducation: CHILDREN_EDUCATION,
    currentDA: 53,
  });
});

// POST /api/salary/calculate — calculate full salary breakdown
router.post('/calculate', (req, res) => {
  try {
    const result = calculateTNSalary(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
