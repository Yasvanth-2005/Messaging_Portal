"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { signOut } from "next-auth/react"
import { LogOut, UserIcon } from 'lucide-react'
import { User } from "@/types"
import { io, Socket } from "socket.io-client"

interface UserListProps {
  users: User[]
  currentUser: any
  selectedUser: User | null
  onSelectUser: (user: User) => void
  onUserUpdate: () => void
  onShowProfile: () => void
}

export default function UserList({ 
  users, 
  currentUser, 
  selectedUser, 
  onSelectUser, 
  onUserUpdate,
  onShowProfile 
}: UserListProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")
    
    socketInstance.on("connect", () => {
      socketInstance.emit("join", currentUser.id)
    })

    socketInstance.on("userJoined", (userId: string) => {
      setOnlineUsers(prev => new Set([...prev, userId]))
    })

    socketInstance.on("userLeft", (userId: string) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    })

    socketInstance.on("newUserSignup", () => {
      onUserUpdate()
    })

    socketInstance.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(new Set(users))
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [currentUser.id, onUserUpdate])

  const filteredUsers = users.filter(user => user.email !== currentUser.email)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={currentUser.image || "/placeholder.svg"} />
            <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{currentUser.name}</h2>
            <p className="text-sm text-gray-500">Alpha Chat</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button size="icon" variant="outline" onClick={onShowProfile}>
            <UserIcon className="w-4 h-4" />
          </Button>
          
          <Button size="icon" variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Online Users ({onlineUsers.size})</h3>
          </div>
          {filteredUsers.map((user) => {
            const isOnline = onlineUsers.has(user._id)
            return (
              <div
                key={user._id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                  selectedUser?._id === user._id ? "bg-blue-50 border border-blue-200" : ""
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.image || "/placeholder.svg"} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
