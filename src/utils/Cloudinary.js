import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadFileOnCloudinary = async (filepath) => {
  try {
    if (!filepath) return null;
    const upload = await cloudinary.uploader.upload(filepath, {
      resource_type: 'auto'
    });
    console.log("File upload on cloudinary Successfully :: ", upload.url);
    console.log(upload);
    fs.unlink(filepath);
    return upload;
  } catch (error) {
    console.log("File Upload ERROR :: ", error);
    fs.unlink(filepath);
    return null;
  }
}

export { uploadFileOnCloudinary };