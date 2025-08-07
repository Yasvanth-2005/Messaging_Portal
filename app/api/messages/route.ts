import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/lib/mongodb"
import Message from "@/models/Message"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 })
    }

    await connectDB()

    const messages = await Message.find({
      $or: [
        { senderId: session.user.id, receiverId: userId },
        { senderId: userId, receiverId: session.user.id }
      ]
    }).sort({ timestamp: 1 })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { senderId, receiverId, content, type, fileName } = await request.json()

    if (!senderId || !receiverId || !content || !type) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      )
    }

    await connectDB()

    const message = await Message.create({
      senderId,
      receiverId,
      content,
      type,
      fileName,
      timestamp: new Date()
    })

    return NextResponse.json({ message: "Message sent successfully", messageId: message._id })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
