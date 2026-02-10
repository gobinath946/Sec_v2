
const mongoose = require('mongoose');

const PpiCoverOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true
  },
  premium: {
    type: Number,
    default: 0
  },
  calculation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PpiCoverOption', PpiCoverOptionSchema);
