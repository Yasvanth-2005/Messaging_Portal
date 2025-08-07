export interface User {
  _id: string
  name: string
  email: string
  mobile?: string
  image?: string
  provider: "credentials" | "google"
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  chatId: string
  senderEmail: string
  senderName: string
  content: string
  type: "text" | "image" | "video" | "file"
  fileName?: string
  readBy: Array<{
    userEmail: string
    readAt: string
  }>
  timestamp: string
  createdAt: string
  updatedAt: string
}

export interface Chat {
  _id: string
  participants: string[] // Array of user emails
  participantDetails?: User[]
  lastMessage?: Message
  lastMessageTime: string
  type: "direct" | "group"
  name?: string
  createdAt: string
  updatedAt: string
}
