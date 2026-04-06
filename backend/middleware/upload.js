const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/misc';
    if (req.uploadType === 'product') folder = 'uploads/products';
    else if (req.uploadType === 'logo') folder = 'uploads/logos';
    else if (req.uploadType === 'banner') folder = 'uploads/banners';
    const fullPath = path.join(__dirname, '..', folder);
    ensureDir(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const setUploadType = (type) => (req, res, next) => { req.uploadType = type; next(); };

const getFileUrl = (req, file) => {
  if (!file) return null;
  const relativePath = file.path.split(/uploads[/\\]/)[1];
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
};

module.exports = { upload, setUploadType, getFileUrl };
