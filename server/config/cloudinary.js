import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  secure: true,
});

console.log("Institutional Asset Gateway Configured:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key_prefix: process.env.CLOUDINARY_API_KEY?.slice(0, 4),
  has_secret: !!process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Define the folder and transformation based on file type
    const fileType = file.mimetype.split('/')[0];
    let folder = 'lms_uploads';
    let resource_type = 'auto';

    if (fileType === 'image') {
      folder = 'lms_images';
      resource_type = 'image';
    } else if (fileType === 'video') {
      folder = 'lms_videos';
      resource_type = 'video';
    } else {
      folder = 'lms_docs';
      resource_type = 'raw';
    }

    return {
      folder: folder,
      resource_type: resource_type,
      format: fileType === 'image' ? 'webp' : undefined, // Auto-convert images to optimized webp
      allowed_formats: fileType === 'image' ? ['jpg', 'png', 'jpeg', 'gif', 'webp'] : undefined,
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9]/g, '_')}`,
      transformation: fileType === 'image' ? [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] : undefined
    };
  },
});

export const verifyCloudinaryConfig = () => {
  const config = cloudinary.config();
  const isMissing = !config.cloud_name || !config.api_key || !config.api_secret || config.api_secret === '';
  if (isMissing) {
    console.error("CRITICAL: Cloudinary Config is missing or invalid in this environment.");
  }
  return {
    isConfigured: !isMissing,
    cloud_name: config.cloud_name
  };
};

export { cloudinary, storage };
