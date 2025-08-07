import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.chatId)) {
      return NextResponse.json({ message: "Invalid chat ID" }, { status: 400 });
    }

    const chatId = new mongoose.Types.ObjectId(params.chatId);

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(session.user?.email)) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    const messages = await Message.find({ chatId: chatId })
      .sort({ timestamp: 1 })
      .limit(100);

    const messagesWithStringIds = messages.map((msg) => ({
      ...msg.toObject(),
      _id: msg._id.toString(),
      chatId: msg.chatId.toString(),
    }));

    return NextResponse.json({ messages: messagesWithStringIds });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content, type, fileName } = await request.json();

    if (!content || !type) {
      return NextResponse.json(
        { message: "Content and type are required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.chatId)) {
      return NextResponse.json({ message: "Invalid chat ID" }, { status: 400 });
    }

    const chatId = new mongoose.Types.ObjectId(params.chatId);

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(session.user?.email)) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Create message
    const message = await Message.create({
      chatId: chatId,
      senderEmail: session.user?.email,
      senderName: session.user?.name,
      content,
      type,
      fileName,
      timestamp: new Date(),
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageTime: message.timestamp,
    });

    const messageResponse = {
      ...message.toObject(),
      _id: message._id.toString(),
      chatId: message.chatId.toString(),
    };

    return NextResponse.json({
      message: "Message sent successfully",
      messageData: messageResponse,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
