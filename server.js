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
app.use("/api/projects", require("./routes/projectRoutes"));      // Project routes only
app.use("/api/projects", require("./routes/activityRoutes"));     // Activity routes (same base path)

// Mount routes
app.use("/api/projects", require("./routes/eventRoutes")); // Add this line

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));