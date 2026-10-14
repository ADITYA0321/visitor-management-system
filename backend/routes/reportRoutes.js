const express = require("express");

const {
  getDashboardStats,
  getReports,
  exportReportCSV,
} = require("../controllers/reportController");

const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Dashboard statistics
router.get("/dashboard", requireAuth, getDashboardStats);

// Reports
router.get("/", requireAuth, getReports);

// Export CSV
router.get("/export", requireAuth, exportReportCSV);

module.exports = router;