import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },
    fileName: {
      type: String,
    },
    readBy: [
      {
        userEmail: String,
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ chatId: 1, timestamp: 1 });
MessageSchema.index({ senderEmail: 1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
