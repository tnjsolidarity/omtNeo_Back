const Member = require("../models/Member");

// CREATE member - also update to ensure consistency
exports.createMember = async (req, res) => {
  try {
    const {
      name,
      role,
      phone,
      dateOfBirth, // Add this
      skills,
      career,
      education,
      educationalDepartment,
      passedOutYear
    } = req.body;

    if (!name || !role) return res.status(400).json({ error: "Name and role are required" });

    const count = await Member.countDocuments();
    const memberId = `MEM-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    console.log("Creating with data:", req.body);

    const member = await Member.create({
      memberId,
      name,
      role,
      phone,
      dateOfBirth: dateOfBirth || null, // Add this
      skills: skills || [],
      career: career || [],
      education: education || [],
      educationalDepartment: educationalDepartment || "",
      passedOutYear: passedOutYear || null
    });

    console.log("Created member:", member);
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

// UPDATE member - FIXED VERSION
exports.updateMember = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      role: req.body.role,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth || null, // Add this
      skills: req.body.skills || [],
      career: req.body.career || [],
      education: req.body.education || [],
      educationalDepartment: req.body.educationalDepartment || "",
      passedOutYear: req.body.passedOutYear || null
    };

    console.log("Updating with data:", updateData);

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!member) return res.status(404).json({ error: "Member not found" });

    console.log("Updated member:", member);
    res.json(member);
  } catch (err) {
    console.error("Update Member Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({ msg: "Member deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};