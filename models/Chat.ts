import mongoose from "mongoose"

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: String, // Using email as participant identifier
    required: true,
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageTime: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["direct", "group"],
    default: "direct",
  },
  name: {
    type: String, // For group chats
  },
}, {
  timestamps: true,
})

// Index for efficient queries
ChatSchema.index({ participants: 1 })
ChatSchema.index({ lastMessageTime: -1 })

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema)
