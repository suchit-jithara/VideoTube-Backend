import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { CLOUDINARY_FOLDER_NAME } from "../constants.js";
import { ApiError } from './ApiError.js';

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
      resource_type: 'auto',
      folder: CLOUDINARY_FOLDER_NAME // Save files in the 'VideoTube' folder
    });
    console.log("File upload on cloudinary Successfully :: ", upload.url);
    console.log(upload);
    fs.unlinkSync(filepath);
    return upload;
  } catch (error) {
    console.log("File Upload ERROR :: ", error);
    fs.unlinkSync(filepath);
    return null;
  }
}

const deleteFileFromCloudinary = async (fileUrlAtCloudinary) => {
  try {
    let fileNameAtCloudinary = fileUrlAtCloudinary.match(/\/([^\/]+)\.[a-z0-9]+$/i)[1];
    if (!fileNameAtCloudinary) throw null;

    const deleteResource = await cloudinary.api
      .delete_resources(
        [`${CLOUDINARY_FOLDER_NAME}/${fileNameAtCloudinary}`]
      )
    // console.log(cloudinary.uploader);

    // we can also delete a single resoure using destroy  method, where abover method is use for delete multiple file at one go.
    // const deleteResource = await cloudinary.uploader.destroy(fileNameAtCloudinary)

    return deleteResource;
  } catch (error) {
    console.log("File Delete ERROR :: ", error);
    return null;
  }
}

export { uploadFileOnCloudinary, deleteFileFromCloudinary };