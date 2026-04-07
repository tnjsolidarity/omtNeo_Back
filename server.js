const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== DATABASE CONNECTION ====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// ==================== ROUTES ====================
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/members", require("./routes/memberRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));      // Project routes
app.use("/api/projects", require("./routes/activityRoutes"));     // Activity routes
app.use("/api/projects", require("./routes/eventRoutes"));
// Add task routes
app.use("/api/projects/:projectId/activities/:activityId/events/:eventId/tasks", require("./routes/taskRoutes"));

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));