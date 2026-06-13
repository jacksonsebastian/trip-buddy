"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon, Film } from "lucide-react";

interface FileUploadProps {
  onUpload: (url: string, publicId: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
  preview?: string;
}

export default function FileUpload({
  onUpload,
  folder = "trip-buddy",
  accept = "image/*,video/*",
  label = "Upload File",
  preview: initialPreview,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max for free tier)
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be less than 10MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Get signature from our API
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });

      if (!sigRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, timestamp, cloudName, apiKey, folder: uploadFolder } =
        await sigRes.json();

      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("folder", uploadFolder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const data = await uploadRes.json();
      setPreview(data.secure_url);
      onUpload(data.secure_url, data.public_id);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please check your Cloudinary configuration.");
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {preview ? (
        <div className="relative inline-block">
          {preview.match(/\.(mp4|webm|mov)/i) ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="h-24 w-24 rounded-xl object-cover"
            />
          )}
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white text-xs"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg border border-dashed border-input bg-background/50 px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {label}
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
