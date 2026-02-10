
const mongoose = require('mongoose');

const MbiExcessOptionSchema = new mongoose.Schema({
  excess: {
    type: Number,
    required: [true, 'Please add an excess amount'],
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MbiExcessOption', MbiExcessOptionSchema);
