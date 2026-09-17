const cloudinary = require("cloudinary").v2;

const requiredEnvVariables = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingEnvVariables = requiredEnvVariables.filter(
  (variable) => !process.env[variable]
);

if (missingEnvVariables.length > 0) {
  throw new Error(
    `Missing Cloudinary environment variables: ${missingEnvVariables.join(", ")}`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;