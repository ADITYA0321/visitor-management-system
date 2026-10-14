const express = require("express");

const {
  checkIn,
  checkOut,
  getCheckLogs,
} = require("../controllers/checkLogController");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post(
  "/check-in",
  requireAuth,
  checkIn
);

router.post(
  "/check-out",
  requireAuth,
  checkOut
);

router.get(
  "/",
  requireAuth,
  getCheckLogs
);

module.exports = router;