const mongoose = require("mongoose");
const Appointment = require("../models/appointmentModel");
const Visitor = require("../models/visitorModel");
const User = require("../models/userModel");
const { sendAppointmentStatusEmail } = require("../services/emailService");

// ======================================================
// CREATE APPOINTMENT
// Logged-in user automatically becomes HOST
// ======================================================
const createAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { visitor, visitDate, purpose } = req.body;

    // 1. Validation
    if (!visitor || !visitDate || !purpose) {
      await session.endSession();
      return res.status(400).json({
        error: "Visitor, visit date and purpose are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(visitor)) {
      await session.endSession();
      return res.status(400).json({ error: "Invalid visitor ID" });
    }

    if (!req.user?._id) {
      await session.endSession();
      return res.status(401).json({ error: "User authentication required" });
    }

    // 2. Check Visitor & Status
    const visitorExists = await Visitor.findById(visitor).session(session);

    if (!visitorExists) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ error: "Visitor not found" });
    }

    if (["Approved", "Checked In", "Checked Out"].includes(visitorExists.status)) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        error: `Visitor status is currently '${visitorExists.status}' and cannot create a new appointment`,
      });
    }

    // 3. Check for existing pending appointment
    const existingPendingAppointment = await Appointment.findOne({
      visitor: visitor,
      status: "Pending",
    }).session(session);

    if (existingPendingAppointment) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        error: "This visitor already has a pending appointment",
      });
    }

    // 4. Verify Host User
    const host = await User.findById(req.user._id).session(session);
    if (!host) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ error: "Host user not found" });
    }

    // 5. Create Appointment
    const [appointment] = await Appointment.create(
      [
        {
          visitor: visitor,
          host: host._id,
          visitDate: visitDate,
          purpose: purpose.trim(),
          status: "Pending",
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    // 6. Update Visitor Status
    visitorExists.status = "Pending";
    await visitorExists.save({ session });

    // Commit Transaction
    await session.commitTransaction();
    await session.endSession();

    // 7. Fetch populated result
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("visitor")
      .populate("host", "name email role")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment: populatedAppointment,
    });

  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.error("Create appointment error:", error);

    return res.status(500).json({
      error: error.message || "Failed to create appointment",
    });
  }
};


// ======================================================
// GET ALL APPOINTMENTS
// ======================================================
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("visitor")
      .populate("host", "name email role")
      .populate("createdBy", "name email role")
      .sort({ visitDate: -1 });

    return res.status(200).json(appointments);

  } catch (error) {
    console.error("Get appointments error:", error);
    return res.status(500).json({ error: "Failed to fetch appointments" });
  }
};


// ======================================================
// GET SINGLE APPOINTMENT
// ======================================================
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id)
      .populate("visitor")
      .populate("host", "name email role")
      .populate("createdBy", "name email role");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    return res.status(200).json(appointment);

  } catch (error) {
    console.error("Get appointment error:", error);
    return res.status(500).json({ error: "Failed to fetch appointment" });
  }
};


// ======================================================
// UPDATE APPOINTMENT STATUS
// Admin can Approve / Reject
// Visitor status automatically syncs
// Email notification sent safely
// ======================================================
const updateAppointmentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.endSession();
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      await session.endSession();
      return res.status(400).json({
        error: "Status must be Approved or Rejected",
      });
    }

    // 1. Update Appointment & populate in a single query
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, session }
    )
      .populate("visitor")
      .populate("host", "name email role")
      .populate("createdBy", "name email role");

    if (!updatedAppointment) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({ error: "Appointment not found" });
    }

    // 2. Sync Related Visitor Status
    if (updatedAppointment.visitor) {
      await Visitor.findByIdAndUpdate(
        updatedAppointment.visitor._id || updatedAppointment.visitor,
        { status },
        { session }
      );
    }

    await session.commitTransaction();
    await session.endSession();

    // 3. Send Email (Non-blocking DB operations)
    try {
      await sendAppointmentStatusEmail({
        visitor: updatedAppointment.visitor,
        host: updatedAppointment.host,
        appointment: updatedAppointment,
        status,
      });
    } catch (emailError) {
      console.error("Failed to send status email notification:", emailError);
    }

    return res.status(200).json({
      message: `Appointment ${status.toLowerCase()} successfully`,
      appointment: updatedAppointment,
    });

  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.error("Update appointment status error:", error);

    return res.status(500).json({
      error: "Failed to update appointment status",
    });
  }
};


// ======================================================
// DELETE APPOINTMENT
// ======================================================
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment deleted successfully",
    });

  } catch (error) {
    console.error("Delete appointment error:", error);
    return res.status(500).json({ error: "Failed to delete appointment" });
  }
};


// ======================================================
// EXPORTS (CommonJS)
// ======================================================
module.exports = {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  deleteAppointment,
};