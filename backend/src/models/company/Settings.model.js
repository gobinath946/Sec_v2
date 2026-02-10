import mongoose from 'mongoose';

const { Schema } = mongoose;

const SettingsSchema = new Schema({
  category: { 
    type: String, 
    enum: ['storage', 'email', 'sms', 'general'],
    required: true 
  },
  provider: String,
  isActive: { 
    type: Boolean, 
    default: false 
  },
  config: {
    type: Map,
    of: Schema.Types.Mixed
  },
  testStatus: {
    lastTested: Date,
    success: Boolean,
    message: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

SettingsSchema.index({ category: 1, isActive: 1 });

export default SettingsSchema;
