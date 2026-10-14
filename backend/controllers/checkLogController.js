const mongoose = require("mongoose");

const CheckLog = require("../models/checkLogModel");
const Pass = require("../models/passModel");
const Visitor = require("../models/visitorModel");

// ======================================================
// CHECK IN
// ======================================================
const checkIn = async (req, res) => {
  try {
    const { passId } = req.body;

    if (!passId) {
      return res.status(400).json({
        error: "Pass ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({
        error: "Invalid pass ID",
      });
    }

    // Find pass
    const pass = await Pass.findById(passId).populate("visitor");

    if (!pass) {
      return res.status(404).json({
        error: "Pass not found",
      });
    }

    // Pass must be Active
    if (pass.status !== "Active") {
      return res.status(400).json({
        error: `Pass is ${pass.status}`,
      });
    }

    const now = new Date();

    // Check validFrom
    if (now < new Date(pass.validFrom)) {
      return res.status(400).json({
        error: "Pass is not active yet",
      });
    }

    // Check validUntil
    if (now > new Date(pass.validUntil)) {
      pass.status = "Expired";
      await pass.save();

      return res.status(400).json({
        error: "Pass has expired",
      });
    }

    // Check if already checked in
    const existingLog = await CheckLog.findOne({
      pass: pass._id,
      checkOut: null,
    });

    if (existingLog) {
      return res.status(400).json({
        error: "Visitor is already checked in",
      });
    }

    // ==================================================
    // CREATE CHECK-IN LOG
    // ==================================================
    const checkLog = await CheckLog.create({
      pass: pass._id,
      visitor: pass.visitor._id,
      checkIn: now,
      checkedInBy: req.user._id,
      status: "Checked In",
    });

    // ==================================================
    // UPDATE VISITOR STATUS
    // ==================================================
    const visitor = await Visitor.findById(pass.visitor._id);

    if (visitor) {
      visitor.status = "Checked In";
      await visitor.save();
    }

    // IMPORTANT:
    // Pass remains Active during check-in
    // It becomes Used only after check-out.

    const populatedLog = await CheckLog.findById(checkLog._id)
      .populate("pass")
      .populate("visitor")
      .populate("checkedInBy", "name email role");

    return res.status(201).json({
      message: "Visitor checked in successfully",
      checkLog: populatedLog,
    });

  } catch (error) {
    console.error("Check-in error:", error);

    return res.status(500).json({
      error: "Failed to check in visitor",
    });
  }
};


// ======================================================
// CHECK OUT
// ======================================================
const checkOut = async (req, res) => {
  try {
    const { passId } = req.body;

    if (!passId) {
      return res.status(400).json({
        error: "Pass ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({
        error: "Invalid pass ID",
      });
    }

    // Find active check-in
    const checkLog = await CheckLog.findOne({
      pass: passId,
      checkOut: null,
    });

    if (!checkLog) {
      return res.status(404).json({
        error: "Active check-in record not found",
      });
    }

    // ==================================================
    // UPDATE CHECK-OUT LOG
    // ==================================================
    checkLog.checkOut = new Date();
    checkLog.checkedOutBy = req.user._id;
    checkLog.status = "Checked Out";

    await checkLog.save();

    // ==================================================
    // UPDATE VISITOR STATUS
    // ==================================================
    const visitor = await Visitor.findById(checkLog.visitor);

    if (visitor) {
      visitor.status = "Checked Out";
      await visitor.save();
    }

    // ==================================================
    // UPDATE PASS STATUS
    // ==================================================
    const pass = await Pass.findById(passId);

    if (pass && pass.status === "Active") {
      pass.status = "Used";
      await pass.save();
    }

    // ==================================================
    // POPULATE LOG
    // ==================================================
    const populatedLog = await CheckLog.findById(checkLog._id)
      .populate("pass")
      .populate("visitor")
      .populate("checkedInBy", "name email role")
      .populate("checkedOutBy", "name email role");

    return res.status(200).json({
      message: "Visitor checked out successfully",
      checkLog: populatedLog,
    });

  } catch (error) {
    console.error("Check-out error:", error);

    return res.status(500).json({
      error: "Failed to check out visitor",
    });
  }
};


// ======================================================
// GET CHECK LOGS
// ======================================================
const getCheckLogs = async (req, res) => {
  try {
    const logs = await CheckLog.find()
      .populate("pass")
      .populate("visitor")
      .populate("checkedInBy", "name email role")
      .populate("checkedOutBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(logs);

  } catch (error) {
    console.error("Get check logs error:", error);

    return res.status(500).json({
      error: "Failed to fetch check logs",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  checkIn,
  checkOut,
  getCheckLogs,
};