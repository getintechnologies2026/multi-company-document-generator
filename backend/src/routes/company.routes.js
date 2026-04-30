const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/company.controller');
const { verifyToken } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

router.use(verifyToken);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', upload.fields([{ name: 'logo' }, { name: 'signature' }, { name: 'stamp' }]), ctrl.create);
router.put('/:id', upload.fields([{ name: 'logo' }, { name: 'signature' }, { name: 'stamp' }]), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
