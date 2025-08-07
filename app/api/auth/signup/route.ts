import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { io } from "socket.io-client"

export async function POST(request: NextRequest) {
  try {
    const { name, email, mobile, password } = await request.json()

    if (!name || !email || !mobile || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or mobile number already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      provider: "credentials",
    })

    // Notify all connected clients about new user signup
    try {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
      socket.emit("newUserSignup", { userId: user._id, name: user.name })
      socket.disconnect()
    } catch (socketError) {
      console.log("Socket notification failed:", socketError)
      // Don't fail the signup if socket notification fails
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user._id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
