const mongoose = require("mongoose");
const crypto = require("crypto");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");

const Pass = require("../models/passModel");
const Visitor = require("../models/visitorModel");
const Appointment = require("../models/appointmentModel");

// ======================================================
// GENERATE PASS NUMBER
// ======================================================

const generatePassNumber = () => {
  const random = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `VP-${Date.now()}-${random}`;
};

// ======================================================
// CREATE PASS
// ======================================================

const createPass = async (req, res) => {
  try {
    const {
      visitor,
      appointment,
      validFrom,
      validUntil,
    } = req.body;

    if (
      !visitor ||
      !appointment ||
      !validFrom ||
      !validUntil
    ) {
      return res.status(400).json({
        error:
          "Visitor, appointment, valid from and valid until are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(visitor)) {
      return res.status(400).json({
        error: "Invalid visitor ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appointment)) {
      return res.status(400).json({
        error: "Invalid appointment ID",
      });
    }

    // Check visitor
    const visitorExists = await Visitor.findById(visitor);

    if (!visitorExists) {
      return res.status(404).json({
        error: "Visitor not found",
      });
    }

    // Check appointment
    const appointmentExists =
      await Appointment.findById(appointment);

    if (!appointmentExists) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    // Pass only for approved appointment
    if (appointmentExists.status !== "Approved") {
      return res.status(400).json({
        error:
          "Pass can only be issued for an approved appointment",
      });
    }

    // Check visitor matches appointment
    if (
      appointmentExists.visitor.toString() !==
      visitor.toString()
    ) {
      return res.status(400).json({
        error:
          "Selected visitor does not belong to this appointment",
      });
    }

    // Check existing active pass
    const existingPass = await Pass.findOne({
      appointment,
      status: "Active",
    });

    if (existingPass) {
      return res.status(400).json({
        error:
          "An active pass already exists for this appointment",
        pass: existingPass,
      });
    }

    // Generate pass number
    const passNumber = generatePassNumber();

    // QR data
    const qrData = JSON.stringify({
      passNumber,
      appointmentId: appointment,
      visitorId: visitor,
    });

    // Generate QR as Data URL
    const qrCode = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
    });

    // Create pass
    const pass = await Pass.create({
      visitor,
      appointment,
      passNumber,
      qrCode,
      validFrom,
      validUntil,
      status: "Active",
      issuedBy: req.user._id,
    });

    // Populate response
    const populatedPass =
      await Pass.findById(pass._id)
        .populate("visitor")
        .populate(
          "appointment",
          "visitDate purpose status host"
        )
        .populate(
          "issuedBy",
          "name email role"
        );

    return res.status(201).json({
      message: "Pass created successfully",
      pass: populatedPass,
    });

  } catch (error) {
    console.error(
      "Create pass error:",
      error
    );

    return res.status(400).json({
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL PASSES
// ======================================================

const getPasses = async (req, res) => {
  try {
    const passes = await Pass.find()
      .populate("visitor")
      .populate(
        "appointment",
        "visitDate purpose status host"
      )
      .populate(
        "issuedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json(passes);

  } catch (error) {
    console.error(
      "Get passes error:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch passes",
    });
  }
};

// ======================================================
// GET SINGLE PASS
// ======================================================

const getPass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid pass ID",
      });
    }

    const pass = await Pass.findById(id)
      .populate("visitor")
      .populate(
        "appointment",
        "visitDate purpose status host"
      )
      .populate(
        "issuedBy",
        "name email role"
      );

    if (!pass) {
      return res.status(404).json({
        error: "Pass not found",
      });
    }

    return res.status(200).json(pass);

  } catch (error) {
    console.error(
      "Get pass error:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch pass",
    });
  }
};

// ======================================================
// DOWNLOAD PASS PDF
// ======================================================

const downloadPassPDF = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid pass ID",
      });
    }

    const pass = await Pass.findById(id)
      .populate("visitor")
      .populate("appointment");

    if (!pass) {
      return res.status(404).json({
        error: "Pass not found",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pass.passNumber}.pdf"`
    );

    doc.pipe(res);

    // =========================
    // HEADER
    // =========================

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("VISITOR PASS", {
        align: "center",
      });

    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .font("Helvetica")
      .text("Visitor Management System", {
        align: "center",
      });

    doc.moveDown(2);

    // =========================
    // PASS NUMBER
    // =========================

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(`Pass No: ${pass.passNumber}`);

    doc.moveDown(1);

    // =========================
    // VISITOR DETAILS
    // =========================

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Visitor Details");

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Name: ${
          pass.visitor?.name || "-"
        }`
      );

    doc.text(
      `Mobile: ${
        pass.visitor?.mobile || "-"
      }`
    );

    doc.text(
      `Email: ${
        pass.visitor?.email || "-"
      }`
    );

    doc.text(
      `Company: ${
        pass.visitor?.company || "-"
      }`
    );

    doc.moveDown(1);

    // =========================
    // APPOINTMENT DETAILS
    // =========================

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Appointment Details");

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Purpose: ${
          pass.appointment?.purpose || "-"
        }`
      );

    doc.text(
      `Visit Date: ${
        pass.appointment?.visitDate
          ? new Date(
              pass.appointment.visitDate
            ).toLocaleString("en-IN")
          : "-"
      }`
    );

    doc.moveDown(1);

    // =========================
    // VALIDITY
    // =========================

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Pass Validity");

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Valid From: ${new Date(
          pass.validFrom
        ).toLocaleString("en-IN")}`
      );

    doc.text(
      `Valid Until: ${new Date(
        pass.validUntil
      ).toLocaleString("en-IN")}`
    );

    doc.moveDown(2);

    // =========================
    // QR CODE
    // =========================

    if (pass.qrCode) {
      const base64Data =
        pass.qrCode.replace(
          /^data:image\/png;base64,/,
          ""
        );

      const qrBuffer = Buffer.from(
        base64Data,
        "base64"
      );

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Scan QR Code", {
          align: "center",
        });

      doc.moveDown(0.5);

      doc.image(qrBuffer, {
        fit: [180, 180],
        align: "center",
      });
    }

    doc.moveDown(1);

    // =========================
    // STATUS
    // =========================

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(
        `Status: ${pass.status}`,
        {
          align: "center",
        }
      );

    doc.moveDown(2);

    doc
      .fontSize(9)
      .font("Helvetica")
      .text(
        "Please present this pass at the security desk.",
        {
          align: "center",
        }
      );

    doc.end();

  } catch (error) {
    console.error(
      "PDF generation error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to generate PDF",
      });
    }
  }
};

// ======================================================
// CANCEL PASS
// ======================================================

const cancelPass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid pass ID",
      });
    }

    const pass = await Pass.findById(id);

    if (!pass) {
      return res.status(404).json({
        error: "Pass not found",
      });
    }

    pass.status = "Cancelled";

    await pass.save();

    return res.status(200).json({
      message: "Pass cancelled successfully",
      pass,
    });

  } catch (error) {
    console.error(
      "Cancel pass error:",
      error
    );

    return res.status(500).json({
      error: "Failed to cancel pass",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createPass,
  getPasses,
  getPass,
  downloadPassPDF,
  cancelPass,
};