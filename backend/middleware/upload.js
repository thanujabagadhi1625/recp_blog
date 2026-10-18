const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../config/env');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const IMAGE_MIME_TO_EXT = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
};

const VIDEO_MIME_TO_EXT = {
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
};

const ATTACHMENT_MIME_TO_EXT = {
  ...IMAGE_MIME_TO_EXT,
  ...VIDEO_MIME_TO_EXT,
};

function fileFilter(allowedMap) {
  return function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const allowedExts = allowedMap[file.mimetype];

    if (allowedExts && allowedExts.includes(ext)) {
      return cb(null, true);
    }

    return cb(new Error('Unsupported file type.'));
  };
}

const uploadRecipeCover = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(IMAGE_MIME_TO_EXT),
});

const uploadAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter(ATTACHMENT_MIME_TO_EXT),
});

const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !ATTACHMENT_MIME_TO_EXT[detected.mime]) {
      return res.status(400).json({ message: 'Invalid file content: file type mismatch' });
    }

    const fileType = detected.mime.startsWith('image') ? 'image' : 'video';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: fileType,
        folder: 'recp-app',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Upload processing failed' });
        }
        req.file.cloudinaryUrl = result.secure_url;
        req.file.cloudinaryPublicId = result.public_id;
        next();
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('File validation error:', err);
    return res.status(400).json({ message: 'File validation failed' });
  }
};

module.exports = {
  uploadRecipeCover,
  uploadAttachment,
  uploadToCloudinary,
};
