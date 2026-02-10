
const mongoose = require('mongoose');

const MbiTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a type name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MbiType', MbiTypeSchema);
