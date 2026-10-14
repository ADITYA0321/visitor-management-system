const express = require("express");

const {
  createPass,
  getPasses,
  getPass,
  downloadPassPDF,
  cancelPass,
} = require("../controllers/passController");

const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/", requireAuth, getPasses);

router.post("/", requireAuth, createPass);

router.get("/:id/pdf", requireAuth, downloadPassPDF);

router.get("/:id", requireAuth, getPass);

router.patch("/:id/cancel", requireAuth, requireAdmin, cancelPass);

module.exports = router;