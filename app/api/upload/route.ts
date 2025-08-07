import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        {
          message: "Only images and videos are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = file.type.startsWith("image/")
      ? 10 * 1024 * 1024
      : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          message: `File too large. Max size: ${
            file.type.startsWith("image/") ? "10MB" : "100MB"
          }`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: file.type.startsWith("image/") ? "image" : "video",
            folder: "alpha-chat",
            transformation: file.type.startsWith("image/")
              ? [
                  {
                    width: 1200,
                    height: 1200,
                    crop: "limit",
                    quality: "auto:good",
                  },
                ]
              : [
                  {
                    width: 1280,
                    height: 720,
                    crop: "limit",
                    quality: "auto:good",
                  },
                ],
            format: file.type.startsWith("image/") ? "webp" : "mp4",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const result = uploadResponse as any;

    return NextResponse.json({
      fileUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
