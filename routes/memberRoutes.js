const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  createMember,
  getMembers,
  getMember,
  updateMember,
  deleteMember
} = require("../controllers/memberController");

// Add upload middleware to routes that handle photos
router.post("/", auth, upload.single('photo'), createMember);
router.get("/", auth, getMembers);
router.get("/:id", auth, getMember);
router.put("/:id", auth, upload.single('photo'), updateMember);
router.delete("/:id", auth, deleteMember);

module.exports = router;