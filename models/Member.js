// models/Member.js
const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, unique: true },
    name: { type: String, required: true },
    phone: String,
    role: {
      type: String,
      enum: [
        "Associate",
        "Member",
        "GuestMember",
        "District Secretary",
        "District President",
        "State President"
      ],
      required: true
    },
    // Add dateOfBirth field here
    dateOfBirth: { 
      type: Date,
      default: null
    },
    skills: { type: [String], default: [] },
    career: { type: [String], default: [] },
    education: { type: [String], default: [] },
    educationalDepartment: { type: String, default: "" },
    passedOutYear: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);