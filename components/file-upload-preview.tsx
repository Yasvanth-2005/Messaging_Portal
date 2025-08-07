"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Send, Paperclip, Image, Video } from "lucide-react";

interface FileUploadPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (
    fileUrl: string,
    fileName: string,
    fileType: string,
    message?: string
  ) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

export default function FileUploadPreview({
  isOpen,
  onClose,
  onSend,
  isUploading,
  setIsUploading,
}: FileUploadPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "video/mp4",
      "video/webm",
      "video/mov",
      "video/avi",
      "video/mkv",
      "video/wmv",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only images and videos are allowed");
      return;
    }

    const maxSize = file.type.startsWith("image/")
      ? 10 * 1024 * 1024
      : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        `File too large. Max size: ${
          file.type.startsWith("image/") ? "10MB" : "100MB"
        }`
      );
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploadProgress(10);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (response.ok) {
        const data = await response.json();
        setUploadProgress(100);

        onSend(data.fileUrl, selectedFile.name, selectedFile.type, message);
        handleClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Error uploading file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setMessage("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const isVideo = selectedFile?.type.startsWith("video/");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Share Media</DialogTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClose}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Image className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Video className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Select Image or Video
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Choose an image (max 10MB) or video (max 100MB) to share
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff,video/mp4,video/webm,video/mov,video/avi,video/mkv,video/wmv"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {isImage ? (
                      <Image className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Video className="w-5 h-5 text-purple-600" />
                    )}
                    <span className="font-medium truncate">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex justify-center">
                  {isImage && (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full max-h-64 object-contain rounded-lg"
                    />
                  )}

                  {isVideo && (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full max-h-64 rounded-lg"
                      preload="metadata"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Add a message (optional)
                </label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isUploading}
                />
              </div>

              {isUploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Change File
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isUploading}
                  className="min-w-[100px]"
                >
                  {isUploading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
