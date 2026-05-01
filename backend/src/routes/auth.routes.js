const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

// /register is restricted to super_admin only — use /api/users instead for normal user creation
router.post('/register', verifyToken, requireRole('super_admin'), ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', verifyToken, ctrl.me);

module.exports = router;
