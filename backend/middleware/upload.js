const multer = require('multer');
const path = require('path');

// Storage configuration for uploaded files
const storage = multer.diskStorage({
  // 1. Destination: Files kahan save honge
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure karein ki backend root folder mein 'uploads' naam ka folder ho
  },
  
  // 2. Filename: Unique name generate karna taaki original files overwrite na hon
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter: Sirf image files allow karne ke liye
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, jpg, etc.) are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Maximum 5MB limit
});

module.exports = upload;