import mongoose from 'mongoose';

const { Schema } = mongoose;

const DocumentSchema = new Schema({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  templateId: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  templateSnapshot: Object,
  delimiterValues: Map,
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },
  signatures: [{
    fieldId: String,
    recipientEmail: String,
    recipientName: String,
    signatureData: String,
    signedAt: Date,
    ipAddress: String,
    userAgent: String,
    mfaVerified: Boolean
  }],
  currentSignatureIndex: { 
    type: Number, 
    default: 0 
  },
  pdfUrl: String,
  storageUrl: String,
  expiresAt: Date,
  createdBy: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: Date
}, { timestamps: true });

DocumentSchema.index({ sessionId: 1 });
DocumentSchema.index({ status: 1, expiresAt: 1 });
DocumentSchema.index({ templateId: 1, status: 1 });

export default DocumentSchema;
