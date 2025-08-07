"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat-interface";
import ChatList from "@/components/chat-list";
import ProfilePage from "@/components/profile-page";
import { User, Chat } from "@/types";
import { io, Socket } from "socket.io-client";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.email) {
      initializeSocket();
      fetchChats();
      fetchUsers();
      fetchCurrentUser();
    }
  }, [session]);

  const initializeSocket = () => {
    if (!session?.user?.email) return;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    );

    socketInstance.on("connect", () => {
      socketInstance.emit("join", session?.user?.email!);
    });

    socketInstance.on("userJoined", (userEmail: string) => {
      setOnlineUsers((prev) => new Set([...prev, userEmail]));
    });

    socketInstance.on("userLeft", (userEmail: string) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userEmail);
        return newSet;
      });
    });

    socketInstance.on("onlineUsers", (userEmails: string[]) => {
      setOnlineUsers(new Set(userEmails));
    });

    socketInstance.on("newUserSignup", () => {
      fetchUsers();
    });

    socketInstance.on("newMessage", () => {
      fetchChats();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  };

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setCurrentUserData(data.user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const createOrOpenChat = async (userEmail: string) => {
    if (!session?.user?.email || userEmail === session.user.email) return;

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantEmail: userEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchChats();
        setSelectedChat(data.chat);

        if (socket) {
          socket.emit("chatCreated", {
            chatId: data.chat._id,
            participants: data.chat.participants,
          });
        }
      } else {
        const errorData = await response.json();
        console.error("Error creating chat:", errorData);
      }
    } catch (error) {
      console.error("Error creating/opening chat:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  if (showProfile) {
    return (
      <ProfilePage
        user={currentUserData}
        onBack={() => setShowProfile(false)}
        onUpdate={fetchCurrentUser}
      />
    );
  }

  return (
    <div className="h-screen flex">
      <div className="w-1/3 border-r">
        <ChatList
          chats={chats}
          users={users}
          currentUser={session.user}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          onCreateChat={createOrOpenChat}
          onShowProfile={() => setShowProfile(true)}
          onlineUsers={onlineUsers}
          socket={socket}
        />
      </div>
      <div className="flex-1">
        <ChatInterface
          currentUser={session.user}
          selectedChat={selectedChat}
          socket={socket}
          onlineUsers={onlineUsers}
          onMessageSent={fetchChats}
        />
      </div>
    </div>
  );
}
