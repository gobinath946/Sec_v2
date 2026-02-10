const mongoose = require("mongoose");

/**
 * COMPANY-SPECIFIC DATABASE MODELS
 * These models are stored in company-specific databases
 * Each company gets their own database with these collections
 */

// OTP Schema
const OtpSchema = mongoose.Schema({
  uid: { type: String, required: true },
  mobile_number: { type: String },
  email: { type: String },
  otp: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
});

OtpSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Response Schema (subdocument)
const responseSchema = mongoose.Schema(
  {
    created_at: { type: Date, default: Date.now },
    action: String,
    data: String,
    link: String,
  },
  { _id: false }
);

// Message Schema
const MessageSchema = mongoose.Schema(
  { created_at: { type: Date, default: Date.now }, response: [responseSchema] },
  { strict: false }
);

// Token Schema
const TokenSchema = mongoose.Schema({
  user_uid: { type: String, required: true },
  Token: { type: String, required: true },
  token_uid: { type: String, required: true, unique: true },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
});

TokenSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Count Schema
const CountSchema = mongoose.Schema({
  customer_id: { type: String, required: true },
  sms_counts: [
    {
      date: { type: Date, required: true },
      count: { type: Number, default: 0 },
    },
  ],
  email_counts: [
    {
      date: { type: Date, required: true },
      count: { type: Number, default: 0 },
    },
  ],
  credit_counts: [
    {
      date: { type: Date, required: true },
      count: { type: Number, default: 0 },
    },
  ],
  purchased_counts: [
    {
      date: { type: Date, required: true },
      count: { type: Number, default: 0 },
    },
  ],
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
});

CountSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Log Schema
const LogSchema = mongoose.Schema({
  email: { type: String },
  trigger_event: { type: String },
  message_id: { type: String },
  creation_time: { type: Date },
  device_details: { type: String },
  ip_address: { type: String },
  location: { type: mongoose.Schema.Types.Mixed },
  browser_name: { type: String },
  device_type: { type: String },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
});

LogSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Email Template Schema
const emailTemplateSchema = mongoose.Schema({
  temp_id: { type: String, required: true },
  user_uid: { type: String, required: true },
  subject: { type: String, required: true },
  templateName: { type: String, required: true },
  templateData: { type: mongoose.Schema.Types.Mixed, required: true },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
});

emailTemplateSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Export schemas (models will be created on specific company connections)
module.exports = {
  OtpSchema,
  MessageSchema,
  TokenSchema,
  CountSchema,
  LogSchema,
  emailTemplateSchema,
};
