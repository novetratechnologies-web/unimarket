import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ============================================
// AWS S3 CONFIGURATION
// ============================================

let s3Client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}

// ============================================
// UPLOAD CONFIGURATION
// ============================================

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm'
];

const ALLOWED_ALL_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES
];

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB
  document: parseInt(process.env.MAX_DOCUMENT_SIZE) || 10 * 1024 * 1024, // 10MB
  video: parseInt(process.env.MAX_VIDEO_SIZE) || 100 * 1024 * 1024, // 100MB
  default: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
};

// ============================================
// CUSTOM STORAGE ENGINE
// ============================================

/**
 * Custom storage engine for local uploads
 */
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../uploads');
    
    // Organize by file type
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      uploadPath = path.join(uploadPath, 'images');
    } else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      uploadPath = path.join(uploadPath, 'documents');
    } else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      uploadPath = path.join(uploadPath, 'videos');
    } else {
      uploadPath = path.join(uploadPath, 'others');
    }

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || mime.extension(file.mimetype) || '';
    const filename = `${Date.now()}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// ============================================
// FILE FILTERS
// ============================================

/**
 * Filter for image files only
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

/**
 * Filter for document files only
 */
const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed!'), false);
  }
};

/**
 * Filter for video files only
 */
const videoFileFilter = (req, file, cb) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

/**
 * Generic file filter for allowed types
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_ALL_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed!'), false);
  }
};

// ============================================
// MULTER UPLOAD INSTANCES
// ============================================

/**
 * Local upload for images
 */
const uploadImage = multer({
  storage: localStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 10
  }
});

/**
 * Local upload for documents
 */
const uploadDocument = multer({
  storage: localStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 5
  }
});

/**
 * Local upload for videos
 */
const uploadVideo = multer({
  storage: localStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video,
    files: 3
  }
});

/**
 * Generic local upload
 */
const upload = multer({
  storage: localStorage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.default,
    files: 10
  }
});

/**
 * Memory storage for cloud uploads
 */
const memoryStorage = multer.memoryStorage();

const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.default,
    files: 10
  }
});

// ============================================
// IMAGE PROCESSING UTILITIES
// ============================================

/**
 * Optimize image using Sharp
 */
const optimizeImage = async (buffer, options = {}) => {
  try {
    const {
      width,
      height,
      fit = 'cover',
      format = 'webp',
      quality = 80,
      progressive = true
    } = options;

    let sharpInstance = sharp(buffer);

    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit,
        withoutEnlargement: true
      });
    }

    // Convert format
    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality, progressive });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality, progressive });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality });
        break;
    }

    const optimizedBuffer = await sharpInstance.toBuffer();
    
    return {
      buffer: optimizedBuffer,
      format,
      size: optimizedBuffer.length,
      width: options.width,
      height: options.height
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
};

/**
 * Generate image thumbnails
 */
const generateThumbnails = async (buffer) => {
  try {
    const thumbnails = {
      small: await optimizeImage(buffer, { width: 150, height: 150, fit: 'cover' }),
      medium: await optimizeImage(buffer, { width: 300, height: 300, fit: 'cover' }),
      large: await optimizeImage(buffer, { width: 600, height: 600, fit: 'inside' })
    };

    return thumbnails;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnails');
  }
};

/**
 * Extract image metadata
 */
const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      space: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return null;
  }
};

// ============================================
// CLOUDINARY UPLOAD UTILITIES
// ============================================

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = async (file, folder = 'uploads', options = {}) => {
  try {
    const {
      public_id,
      transformation = [],
      eager = [],
      tags = [],
      context = {},
      resource_type = 'auto'
    } = options;

    // Check if file is buffer or path
    let fileToUpload;
    if (file.buffer) {
      fileToUpload = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    } else if (file.path) {
      fileToUpload = file.path;
    } else {
      fileToUpload = file;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileToUpload, {
      folder,
      public_id,
      transformation,
      eager,
      tags,
      context,
      resource_type,
      allowed_formats: ['jpg', 'png', 'gif', 'webp', 'pdf', 'mp4'],
      eager_async: true,
      eager_notification_url: process.env.CLOUDINARY_WEBHOOK_URL
    });

    // Generate different sizes
    const eagerResults = result.eager || [];

    return {
      url: result.secure_url,
      public_id: result.public_id,
      version: result.version,
      signature: result.signature,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      created_at: result.created_at,
      eager: eagerResults.map(e => ({
        url: e.secure_url,
        width: e.width,
        height: e.height,
        format: e.format
      }))
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete from Cloudinary');
  }
};

/**
 * Bulk delete from Cloudinary
 */
const bulkDeleteFromCloudinary = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error);
    throw new Error('Failed to bulk delete from Cloudinary');
  }
};

/**
 * Get Cloudinary upload signature
 */
const getCloudinarySignature = (folder = 'uploads') => {
  const timestamp = Math.round((new Date()).getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    folder
  }, process.env.CLOUDINARY_API_SECRET);

  return {
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    folder
  };
};

// ============================================
// AWS S3 UPLOAD UTILITIES
// ============================================

/**
 * Upload file to S3
 */
const uploadToS3 = async (file, folder = 'uploads', options = {}) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not configured');
    }

    const {
      acl = 'public-read',
      cacheControl = 'max-age=31536000',
      metadata = {}
    } = options;

    const key = `${folder}/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: acl,
      CacheControl: cacheControl,
      Metadata: metadata
    });

    const result = await s3Client.send(command);

    return {
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      etag: result.ETag,
      versionId: result.VersionId
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload to S3');
  }
};

