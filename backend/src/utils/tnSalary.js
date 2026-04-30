/**
 * Tamil Nadu Government Salary Structure
 * Based on 7th Pay Commission (TN Adaptation)
 * Updated: 2026
 */

// ── Pay Matrix (Level → starting basic pay) ──
const PAY_MATRIX = [
  { level: 1,  label: 'Level 1  (GP ₹1800)',  basic: 18000,  category: 'Group D', description: 'Multi Tasking Staff' },
  { level: 2,  label: 'Level 2  (GP ₹1900)',  basic: 19900,  category: 'Group D', description: 'Lower Division Clerk' },
  { level: 3,  label: 'Level 3  (GP ₹2000)',  basic: 21700,  category: 'Group D', description: 'Upper Division Clerk' },
  { level: 4,  label: 'Level 4  (GP ₹2400)',  basic: 25500,  category: 'Group C', description: 'Junior Assistant' },
  { level: 5,  label: 'Level 5  (GP ₹2800)',  basic: 29200,  category: 'Group C', description: 'Assistant / Steno' },
  { level: 6,  label: 'Level 6  (GP ₹4200)',  basic: 35400,  category: 'Group B', description: 'Junior Superintendent' },
  { level: 7,  label: 'Level 7  (GP ₹4600)',  basic: 44900,  category: 'Group B', description: 'Superintendent' },
  { level: 8,  label: 'Level 8  (GP ₹4800)',  basic: 47600,  category: 'Group B', description: 'Senior Superintendent' },
  { level: 9,  label: 'Level 9  (GP ₹5400)',  basic: 53100,  category: 'Group B', description: 'Section Officer' },
  { level: 10, label: 'Level 10 (GP ₹5400)',  basic: 56100,  category: 'Group A', description: 'Deputy Superintendent' },
  { level: 11, label: 'Level 11 (GP ₹6600)',  basic: 67700,  category: 'Group A', description: 'Assistant Director' },
  { level: 12, label: 'Level 12 (GP ₹7600)',  basic: 78800,  category: 'Group A', description: 'Deputy Director' },
  { level: 13, label: 'Level 13 (GP ₹8700)',  basic: 123100, category: 'Group A', description: 'Joint Director / Sr Officer' },
  { level: 14, label: 'Level 14 (GP ₹10000)', basic: 144200, category: 'Group A', description: 'Additional Director' },
  { level: 15, label: 'Level 15 (GP ₹12000)', basic: 182200, category: 'Group A', description: 'Director' },
  { level: 16, label: 'Level 16 (GP ₹14400)', basic: 205400, category: 'Senior A', description: 'Principal Secretary / HOD' },
  { level: 17, label: 'Level 17 (GP ₹16500)', basic: 225000, category: 'Senior A', description: 'Special Chief Secretary' },
  { level: 18, label: 'Level 18 (GP ₹18000)', basic: 250000, category: 'Senior A', description: 'Chief Secretary / Secretary to Govt' },
];

// ── HRA City Classifications ──
const HRA_CITIES = {
  X: { label: 'X Class — Chennai', percent: 27, cities: ['Chennai'] },
  Y: { label: 'Y Class — Coimbatore / Madurai / Trichy / Salem / Tirunelveli', percent: 18, cities: ['Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Tiruppur','Vellore'] },
  Z: { label: 'Z Class — All Other Cities', percent: 9, cities: ['Others'] },
};

// ── Transport Allowance (per month, before DA on TA) ──
const TRANSPORT_ALLOWANCE = [
  { levels: [1, 2],     amount: 1350,  label: 'Level 1–2' },
  { levels: [3, 4, 5, 6, 7, 8], amount: 3600, label: 'Level 3–8' },
  { levels: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], amount: 7200, label: 'Level 9+' },
];

// ── Tamil Nadu Professional Tax Slabs ──
const PROF_TAX_SLABS = [
  { min: 0,      max: 21000,   monthly: 0,    february: 0    },
  { min: 21001,  max: 30000,   monthly: 135,  february: 135  },
  { min: 30001,  max: 45000,   monthly: 315,  february: 315  },
  { min: 45001,  max: 60000,   monthly: 690,  february: 690  },
  { min: 60001,  max: 75000,   monthly: 1025, february: 1025 },
  { min: 75001,  max: Infinity, monthly: 1250, february: 2500 },
];

