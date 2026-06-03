const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ctrl.list);
router.get('/next-code', ctrl.nextCode);  // must be before /:id
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
