import mongoose from 'mongoose';

const { Schema } = mongoose;

const ApiKeySchema = new Schema({
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  key: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  permissions: [{ 
    type: String 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastUsed: { 
    type: Date 
  },
  expiresAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

ApiKeySchema.index({ key: 1 });
ApiKeySchema.index({ companyId: 1, isActive: 1 });

export default ApiKeySchema;
