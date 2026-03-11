const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createMember,
  getMembers,
  getMember,
  updateMember,
  deleteMember
} = require("../controllers/memberController");

router.post("/", auth, createMember);
router.get("/", auth, getMembers);
router.get("/:id", auth, getMember);
router.put("/:id", auth, updateMember);
router.delete("/:id", auth, deleteMember);

module.exports = router;