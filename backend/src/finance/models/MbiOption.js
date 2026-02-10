
const mongoose = require('mongoose');

const MbiOptionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please add a type'],
    trim: true
  },
  isElectric: {
    type: Boolean,
    default: false
  },
  maxAge: {
    type: Number,
    required: [true, 'Please add maximum vehicle age']
  },
  option: {
    type: Number,
    required: [true, 'Please add an option number']
  },
  maxKms: {
    type: Number,
    required: [true, 'Please add maximum kilometers']
  },
  excess: {
    type: Number,
    required: [true, 'Please add excess amount']
  },
  term: {
    type: Number,
    required: [true, 'Please add term in months'],
    enum: [12, 24, 36, 48]
  },
  claimLimit: {
    type: String,
    required: [true, 'Please add claim limit']
  },
  premium: {
    type: Number,
    required: [true, 'Please add premium amount']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MbiOption', MbiOptionSchema);
