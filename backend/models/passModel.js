const mongoose = require("mongoose");

const passSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      required: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    passNumber: {
      type: String,
      required: true,
      unique: true,
    },

    qrCode: {
      type: String,
      default: "",
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Used", "Expired", "Cancelled"],
      default: "Active",
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pass", passSchema);