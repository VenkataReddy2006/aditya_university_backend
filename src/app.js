require('dotenv').config();
console.log("APP STARTED", __filename);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const aecRoutes = require("./aec/aec.routes");
const ausRoutes = require("./aus/aus.routes");
const examRoutes = require("./shared/exam/exam.routes");
const internalMarksRoutes = require("./shared/exam/internalMarks.routes");
const acetRoutes = require("./acet/acet.routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

global.io = io; // Expose globally for scheduler
app.set("io", io);

io.on("connection", (socket) => {
    console.log("New client connected", socket.id);
    socket.on("join", (username) => {
        socket.join(username);
        console.log(`Socket ${socket.id} joined room ${username}`);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
    });
});

app.use(cors());
app.use(express.json());

// Sync Routes
const syncRoutes = require("./shared/sync/sync.routes");
app.use("/api/sync", syncRoutes);

app.use("/api/aec", aecRoutes);
app.use("/api/aus", ausRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/acet", acetRoutes);
app.use("/api", internalMarksRoutes);

const statsRoutes = require("./shared/stats/stats.routes");
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
    res.send("Aditya University Backend (Cached Architecture)");
});

// Start scheduler
require("./shared/sync/scheduler");

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("MongoDB connection error:", err);
});