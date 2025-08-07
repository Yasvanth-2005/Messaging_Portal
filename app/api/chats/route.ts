import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/lib/mongodb"
import Chat from "@/models/Chat"
import User from "@/models/User"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find all chats where current user is a participant (using email as identifier)
    const chats = await Chat.find({
      participants: session.user.email
    })
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 })

    // Get participant details for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        // Filter out current user from participants
        const otherParticipantEmails = chat.participants.filter(email => 
          email !== session.user.email
        )
        
        const participantDetails = await User.find({
          email: { $in: otherParticipantEmails }
        }, { password: 0 })

        return {
          ...chat.toObject(),
          _id: chat._id.toString(),
          participantDetails: participantDetails.map(p => ({
            ...p.toObject(),
            _id: p._id.toString()
          }))
        }
      })
    )

    return NextResponse.json({ chats: chatsWithDetails })
  } catch (error) {
    console.error("Get chats error:", error)
    return NextResponse.json({ chats: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { participantEmail } = await request.json()

    if (!participantEmail) {
      return NextResponse.json(
        { message: "Participant email is required" },
        { status: 400 }
      )
    }

    // Prevent self-chat
    if (participantEmail === session.user.email) {
      return NextResponse.json(
        { message: "Cannot create chat with yourself" },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if the other user exists
    const otherUser = await User.findOne({ email: participantEmail }, { password: 0 })
    if (!otherUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // Check if chat already exists between these users
    const existingChat = await Chat.findOne({
      $and: [
        { participants: { $all: [session.user.email, participantEmail] } },
        { participants: { $size: 2 } },
        { type: "direct" }
      ]
    }).populate('lastMessage')

    if (existingChat) {
      console.log("Found existing chat:", existingChat._id)
      return NextResponse.json({ 
        chat: {
          ...existingChat.toObject(),
          _id: existingChat._id.toString(),
          participantDetails: [otherUser].map(p => ({
            ...p.toObject(),
            _id: p._id.toString()
          }))
        }
      })
    }

    // Create new chat
    const newChat = await Chat.create({
      participants: [session.user.email, participantEmail],
      type: "direct"
    })

    console.log("Created new chat:", newChat._id)

    const chatWithDetails = {
      ...newChat.toObject(),
      _id: newChat._id.toString(),
      participantDetails: [otherUser].map(p => ({
        ...p.toObject(),
        _id: p._id.toString()
      }))
    }

    return NextResponse.json({ chat: chatWithDetails })
  } catch (error) {
    console.error("Create chat error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
