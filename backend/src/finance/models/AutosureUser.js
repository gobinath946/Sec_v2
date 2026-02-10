const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  userCode: {
    type: String,
    required: true,
  },

  // Added role field
  role: {
    type: String,
    enum: ["sales_manager", "sales_person"],
    default: "sales_manager"
  },

  dealerships: [{
    dealershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dealership',
      required: true
    },
    agentCode: {
      type: String,
      required: true
    },
    dealershipName: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('AutosureUser', userSchema);
