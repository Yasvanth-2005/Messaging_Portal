const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3001;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const users = new Map(); // userEmail -> socketId
  const userSockets = new Map(); // socketId -> userEmail
  const typingUsers = new Map(); // chatId -> Set of typing users

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userEmail) => {
      console.log(`User ${userEmail} joining with socket ${socket.id}`);

      // Remove user from previous socket if exists
      if (users.has(userEmail)) {
        const oldSocketId = users.get(userEmail);
        userSockets.delete(oldSocketId);
        console.log(`Removed old socket ${oldSocketId} for user ${userEmail}`);
      }

      users.set(userEmail, socket.id);
      userSockets.set(socket.id, userEmail);
      socket.userEmail = userEmail;

      console.log(`User ${userEmail} joined with socket ${socket.id}`);

      const onlineUsers = Array.from(users.keys());
      socket.emit("onlineUsers", onlineUsers);

      socket.broadcast.emit("userJoined", userEmail);

      io.emit("onlineUsers", onlineUsers);
    });

    socket.on("sendMessage", (messageData) => {
      console.log("Message received:", messageData);

      // Send to all participants in the chat except sender
      if (messageData.participants && Array.isArray(messageData.participants)) {
        messageData.participants.forEach((participantEmail) => {
          if (participantEmail !== messageData.senderEmail) {
            const receiverSocketId = users.get(participantEmail);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("message", messageData);
              console.log(
                `Message sent to ${participantEmail} via socket ${receiverSocketId}`
              );
            } else {
              console.log(`User ${participantEmail} is offline`);
            }
          }
        });
      }

      // Broadcast to all sockets for chat list updates
      io.emit("newMessage", {
        chatId: messageData.chatId,
        senderEmail: messageData.senderEmail,
        content: messageData.content,
        timestamp: messageData.timestamp,
      });
    });

    socket.on("typing", ({ userEmail, userName, chatId, isTyping }) => {
      console.log(
        `${userName} (${userEmail}) is ${
          isTyping ? "typing" : "stopped typing"
        } in chat ${chatId}`
      );

      if (!typingUsers.has(chatId)) {
        typingUsers.set(chatId, new Set());
      }

      const chatTypingUsers = typingUsers.get(chatId);

      if (isTyping) {
        chatTypingUsers.add(userEmail);
      } else {
        chatTypingUsers.delete(userEmail);
      }

      // Broadcast typing status to all users except sender
      socket.broadcast.emit("typing", {
        userEmail,
        userName,
        chatId,
        isTyping,
      });
    });

    socket.on("newUserSignup", (userData) => {
      console.log(`New user signup: ${userData.name} (${userData.email})`);
      socket.broadcast.emit("newUserSignup", userData);
    });

    socket.on("chatCreated", (data) => {
      console.log("Chat created:", data);
      // Notify all participants about the new chat
      data.participants.forEach((participantEmail) => {
        if (participantEmail !== socket.userEmail) {
          const receiverSocketId = users.get(participantEmail);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newChatCreated", data);
          }
        }
      });
    });

    socket.on("disconnect", () => {
      const userEmail = userSockets.get(socket.id);

      if (userEmail) {
        console.log(`User ${userEmail} disconnected`);

        users.delete(userEmail);
        userSockets.delete(socket.id);

        typingUsers.forEach((typingSet, chatId) => {
          typingSet.delete(userEmail);
        });

        socket.broadcast.emit("userLeft", userEmail);

        const onlineUsers = Array.from(users.keys());
        io.emit("onlineUsers", onlineUsers);

        console.log(`User ${userEmail} disconnected`);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server running on port ${port}`);
    });
});
