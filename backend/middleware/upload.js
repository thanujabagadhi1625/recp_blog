const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer (files stored in memory before uploading to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file, cb) {
  const allowed = /jpeg|jpg|png|gif|mp4|mov|webm|mkv/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error('Unsupported file type. Use image or video files only.'));
}

// Middleware to upload file to Cloudinary
const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const fileType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
  
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: fileType,
      folder: 'recp-app',
    },
    (error, result) => {
      if (error) {
        return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
      }
      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      next();
    }
  );

  uploadStream.end(req.file.buffer);
};

module.exports = { upload, uploadToCloudinary };
