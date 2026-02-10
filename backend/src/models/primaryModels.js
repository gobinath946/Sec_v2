const mongoose = require("mongoose");

/**
 * PRIMARY DATABASE MODELS
 * These models are stored in the primary database
 * - Customer: Company/Customer information
 * - User: User accounts and authentication
 */

// Customer Schema
const CustomerSchema = mongoose.Schema(
  {
    sms_configuration: [
      {
        _id: mongoose.Types.ObjectId,
        clicksend_token: { type: String },
        username: { type: String },
        service_name: { type: String },
      },
    ],
    is_active: Boolean,
    is_deleted: Boolean,
    uid: { type: String },
    token: { type: String },
    name: { type: String },
    email: { type: String },
    mobile: { type: String },
    applnx_api_keys: {
      type: [
        {
          api_key: { type: String, required: true },
          api_secret: { type: String, required: true },
        },
      ],
      default: [],
    },
    email_configuration: [
      {
        _id: mongoose.Types.ObjectId,
        service_name: { type: String },
        email_name: { type: String },
        password: { type: String },
        from_name: { type: String },
      },
    ],
    applnx_signature: { type: String, default: "Enter Signature" },
    token: { type: String, default: "Enter Token" },
    page_configuration: [
      {
        action: { type: String },
        _id: mongoose.Types.ObjectId,
        template: { type: String },
        url: { type: String },
        SMS_Content: { type: String },
        EMAIL_Content: { type: String },
        EMAIL_Subject: { type: String },
      },
    ],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    otp_configuration: {
      email_body: {
        type: String,
        default: "<p>Your (Brand Name) OTP Credential is: {%OTP%}</p>",
      },
      email_subject: {
        type: String,
        default: "Your (Brand Name) OTP Credentials",
      },
      sms_body: {
        type: String,
        default:
          "Your (Brand Name) Otp is: {%OTP%}<br><br>@(Respective Domain Name) #{%OTP%}",
      },
    },
    file_configuration: [
      {
        service_name: { type: String },
        _id: mongoose.Types.ObjectId,
        access_key: { type: String },
        bucket_name: { type: String },
        file_link: { type: String },
        region: { type: String },
        secret_key: { type: String },
        client_id: { type: String },
        client_secret: { type: String },
        secret_id: { type: String },
        redirect_uri: { type: String },
        refresh_token: { type: String },
      },
    ],
    branding: {
      type: {
        branding_color: [
          {
            page_name: {
              type: String,
              default: "Main_Page",
            },
            _id: {
              type: mongoose.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            styles: {
              box_border: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              description: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              heading: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              sub_heading: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              heading_bg: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              button_color: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              doc_heading: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
            },
          },
          {
            page_name: {
              type: String,
              default: "Otp_Page",
            },
            _id: {
              type: mongoose.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            styles: {
              box_border: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              heading: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              description: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              button_color: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
            },
          },
          {
            page_name: {
              type: String,
              default: "Result_Page",
            },
            _id: {
              type: mongoose.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
            styles: {
              success_heading: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              success_description: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              error_heading: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
              error_description: {
                color: {
                  type: String,
                  default: "#000000",
                },
              },
            },
          },
        ],
        branding_logo: [
          {
            page_name: {
              type: String,
              default: "Main_Logo",
            },
            Logo_Path: {
              type: String,
              default: "Logo_Path",
            },
            _id: {
              type: mongoose.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
          },
        ],
        branding_template: [
          {
            page_name: {
              type: String,
              default: "Main_Logo",
            },
            Logo_Path: {
              type: String,
              default: "Logo_Path",
            },
            _id: {
              type: mongoose.Types.ObjectId,
              default: () => new mongoose.Types.ObjectId(),
            },
          },
        ],
      },
      default: () => ({
        branding_color: [
          {
            page_name: "Main_Page",
            styles: {
              box_border: { color: "#000000" },
              description: { color: "#000000" },
              heading: { color: "#000000" },
              sub_heading: { color: "#000000" },
              heading_bg: { color: "#000000" },
              button_color: { color: "#000000" },
              doc_heading: { color: "#000000" },
            },
          },
          {
            page_name: "Otp_Page",
            styles: {
              box_border: { color: "#000000" },
              heading: { color: "#000000" },
              description: { color: "#000000" },
              button_color: { color: "#000000" },
            },
          },
          {
            page_name: "Result_Page",
            styles: {
              success_heading: { color: "#000000" },
              success_description: { color: "#000000" },
              error_heading: { color: "#000000" },
              error_description: { color: "#000000" },
            },
          },
        ],
        branding_logo: [
          {
            page_name: "Main_Logo",
            Logo_Path: "Your_path",
          },
        ],
      }),
    },
  },
  { strict: false }
);

CustomerSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// User Schema
const UserSchema = mongoose.Schema({
  user_uid: { type: String, unique: true, required: true },
  email_id: { type: String, required: true },
  user_name: { type: String, required: true },
  password: { type: String, required: true },
  company_name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  company_level_permissions: { type: [String], default: ["admin"] },
  woocom_id: { type: String },
  credits: { type: Number, default: 0 },
  last_notified_credit_threshold: { type: Number, default: 100 },
  notifiedAtZeroCredits: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
});

UserSchema.pre("save", function (next) {
  now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Export schemas (models will be created on specific connections)
module.exports = {
  CustomerSchema,
  UserSchema,
};
