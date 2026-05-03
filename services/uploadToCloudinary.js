const fs = require("fs/promises");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (tempFilePath, options = {}) => {
    let result;

    try {
        result = await cloudinary.uploader.upload(tempFilePath, {
            folder: "profile-pictures",
            resource_type: "image",
            ...options,
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } finally {
        if (tempFilePath) {
            await fs.unlink(tempFilePath).catch(() => {});
        }
    }
};

module.exports = uploadToCloudinary;
