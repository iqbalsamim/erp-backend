const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const subjectRoutes = require("./routes/subjectRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const marksRoutes = require("./routes/marksRoutes");

const app = express();

// 🌐 Create HTTP server (required for Socket.io)
const server = http.createServer(app);

// 🔴 Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🌍 make io globally available (for routes)
global.io = io;

// 🟢 Online users storage
const onlineUsers = new Map();

/* =========================
   🔌 SOCKET CONNECTION
========================= */
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // 👤 user goes online
  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);

    // broadcast online users
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  // ❌ disconnect user
  socket.on("disconnect", () => {
    for (let [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("online-users", Array.from(onlineUsers.keys()));

    console.log("❌ User disconnected:", socket.id);
  });
});

/* =========================
   🧩 MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   🛣 API ROUTES
========================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/classes", require("./routes/classRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/fees", require("./routes/feesRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/teacher-subjects", require("./routes/teacherSubjects"));
app.use("/api/exams", require("./routes/examRoutes"));
/* =========================
   🚀 START SERVER
========================= */
server.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});