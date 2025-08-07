"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip, MessageCircle, Play, Pause } from "lucide-react";
import { Socket } from "socket.io-client";
import { Message, Chat } from "@/types";
import FileUploadPreview from "./file-upload-preview";
import FilePreview from "./file-preview";

interface ChatInterfaceProps {
  currentUser: any;
  selectedChat: Chat | null;
  socket: Socket | null;
  onlineUsers: Set<string>;
  onMessageSent: () => void;
}

export default function ChatInterface({
  currentUser,
  selectedChat,
  socket,
  onlineUsers,
  onMessageSent,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [localOnlineUsers, setLocalOnlineUsers] = useState<Set<string>>(
    new Set()
  );
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    setLocalOnlineUsers(onlineUsers);
  }, [onlineUsers]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (messageData: Message) => {
        if (messageData.chatId === selectedChat?._id) {
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === messageData._id);
            return exists ? prev : [...prev, messageData];
          });
        }
      };

      const handleTyping = ({
        userEmail,
        chatId,
        isTyping: typing,
        userName,
      }: any) => {
        if (chatId === selectedChat?._id && userEmail !== currentUser.email) {
          setIsTyping(typing);
          setTypingUser(typing ? userName : null);
        }
      };

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

      socket.on("message", handleMessage);
      socket.on("typing", handleTyping);
      socket.on("userJoined", handleUserJoined);
      socket.on("userLeft", handleUserLeft);
      socket.on("onlineUsers", handleOnlineUsers);

      return () => {
        socket.off("message", handleMessage);
        socket.off("typing", handleTyping);
        socket.off("userJoined", handleUserJoined);
        socket.off("userLeft", handleUserLeft);
        socket.off("onlineUsers", handleOnlineUsers);
      };
    }
  }, [socket, selectedChat, currentUser.email]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const response = await fetch(`/api/chats/${selectedChat._id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    if (!socket || !selectedChat) return;

    socket.emit("typing", {
      userEmail: currentUser.email,
      userName: currentUser.name,
      chatId: selectedChat._id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        userEmail: currentUser.email,
        userName: currentUser.name,
        chatId: selectedChat._id,
        isTyping: false,
      });
    }, 1000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !socket) return;

    const messageData = {
      content: newMessage,
      type: "text" as const,
    };

    try {
      const response = await fetch(`/api/chats/${selectedChat._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const data = await response.json();

        const localMessage: Message = {
          ...data.messageData,
          _id: data.messageData._id,
          chatId: selectedChat._id,
          senderEmail: currentUser.email,
          senderName: currentUser.name,
          content: newMessage,
          type: "text",
          readBy: [],
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, localMessage]);

        socket.emit("sendMessage", {
          ...localMessage,
          chatId: selectedChat._id,
          participants: selectedChat.participants,
        });

        setNewMessage("");
        onMessageSent();

        socket.emit("typing", {
          userEmail: currentUser.email,
          userName: currentUser.name,
          chatId: selectedChat._id,
          isTyping: false,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileSend = async (
    fileUrl: string,
    fileName: string,
    fileType: string,
    message?: string
  ) => {
    if (!selectedChat || !socket) return;

    try {
      const fileMessageData = {
        content: fileUrl,
        type: fileType.startsWith("image/") ? "image" : "video",
        fileName: fileName,
      };

      const fileResponse = await fetch(
        `/api/chats/${selectedChat._id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fileMessageData),
        }
      );

      if (fileResponse.ok) {
        const fileResult = await fileResponse.json();
        const fileMessage: Message = {
          ...fileResult.messageData,
          _id: fileResult.messageData._id,
          chatId: selectedChat._id,
          senderEmail: currentUser.email,
          senderName: currentUser.name,
          readBy: [],
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, fileMessage]);

        socket.emit("sendMessage", {
          ...fileMessage,
          chatId: selectedChat._id,
          participants: selectedChat.participants,
        });

        if (message && message.trim()) {
          const textMessageData = {
            content: message.trim(),
            type: "text",
          };

          const textResponse = await fetch(
            `/api/chats/${selectedChat._id}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(textMessageData),
            }
          );

          if (textResponse.ok) {
            const textResult = await textResponse.json();
            const textMessage: Message = {
              ...textResult.messageData,
              _id: textResult.messageData._id,
              chatId: selectedChat._id,
              senderEmail: currentUser.email,
              senderName: currentUser.name,
              readBy: [],
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, textMessage]);

            socket.emit("sendMessage", {
              ...textMessage,
              chatId: selectedChat._id,
              participants: selectedChat.participants,
            });
          }
        }

        onMessageSent();
      }
    } catch (error) {
      console.error("Error sending file:", error);
      alert("Error sending file");
    }
  };

  const getChatDisplayInfo = () => {
    if (!selectedChat) return null;
    if (selectedChat.type === "group") {
      return {
        name: selectedChat.name || "Group Chat",
        image: "/placeholder.svg",
        status: `${selectedChat.participants.length} members`,
      };
    }
    const otherParticipant = selectedChat.participantDetails?.find(
      (p) => p.email !== currentUser.email
    );
    if (otherParticipant) {
      const isOnline = localOnlineUsers.has(otherParticipant.email);
      return {
        name: otherParticipant.name,
        image: otherParticipant.image || "/placeholder.svg",
        status:
          isTyping && typingUser
            ? "Typing..."
            : isOnline
            ? "Online"
            : "Offline",
        isOnline,
        userEmail: otherParticipant.email,
      };
    }
    return {
      name: "Deleted User",
      image: "/placeholder.svg",
      status: "Offline",
      isOnline: false,
      userEmail: null,
    };
  };

  const displayInfo = getChatDisplayInfo();

  const renderMessage = (message: Message) => {
    const isOwn = message.senderEmail === currentUser.email;
    console.log(message);
    return (
      <div
        key={message._id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-6`}
      >
        <div
          className={`flex ${
            isOwn ? "flex-row-reverse" : "flex-row"
          } items-start ${
            isOwn ? "space-x-reverse space-x-3" : "space-x-3"
          } max-w-xs lg:max-w-md`}
        >
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={isOwn ? currentUser.image : displayInfo?.image} />
            <AvatarFallback>
              {isOwn ? currentUser.name?.[0] : displayInfo?.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
            }`}
          >
            {!isOwn && selectedChat?.type === "group" && (
              <p className="text-xs font-medium mb-1 opacity-70">
                {message.senderName}
              </p>
            )}
            {message.type === "text" && (
              <p className="break-words">{message.content}</p>
            )}
            {message.type === "image" && (
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  setPreviewFile({
                    url: message.content,
                    name: message.fileName || "Image",
                    type: "image",
                  });
                  setShowFilePreview(true);
                }}
              >
                <img
                  src={message.content}
                  alt={message.fileName || "Shared image"}
                  className="max-w-full max-h-64 object-cover rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                  loading="lazy"
                />
              </div>
            )}
            {message.type === "video" && (
              <div className="relative">
                <video
                  src={message.content}
                  controls
                  className="max-w-full max-h-64 rounded-lg shadow-sm"
                  preload="metadata"
                  poster={`${message.content}#t=1`}
                />
              </div>
            )}
            <p className="text-xs mt-1 opacity-70">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Select a chat to start messaging
          </h3>
          <p className="text-gray-600 text-lg">
            Choose a conversation from your chat list or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4 flex items-center space-x-3 bg-white">
        <div className="relative">
          <Avatar>
            <AvatarImage src={displayInfo?.image || "/placeholder.svg"} />
            <AvatarFallback>{displayInfo?.name?.[0]}</AvatarFallback>
          </Avatar>
          {displayInfo?.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        <div>
          <h3 className="font-medium">{displayInfo?.name}</h3>
          <p className="text-sm text-gray-500">{displayInfo?.status}</p>
        </div>
      </div>

      {/* Scrollable Messages */}
      <ScrollArea className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map(renderMessage)}
        {isUploading && (
          <div className="flex justify-end mb-4">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg">
              <p className="text-sm">Uploading...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            disabled={isUploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isUploading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isUploading || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* File Modals */}
      <FileUploadPreview
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onSend={handleFileSend}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
      />
      {previewFile && (
        <FilePreview
          isOpen={showFilePreview}
          onClose={() => {
            setShowFilePreview(false);
            setPreviewFile(null);
          }}
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          fileType={previewFile.type}
        />
      )}
    </div>
  );
}
