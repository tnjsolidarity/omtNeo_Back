const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    incomeId: { type: String, unique: true },
    incomeType: {
      type: String,
      enum: ['Service', 'Money'],
      required: true
    },
    
    // Common fields for both types
    date: { type: Date, required: true },
    description: { type: String, default: '' },
    
    // Donor/Provider info
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    nonMemberInfo: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    
    // Service-specific fields
    serviceName: { type: String, default: '' },
    serviceValue: { type: Number, default: 0 },
    sentToMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    sentToNonMemberInfo: {
      name: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      description: { type: String, default: '' }
    },
    sentTo: { type: String, default: '' },
    
    // Money-specific fields
    incomeName: { type: String, default: '' },
    donatingAmount: { type: Number, default: 0 },
    paymentSentTo: { type: String, default: '' },
    paymentSentToMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
    paymentMode: { type: String, default: '' },
    paymentId: { type: String, default: '' },
    
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Income', incomeSchema);
