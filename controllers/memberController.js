const Member = require("../models/Member");
const { cloudinary } = require("../config/cloudinary");

// Helper function to parse JSON arrays from FormData
const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    return JSON.parse(field);
  } catch (e) {
    return [];
  }
};

// UPDATE createMember function
exports.createMember = async (req, res) => {
  try {
    // Parse array fields if they come as JSON strings (from FormData)
    const skills = parseArrayField(req.body.skills);
    const career = parseArrayField(req.body.career);
    const education = parseArrayField(req.body.education);

    const {
      name,
      role,
      phone,
      dateOfBirth,
    } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: "Name and role are required" });
    }

    const count = await Member.countDocuments();
    const memberId = `MEM-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Handle photo upload
    let photoUrl = null;
    let photoPublicId = null;
    
    if (req.file) {
      photoUrl = req.file.path;
      photoPublicId = req.file.filename;
    }

    const member = await Member.create({
      memberId,
      name,
      role,
      phone,
      dateOfBirth: dateOfBirth || null,
      photoUrl,
      photoPublicId,
      skills: skills,
      career: career,
      education: education,
    });

    res.status(201).json(member);
  } catch (err) {
    console.error("Create Member Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET all members
exports.getMembers = async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET a single member by ID
exports.getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE updateMember function
// controllers/memberController.js
exports.updateMember = async (req, res) => {
  try {
    console.log("=== UPDATE MEMBER START ===");
    console.log("Member ID:", req.params.id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request file:", req.file);
    
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Parse array fields
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        console.log("Parse error for field:", field, e.message);
        return [];
      }
    };

    const skills = parseArrayField(req.body.skills);
    const career = parseArrayField(req.body.career);
    const education = parseArrayField(req.body.education);

    const updateData = {
      name: req.body.name,
      role: req.body.role,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth || null,
      skills: skills,
      career: career,
      education: education,
    };

    console.log("Update data:", JSON.stringify(updateData, null, 2));

    // Handle photo upload if present
    if (req.file) {
      console.log("Processing photo upload");
      if (member.photoPublicId) {
        await cloudinary.uploader.destroy(member.photoPublicId);
      }
      updateData.photoUrl = req.file.path;
      updateData.photoPublicId = req.file.filename;
    }

    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log("Update successful");
    res.json(updatedMember);
  } catch (err) {
    console.error("=== UPDATE MEMBER ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    res.status(500).json({ 
      error: err.message,
      details: err.name === 'ValidationError' ? err.errors : undefined
    });
  }
};

// DELETE member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    
    // Delete photo from Cloudinary if exists
    if (member.photoPublicId) {
      await cloudinary.uploader.destroy(member.photoPublicId);
    }
    
    await Member.findByIdAndDelete(req.params.id);
    res.json({ msg: "Member deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};