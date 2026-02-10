
const mongoose = require('mongoose');

const GapOptionSchema = new mongoose.Schema({
  option: {
    type: Number,
    required: [true, 'Please add an option number'],
    unique: true
  },
  maxBenefit: {
    type: Number,
    required: [true, 'Please add a maximum benefit amount']
  },
  additionalBenefits: {
    type: Number,
    required: [true, 'Please add additional benefits amount']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please add a selling price']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GapOption', GapOptionSchema);
