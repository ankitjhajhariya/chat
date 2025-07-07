const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Broadcast messages to everyone
    socket.on("chat message", (msg) => {
        console.log("💬 Message:", msg);
        io.emit("chat message", msg);
    });

    // Broadcast typing status
    socket.on("typing", (user) => {
        socket.broadcast.emit("typing", user); // Send to everyone except sender
    });

    // Seen confirmation
    socket.on("seen", (msgId) => {
        io.emit("seen", msgId);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
