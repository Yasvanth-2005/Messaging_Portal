"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Download } from "lucide-react";

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
  fileType: string;
}

export default function FilePreview({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FilePreviewProps) {
  const isImage = fileType.startsWith("image");
  const isVideo = fileType.startsWith("video");

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "download";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{fileName || "File Preview"}</DialogTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center p-4">
          {isImage && (
            <img
              src={fileUrl || "/placeholder.svg"}
              alt={fileName || "Preview"}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
          )}

          {isVideo && (
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              preload="metadata"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
