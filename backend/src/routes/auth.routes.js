const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', require('../middleware/auth').verifyToken, ctrl.me);

module.exports = router;
