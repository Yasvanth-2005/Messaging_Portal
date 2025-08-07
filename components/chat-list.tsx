"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signOut } from "next-auth/react";
import { LogOut, UserIcon, Plus, MessageCircle } from "lucide-react";
import { User, Chat } from "@/types";
import { Socket } from "socket.io-client";

interface ChatListProps {
  chats: Chat[];
  users: User[];
  currentUser: any;
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onCreateChat: (userEmail: string) => void;
  onShowProfile: () => void;
  onlineUsers: Set<string>;
  socket: Socket | null;
}

export default function ChatList({
  chats,
  users,
  currentUser,
  selectedChat,
  onSelectChat,
  onCreateChat,
  onShowProfile,
  onlineUsers,
  socket,
}: ChatListProps) {
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [localOnlineUsers, setLocalOnlineUsers] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setLocalOnlineUsers(onlineUsers);
  }, [onlineUsers]);

  useEffect(() => {
    if (socket) {
      const handleUserJoined = (userEmail: string) => {
        setLocalOnlineUsers((prev) => new Set([...prev, userEmail]));
      };

      const handleUserLeft = (userEmail: string) => {
        setLocalOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userEmail);
          return newSet;
        });
      };

      const handleOnlineUsers = (userEmails: string[]) => {
        setLocalOnlineUsers(new Set(userEmails));
      };

      socket.on("userJoined", handleUserJoined);
      socket.on("userLeft", handleUserLeft);
      socket.on("onlineUsers", handleOnlineUsers);

      return () => {
        socket.off("userJoined", handleUserJoined);
        socket.off("userLeft", handleUserLeft);
        socket.off("onlineUsers", handleOnlineUsers);
      };
    }
  }, [socket]);

  // Filter out current user from the users list
  const filteredUsers = users.filter(
    (user) => user.email !== currentUser.email
  );

  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.type === "group") {
      return {
        name: chat.name || "Group Chat",
        image: "/placeholder.svg",
        isOnline: false,
        userEmail: null,
      };
    }

    // For direct chats, find the other participant
    const otherParticipant = chat.participantDetails?.find(
      (p) => p.email !== currentUser.email
    );
    if (otherParticipant) {
      const isOnline = localOnlineUsers.has(otherParticipant.email);
      return {
        name: otherParticipant.name,
        image: otherParticipant.image || "/placeholder.svg",
        isOnline: isOnline,
        userEmail: otherParticipant.email,
      };
    }

    return {
      name: "Unknown User",
      image: "/placeholder.svg",
      isOnline: false,
      userEmail: null,
    };
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleCreateChat = async (userEmail: string) => {
    if (userEmail === currentUser.email) {
      return;
    }

    // Check if chat already exists
    const existingChat = chats.find(
      (chat) =>
        chat.type === "direct" &&
        chat.participantDetails?.some((p) => p.email === userEmail)
    );

    if (existingChat) {
      onSelectChat(existingChat);
      setShowNewChatDialog(false);
      return;
    }

    try {
      await onCreateChat(userEmail);
      setShowNewChatDialog(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src={currentUser.image || "/placeholder.svg"} />
              <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
            </Avatar>
            {localOnlineUsers.has(currentUser.email) && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h2 className="font-medium">{currentUser.name}</h2>
            <p className="text-sm text-gray-500">Alpha Chat</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Chat</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No other users available</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isOnline = localOnlineUsers.has(user.email);
                      const hasExistingChat = chats.some(
                        (chat) =>
                          chat.type === "direct" &&
                          chat.participantDetails?.some(
                            (p) => p.email === user.email
                          )
                      );

                      return (
                        <div
                          key={user._id}
                          className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleCreateChat(user.email)}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarImage
                                src={user.image || "/placeholder.svg"}
                              />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {hasExistingChat
                                ? "Continue chat"
                                : isOnline
                                ? "Online"
                                : "Offline"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button size="icon" variant="outline" onClick={onShowProfile}>
            <UserIcon className="w-4 h-4" />
          </Button>

          <Button size="icon" variant="outline" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Online Users Count */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <p className="text-sm text-gray-600">
          Online Users: {localOnlineUsers.size}
        </p>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Recent Chats ({chats.length})
            </h3>
          </div>

          {chats.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No chats yet</p>
              <p className="text-sm text-gray-400">
                Start a conversation with someone!
              </p>
            </div>
          ) : (
            chats.map((chat) => {
              const displayInfo = getChatDisplayInfo(chat);
              return (
                <div
                  key={chat._id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedChat?._id === chat._id
                      ? "bg-blue-50 border border-blue-200"
                      : ""
                  }`}
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage
                        src={displayInfo.image || "/placeholder.svg"}
                      />
                      <AvatarFallback>{displayInfo.name[0]}</AvatarFallback>
                    </Avatar>
                    {displayInfo.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium truncate">{displayInfo.name}</p>
                      {chat.lastMessageTime && (
                        <p className="text-xs text-gray-500">
                          {formatLastMessageTime(chat.lastMessageTime)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500 truncate flex-1">
                        {chat.lastMessage?.content.startsWith("http")
                          ? "Media File"
                          : chat.lastMessage?.content || "No messages yet"}
                      </p>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          displayInfo.isOnline ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