// ── Group Insurance Scheme (GIS) ──
const GIS_RATES = [
  { levels: [1, 2, 3, 4, 5],               monthly: 120,  label: 'Level 1–5' },
  { levels: [6, 7, 8, 9],                   monthly: 240,  label: 'Level 6–9' },
  { levels: [10, 11, 12],                   monthly: 480,  label: 'Level 10–12' },
  { levels: [13, 14, 15, 16, 17, 18],       monthly: 960,  label: 'Level 13+' },
];

// ── Medical Allowance ──
const MEDICAL_ALLOWANCE = 500; // fixed per month

// ── Children Education Allowance ──
const CHILDREN_EDUCATION = 2250; // per child per month (max 2)

// ── Helper: get TA for a level ──
function getTransportAllowance(level) {
  const entry = TRANSPORT_ALLOWANCE.find(t => t.levels.includes(level));
  return entry ? entry.amount : 1350;
}

// ── Helper: get GIS for a level ──
function getGIS(level) {
  const entry = GIS_RATES.find(g => g.levels.includes(level));
  return entry ? entry.monthly : 120;
}

// ── Helper: get Professional Tax ──
function getProfessionalTax(grossSalary, month = '') {
  const slab = PROF_TAX_SLABS.find(s => grossSalary >= s.min && grossSalary <= s.max);
  if (!slab) return 0;
  return (month === 'February' || month === 'Feb') ? slab.february : slab.monthly;
}

// ── Main Salary Calculator ──
function calculateTNSalary({
  level,
  basicPay,          // override if needed, else use matrix
  hraClass = 'Y',    // X, Y, Z
  daPercent = 53,    // current DA %
  daOnTA = true,     // DA on Transport Allowance
  pensionType = 'NPS', // NPS or GPF
  pensionPercent = 10, // NPS: 10%, GPF: min 6%
  children = 0,      // 0, 1, or 2
  includeGIS = true,
  month = '',        // for PT February calculation
  customAllowances = {}, // additional allowances
  customDeductions = {}, // additional deductions
}) {
  const matrixEntry = PAY_MATRIX.find(p => p.level === level);
  const basic = Number(basicPay) || (matrixEntry ? matrixEntry.basic : 18000);

  const da        = Math.round(basic * daPercent / 100);
  const hra       = Math.round(basic * (HRA_CITIES[hraClass]?.percent || 9) / 100);
  const taBase    = getTransportAllowance(level);
  const daOnTAamt = daOnTA ? Math.round(taBase * daPercent / 100) : 0;
  const ta        = taBase + daOnTAamt;
  const medical   = MEDICAL_ALLOWANCE;
  const childEdu  = Math.min(children, 2) * CHILDREN_EDUCATION;
  const special   = Number(customAllowances.special || 0);
  const otherAllow = Number(customAllowances.other || 0);

  const grossEarnings = basic + da + hra + ta + medical + childEdu + special + otherAllow;

  // Deductions
  const pensionAmt  = Math.round((basic + da) * pensionPercent / 100);
  const gis         = includeGIS ? getGIS(level) : 0;
  const profTax     = getProfessionalTax(grossEarnings, month);
  const tds         = Number(customDeductions.tds || 0);
  const loan        = Number(customDeductions.loan || 0);
  const otherDed    = Number(customDeductions.other || 0);

  const totalDeductions = pensionAmt + gis + profTax + tds + loan + otherDed;
  const netPay = grossEarnings - totalDeductions;

  return {
    // Inputs
    level, basic, daPercent, hraClass, pensionType, pensionPercent, children,
    // Earnings
    earnings: {
      basic,
      da,
      hra,
      ta,
      medical,
      childEdu,
      special,
      otherAllowances: otherAllow,
      gross: grossEarnings,
    },
    // Deductions
    deductions: {
      pension: { type: pensionType, amount: pensionAmt },
      gis,
      professionalTax: profTax,
      tds,
      loan,
      otherDeductions: otherDed,
      total: totalDeductions,
    },
    netPay,
    // Meta
    meta: {
      category: matrixEntry?.category || '',
      description: matrixEntry?.description || '',
      hraPercent: HRA_CITIES[hraClass]?.percent || 9,
      hraCity: HRA_CITIES[hraClass]?.label || '',
    }
  };
}

module.exports = {
  PAY_MATRIX,
  HRA_CITIES,
  TRANSPORT_ALLOWANCE,
  PROF_TAX_SLABS,
  GIS_RATES,
  MEDICAL_ALLOWANCE,
  CHILDREN_EDUCATION,
  getTransportAllowance,
  getGIS,
  getProfessionalTax,
  calculateTNSalary,
};
