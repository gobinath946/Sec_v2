
const mongoose = require('mongoose');

const MbiTermOptionSchema = new mongoose.Schema({
  term: {
    type: Number,
    required: [true, 'Please add a term in months'],
    unique: true,
    enum: [12, 24, 36, 48]
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MbiTermOption', MbiTermOptionSchema);
