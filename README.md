# Alpha - Real-Time Chat Application

This is a full-stack real-time chat application built with **Next.js**, **MongoDB**, and **Socket.io**. The app includes authentication (email/password + Google login), real-time messaging, media/file sharing, and full user CRUD operations.

---

## 🚀 Getting Started

### 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Yasvanth-2005/Messaging_Portal
   cd Messaging_Portal
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up your environment variables:**

   Create a `.env.local` file in the root directory and add the following:

   ```env
   MONGODB_URI=*******
   JWT_SECRET=*******
   NEXTAUTH_SECRET=*******
   GOOGLE_CLIENT_ID=*******
   GOOGLE_CLIENT_SECRET=*******
   NEXT_PUBLIC_SOCKET_URL=*******
   PORT=*******
   CLOUDINARY_CLOUD_NAME=*******
   CLOUDINARY_API_KEY=*******
   CLOUDINARY_API_SECRET=*******
   ```

---

## 🧑‍💻 Running the App

### 📌 Run Next.js frontend (port 3000 by default):

```bash
npm run dev
```

### 🔌 Run the socket server:

```bash
node server.js
```

Make sure **both** servers are running at the same time.

---

## ✨ Features

- 🔐 **Authentication** via Email/Password and Google OAuth
- 💬 **Real-time chat** powered by Socket.io
- 📸 **Image and video uploads** via Cloudinary
- 📁 **File support** for media sharing
- 👤 **User profile** management with full CRUD (Create (signup), Read, Update, Delete)
- 🔒 Passwords hashed and secure session handling

---

## 🔧 Further Improvements (Planned / Optional)

1. 🔐 Encrypt sensitive data in the database
2. 📚 Pagination and search functionalities for:
   - Users list
   - Chat list
   - Chat messages with load-more capability

---

## ⚠️ Notes / Limitations

- 🐢 **First request delay** due to backend hosted on Render (cold start)
- 💸 **Document upload** feature was excluded due to billing requirements
