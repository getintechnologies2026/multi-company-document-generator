const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/company.controller');
const { verifyToken } = require('../middleware/auth');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const safeName = Date.now() + '-' + Math.random().toString(36).slice(2) + ext;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 3 } });

router.use(verifyToken);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', upload.fields([{ name: 'logo' }, { name: 'signature' }, { name: 'stamp' }]), ctrl.create);
router.put('/:id', upload.fields([{ name: 'logo' }, { name: 'signature' }, { name: 'stamp' }]), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
