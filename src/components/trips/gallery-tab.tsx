"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import JSZip from 'jszip';
import { Download, Search, X, ImageIcon, Film, User, Plus, Loader2, UploadCloud, AlertCircle } from "lucide-react";

interface GalleryTabProps {
  trip: any;
  currentMemberId: string;
}

export default function GalleryTab({ trip, currentMemberId }: GalleryTabProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, preview: string, type: "IMAGE"|"VIDEO"}[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedGalleryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownloadSelected = async (downloadAll = false) => {
    try {
      setDownloadingZip(true);
      const itemsToDownload = downloadAll 
        ? filtered 
        : filtered.filter((item: any) => selectedGalleryIds.includes(item.id));
        
      if (itemsToDownload.length === 0) return;

      const zip = new JSZip();
      const folder = zip.folder("trip_gallery");

      for (const item of itemsToDownload) {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          
          let ext = item.type === "VIDEO" ? ".mp4" : ".jpg";
          let filename = item.url.split('/').pop()?.split('?')[0];
          if (!filename || !filename.includes('.')) {
            filename = `${item.id}${ext}`;
          }
          folder?.file(filename, blob);
        } catch (err) {
          console.error("Failed to fetch image for zip", item.url, err);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trip_${trip.name?.replace(/\s+/g, '_') || 'buddy'}_gallery.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsSelectionMode(false);
      setSelectedGalleryIds([]);
    } catch (error) {
      console.error("Error creating zip:", error);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    const files = Array.from(e.target.files || []);
    const validFiles: {file: File, preview: string, type: "IMAGE"|"VIDEO"}[] = [];
    let hasError = false;

    files.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; 
      
      if (file.size > maxSize) {
        hasError = true;
        setErrorMsg(`Some files were too large. Max: 10MB for images, 100MB for videos.`);
      } else {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          type: isVideo ? "VIDEO" : "IMAGE"
        });
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrorMsg("");
    setUploadProgress(0);

    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "trip_buddy/gallery" }),
      });
      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

      for (let i = 0; i < selectedFiles.length; i++) {
        const { file, type } = selectedFiles[i];
        
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("api_key", apiKey);
        uploadData.append("timestamp", timestamp);
        uploadData.append("signature", signature);
        uploadData.append("folder", folder);

        const resourceType = type === "VIDEO" ? "video" : "image";
        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { method: "POST", body: uploadData }
        );
        const cloudinaryData = await cloudinaryRes.json();

        if (!cloudinaryData.secure_url) {
          console.error("Upload failed for", file.name);
          continue;
        }

        await fetch(`/api/trips/${trip.id}/gallery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cloudinaryData.secure_url, caption: "", type }),
        });
        
        setUploadProgress(i + 1);
      }

      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
      setShowUpload(false);
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMsg("An error occurred during upload.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const filtered = trip.gallery.filter((item: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.caption?.toLowerCase().includes(q) ||
      item.uploadedBy?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold flex-shrink-0">
          Gallery ({trip.gallery.length})
        </h3>
        
        <div className="flex items-center gap-2">
          {!isSelectionMode ? (
            <>
              <button 
                onClick={() => setIsSelectionMode(true)}
                className="text-sm font-medium hover:underline text-muted-foreground mr-2"
              >
                Select
              </button>
              <button
                onClick={() => handleDownloadSelected(true)}
                disabled={downloadingZip || filtered.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                title="Download All"
              >
                {downloadingZip && !selectedGalleryIds.length ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">Download All</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedGalleryIds([]); }}
                className="text-sm font-medium hover:underline text-muted-foreground mr-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownloadSelected(false)}
                disabled={downloadingZip || selectedGalleryIds.length === 0}
                className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-sm font-medium text-white shadow-md disabled:opacity-50"
              >
                {downloadingZip && selectedGalleryIds.length ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">Download ({selectedGalleryIds.length})</span>
                <span className="sm:hidden">({selectedGalleryIds.length})</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showUpload ? "Cancel" : "Upload"}
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="glass rounded-xl p-4 sm:p-6 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="space-y-4">
            <input
              type="file"
              id="gallery-upload"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />

            <div className="flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
              <UploadCloud className="h-10 w-10 text-primary mb-3" />
              <p className="text-base sm:text-lg font-semibold text-foreground mb-1">Select Images & Videos</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 text-center">
                Max file size: 10MB images, 100MB videos
              </p>
              <label 
                htmlFor="gallery-upload"
                className="cursor-pointer rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                Browse Files
              </label>
            </div>

            {errorMsg && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {selectedFiles.length} file(s) selected
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-black/5 border border-border">
                      {f.type === "IMAGE" ? (
                        <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <video src={f.preview} className="w-full h-full object-cover" />
                      )}
                      
                      {!uploading && (
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:scale-110 active:scale-95"
                          title="Remove file"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      
                      {f.type === "VIDEO" && (
                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md text-[10px] text-white font-medium flex items-center gap-1.5 backdrop-blur-md">
                          <Film className="h-3 w-3" /> Video
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full sm:w-auto rounded-xl gradient-primary px-8 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60 transition-all hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading {uploadProgress} of {selectedFiles.length}...
                      </span>
                    ) : (
                      `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground">
            {search ? "No results found." : "No photos or videos yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item: any) => {
            const isSelected = selectedGalleryIds.includes(item.id);
            return (
            <button
              key={item.id}
              onClick={() => {
                if (isSelectionMode) toggleSelection(item.id);
                else setSelectedItem(item);
              }}
              className={`group relative aspect-square overflow-hidden rounded-xl bg-muted ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              {item.type === "VIDEO" ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-violet-500/20">
                  <Film className="h-8 w-8 text-primary/50" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || "Gallery image"}
                  className={`h-full w-full object-cover transition-transform ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                  loading="lazy"
                />
              )}
              
              {isSelectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={`h-5 w-5 rounded border ${isSelected ? 'bg-primary border-primary' : 'bg-black/20 border-white/50 backdrop-blur-md'} flex items-center justify-center transition-colors`}>
                    {isSelected && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              )}

              <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity ${isSelected || isSelectionMode ? 'opacity-100' : 'group-hover:opacity-100'}`} />
              <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white font-medium truncate">
                  {item.caption || "Untitled"}
                </p>
                <p className="text-[10px] text-white/70">
                  {item.uploadedBy?.name}
                </p>
              </div>
              {item.type === "VIDEO" && (
                <div className="absolute top-2 right-2">
                  <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    Video
                  </span>
                </div>
              )}
            </button>
          )})}
        </div>
      )}

      {/* Lightbox Preview */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-background">
            <div className="relative aspect-video bg-black">
              {selectedItem.type === "VIDEO" ? (
                <video
                  src={selectedItem.url}
                  controls
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.caption || "Gallery image"}
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedItem.caption || "Untitled"}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {selectedItem.uploadedBy?.name} • {formatDate(selectedItem.createdAt)}
                  </div>
                </div>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
