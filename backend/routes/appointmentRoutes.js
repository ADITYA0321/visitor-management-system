const express = require("express");

const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/", requireAuth, createAppointment);

router.get("/", requireAuth, getAppointments);

router.get("/:id", requireAuth, getAppointment);

router.patch("/:id/status", requireAuth, updateAppointmentStatus);

router.delete("/:id", requireAuth, deleteAppointment);

module.exports = router;