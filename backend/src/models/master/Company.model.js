import mongoose from 'mongoose';

const { Schema } = mongoose;

const CompanySchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  domain: { 
    type: String, 
    unique: true,
    sparse: true,
    lowercase: true
  },
  databaseName: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  plan: { 
    type: String, 
    enum: ['free', 'basic', 'pro', 'enterprise'], 
    default: 'free' 
  },
  settings: {
    branding: {
      logo: String,
      primaryColor: { type: String, default: '#FF6B35' },
      secondaryColor: { type: String, default: '#FFFFFF' }
    }
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

CompanySchema.index({ domain: 1 });
CompanySchema.index({ isActive: 1 });

export default CompanySchema;
