import mongoose from 'mongoose';

const { Schema } = mongoose;

const TemplateSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  htmlContent: { 
    type: String, 
    required: true 
  },
  delimiters: [{ 
    name: String, 
    type: { type: String, enum: ['text', 'number', 'date', 'email'] },
    required: Boolean,
    defaultValue: String
  }],
  signatureConfig: {
    type: { type: String, enum: ['single', 'multiple', 'hierarchy'], required: true },
    deliveryMethod: { type: String, enum: ['email', 'sms', 'both'], required: true },
    fields: [{
      id: String,
      label: String,
      recipientEmail: String,
      recipientPhone: String,
      order: Number,
      required: Boolean
    }]
  },
  previewMode: { 
    type: Boolean, 
    default: false 
  },
  mfaConfig: {
    enabled: { type: Boolean, default: false },
    emailOTP: { type: Boolean, default: false },
    smsOTP: { type: Boolean, default: false }
  },
  eventTracking: {
    trackOpened: { type: Boolean, default: true },
    trackSigned: { type: Boolean, default: true }
  },
  notifications: {
    onOpened: {
      enabled: Boolean,
      recipients: [String],
      channels: [{ type: String, enum: ['email', 'sms'] }]
    },
    onSigned: {
      enabled: Boolean,
      recipients: [String],
      channels: [{ type: String, enum: ['email', 'sms'] }]
    },
    onCompleted: {
      enabled: Boolean,
      recipients: [String],
      channels: [{ type: String, enum: ['email', 'sms'] }]
    }
  },
  signatureRequestContent: {
    email: {
      subject: String,
      body: String
    },
    sms: {
      message: String
    }
  },
  notificationContent: {
    onOpened: {
      email: { subject: String, body: String },
      sms: { message: String }
    },
    onSigned: {
      email: { subject: String, body: String },
      sms: { message: String }
    },
    onCompleted: {
      email: { subject: String, body: String },
      sms: { message: String }
    }
  },
  postSignatureActions: {
    uploadToStorage: { type: Boolean, default: true },
    sendEmails: [{
      recipient: String,
      includePDF: Boolean
    }],
    apiCallback: {
      enabled: Boolean,
      url: String,
      method: { type: String, enum: ['POST', 'PUT'], default: 'POST' },
      headers: Map,
      payloadTemplate: Object
    }
  },
  expirationDays: { 
    type: Number, 
    default: 30 
  },
  version: { 
    type: Number, 
    default: 1 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  previousVersionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Template' 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    required: true 
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

TemplateSchema.index({ name: 1 });
TemplateSchema.index({ isActive: 1 });
TemplateSchema.index({ version: -1 });

export default TemplateSchema;
