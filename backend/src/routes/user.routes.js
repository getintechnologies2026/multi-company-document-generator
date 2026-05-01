const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const c = require('../controllers/user.controller');

// All user management routes are super_admin only
router.use(verifyToken, requireRole('super_admin'));

router.get('/',           c.list);
router.get('/stats',      c.stats);
router.get('/:id',        c.get);
router.post('/',          c.create);
router.put('/:id',        c.update);
router.delete('/:id',     c.remove);

module.exports = router;
