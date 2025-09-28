const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
    fs.unlinkSync(localFilePath); // remove local file after upload
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

// Delete function
const deleteFromCloudinary = async (public_id) => {
  try {
    if (!public_id) return;
    return await cloudinary.uploader.destroy(public_id);
  } catch {
    return null;
  }
};


module.exports = { uploadOnCloudinary, deleteFromCloudinary };
