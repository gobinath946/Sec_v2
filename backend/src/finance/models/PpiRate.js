
const mongoose = require('mongoose');

const PpiRateSchema = new mongoose.Schema({
  term: {
    type: Number,
    required: [true, 'Please add a term in months']
  },
  type: {
    type: String,
    required: [true, 'Please specify PPI type'],
    enum: ['Single', 'Double']
  },
  status: {
    type: String,
    required: [true, 'Please specify customer status'],
    enum: ['Employed', 'Self Employed', 'Everyday Essentials']
  },
  premium: {
    type: Number,
    required: [true, 'Please add premium percentage']
  }
}, {
  timestamps: true
});

// Compound index for unique identification
PpiRateSchema.index({ term: 1, type: 1, status: 1 }, { unique: true });

module.exports = mongoose.model('PpiRate', PpiRateSchema);