/**
 * Delete file from S3
 */
const deleteFromS3 = async (key) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete from S3');
  }
};

/**
 * Generate presigned URL for S3 upload
 */
const getS3PresignedUrl = async (filename, folder = 'uploads', expiresIn = 3600) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not configured');
    }

    const key = `${folder}/${Date.now()}-${crypto.randomBytes(16).toString('hex')}${path.extname(filename)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      url,
      key,
      bucket: process.env.AWS_BUCKET_NAME
    };
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

/**
 * Generate presigned URL for download
 */
const getS3DownloadUrl = async (key, expiresIn = 3600) => {
  try {
    if (!s3Client) {
      throw new Error('S3 client not configured');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 download URL error:', error);
    throw new Error('Failed to generate download URL');
  }
};

// ============================================
// LOCAL FILE MANAGEMENT
// ============================================

/**
 * Save file locally
 */
const saveLocally = async (file, customPath = null) => {
  try {
    const uploadPath = customPath || path.join(__dirname, '../../uploads');
    const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadPath, filename);

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });

    // Write file
    if (file.buffer) {
      fs.writeFileSync(filepath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, filepath);
      fs.unlinkSync(file.path); // Remove temp file
    }

    return {
      filename,
      path: filepath,
      url: `/uploads/${filename}`,
      size: file.size || fs.statSync(filepath).size
    };
  } catch (error) {
    console.error('Local save error:', error);
    throw new Error('Failed to save file locally');
  }
};

/**
 * Delete local file
 */
const deleteLocalFile = (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Local delete error:', error);
    return false;
  }
};

/**
 * Clean up old temporary files
 */
const cleanupTempFiles = (maxAge = 24 * 60 * 60 * 1000) => { // 24 hours default
  try {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    
    if (!fs.existsSync(tempDir)) {
      return 0;
    }

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach(file => {
      const filepath = path.join(tempDir, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    });

    return deletedCount;
  } catch (error) {
    console.error('Temp cleanup error:', error);
    return 0;
  }
};

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate file
 */
const validateFile = (file, options = {}) => {
  const {
    allowedTypes = ALLOWED_ALL_TYPES,
    maxSize = FILE_SIZE_LIMITS.default,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight
  } = options;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size ${file.size} exceeds maximum of ${maxSize}`);
  }

  // Check image dimensions (async)
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && (minWidth || maxWidth || minHeight || maxHeight)) {
    // This needs to be handled asynchronously
    return Promise.resolve().then(async () => {
      const buffer = file.buffer || fs.readFileSync(file.path);
      const metadata = await getImageMetadata(buffer);
      
      if (minWidth && metadata.width < minWidth) {
        errors.push(`Image width ${metadata.width} is less than minimum ${minWidth}`);
      }
      if (maxWidth && metadata.width > maxWidth) {
        errors.push(`Image width ${metadata.width} exceeds maximum ${maxWidth}`);
      }
      if (minHeight && metadata.height < minHeight) {
        errors.push(`Image height ${metadata.height} is less than minimum ${minHeight}`);
      }
      if (maxHeight && metadata.height > maxHeight) {
        errors.push(`Image height ${metadata.height} exceeds maximum ${maxHeight}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata
      };
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate multiple files
 */
const validateFiles = (files, options = {}) => {
  const results = {
    isValid: true,
    files: [],
    errors: []
  };

  if (!files || files.length === 0) {
    results.isValid = false;
    results.errors.push('No files provided');
    return results;
  }

  const {
    maxFiles = 10,
    ...fileOptions
  } = options;

  if (files.length > maxFiles) {
    results.isValid = false;
    results.errors.push(`Maximum ${maxFiles} files allowed`);
  }

  // Validate each file
  files.forEach((file, index) => {
    const validation = validateFile(file, fileOptions);
    
    if (!validation.isValid) {
      results.isValid = false;
      results.errors.push(`File ${index + 1}: ${validation.errors.join(', ')}`);
    }
    
    results.files.push({
      file,
      isValid: validation.isValid,
      errors: validation.errors,
      metadata: validation.metadata
    });
  });

  return results;
};

// ============================================
// FILE INFORMATION UTILITIES
// ============================================

/**
 * Get file information
 */
const getFileInfo = (file) => {
  return {
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    encoding: file.encoding,
    extension: path.extname(file.originalname).toLowerCase(),
    basename: path.basename(file.originalname, path.extname(file.originalname))
  };
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate unique filename
 */
const generateFilename = (originalname, prefix = '') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalname);
  return `${prefix}${timestamp}-${random}${ext}`;
};

// ============================================
// SMART UPLOAD - AUTO DETECT STORAGE
// ============================================

/**
 * Smart upload - automatically chooses storage based on configuration
 */
const smartUpload = async (file, folder = 'uploads', options = {}) => {
  const {
    useCloud = process.env.USE_CLOUD_STORAGE === 'true',
    generateThumbnails: shouldGenerateThumbnails = true,
    optimize = true,
    ...uploadOptions
  } = options;

  try {
    let result;
    let thumbnailUrls = null;

    // Optimize image if needed
    let processedFile = file;
    if (optimize && ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      const optimized = await optimizeImage(file.buffer || fs.readFileSync(file.path), uploadOptions);
      processedFile = {
        ...file,
        buffer: optimized.buffer,
        size: optimized.size
      };
    }

    // Generate thumbnails if requested
    if (shouldGenerateThumbnails && ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      const thumbnails = await generateThumbnails(processedFile.buffer || processedFile.path);
      thumbnailUrls = {};
      
      for (const [size, thumbnail] of Object.entries(thumbnails)) {
        if (useCloud && cloudinary) {
          const uploadResult = await uploadToCloudinary(
            { buffer: thumbnail.buffer, mimetype: `image/${thumbnail.format}` },
            `${folder}/thumbnails`,
            { ...uploadOptions, public_id: `${size}-${Date.now()}` }
          );
          thumbnailUrls[size] = uploadResult.url;
        } else {
          const saveResult = await saveLocally(
            { buffer: thumbnail.buffer, originalname: `${size}-${file.originalname}` },
            path.join('uploads', folder, 'thumbnails')
          );
          thumbnailUrls[size] = saveResult.url;
        }
      }
    }

    // Upload to appropriate storage
    if (useCloud) {
      if (cloudinary) {
        result = await uploadToCloudinary(processedFile, folder, uploadOptions);
      } else if (s3Client) {
        result = await uploadToS3(processedFile, folder, uploadOptions);
      } else {
        result = await saveLocally(processedFile, path.join('uploads', folder));
      }
    } else {
      result = await saveLocally(processedFile, path.join('uploads', folder));
    }

    return {
      ...result,
      thumbnails: thumbnailUrls,
      storage: useCloud ? (cloudinary ? 'cloudinary' : (s3Client ? 's3' : 'local')) : 'local'
    };
  } catch (error) {
    console.error('Smart upload error:', error);
    throw error;
  }
};

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handle multer errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        error: 'FILE_TOO_LARGE',
        maxSize: FILE_SIZE_LIMITS.default
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: 'TOO_MANY_FILES'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field',
        error: 'UNEXPECTED_FIELD'
      });
    }
  }

  if (error.message && error.message.includes('file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
};

/**
 * Category upload configuration - handles all category image fields
 */
const uploadCategoryImages = multer({
  storage: memoryStorage, // or localStorage depending on your needs
  fileFilter: imageFileFilter, // Only allow images
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 5 // Maximum 5 files total
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'iconImage', maxCount: 1 }  // Add this line for icon image uploads
]);

// ============================================
// EXPORT ALL FUNCTIONS (SINGLE EXPORT STATEMENT)
// ============================================

export {
  // Multer instances
  upload,
  uploadImage,
  uploadDocument,
  uploadVideo,
  uploadMemory,
  
  // File filters
  fileFilter,
  imageFileFilter,
  documentFileFilter,
  videoFileFilter,
  
  // Validation
  validateFile,
  validateFiles,
  
  // Image processing
  optimizeImage,
  generateThumbnails,
  getImageMetadata,
  
  // Cloudinary
  uploadToCloudinary,
  deleteFromCloudinary,
  bulkDeleteFromCloudinary,
  getCloudinarySignature,
  
  // S3
  uploadToS3,
  deleteFromS3,
  getS3PresignedUrl,
  getS3DownloadUrl,
  
  // Local
  saveLocally,
  deleteLocalFile,
  cleanupTempFiles,
  
  // Smart upload
  smartUpload,
  
  // Utilities
  getFileInfo,
  formatFileSize,
  generateFilename,
  handleUploadError,
  uploadCategoryImages,
  
  // Constants
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_ALL_TYPES,
  FILE_SIZE_LIMITS
};

