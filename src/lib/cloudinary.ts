import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Generate a signed upload signature for direct client-side uploads.
 */
export function generateUploadSignature(folder: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    upload_preset: "trip_buddy",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

/**
 * Get an optimized Cloudinary URL for thumbnails.
 */
export function getOptimizedUrl(
  url: string,
  options: { width?: number; height?: number; quality?: string } = {}
): string {
  const { width = 400, quality = "auto" } = options;
  if (!url || !url.includes("cloudinary")) return url;

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_${quality},w_${width},c_limit/`
  );
}
