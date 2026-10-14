const visitorModel = require("../models/visitorModel");
const mongoose = require("mongoose");

// 1. Create Visitor
const createVisitor = async (req, res) => {
  const { name, mobile, email, company, purpose, host, visitDate } = req.body;

  if (!name || !mobile || !purpose || !visitDate) {
    return res
      .status(400)
      .json({ error: "Name, mobile, purpose, and visit date are required." });
  }

  try {
    const photoPath = req.file ? `/uploads/${req.file.filename}` : "";

    const visitor = await visitorModel.create({
      name,
      mobile,
      email: email || "",
      company: company || "",
      purpose,
      host: host || "",
      visitDate: new Date(visitDate),
      photo: photoPath,
      createdBy: req.user._id,
    });

    res.status(201).json(visitor);
  } catch (err) {
    console.error("Error creating visitor:", err);
    res.status(500).json({ error: err.message || "Failed to create visitor" });
  }
};

// 2. Get All Visitors
const getVisitors = async (req, res) => {
  try {
    const visitors = await visitorModel.find();
    return res.status(200).json(visitors);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 3. Get Single Visitor
const getVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "No such visitor" });
    }
    const visitor = await visitorModel.findById(id);
    if (!visitor) {
      return res.status(404).json({ error: "No such visitor" });
    }
    return res.status(200).json(visitor);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// 4. Update Visitor (FIXED HERE 🛠️)
const updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if MongoDB ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Visitor ID" });
    }

    const updateData = { ...req.body };

    // Date handle karein
    if (updateData.visitDate) {
      updateData.visitDate = new Date(updateData.visitDate);
    }

    // Photo update handle karein
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }

    // 🔴 FIXED: 'Visitor' ki jagah 'visitorModel' use kiya
    const visitor = await visitorModel.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: "after" }
    );

    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    return res.status(200).json(visitor);
  } catch (err) {
    console.error("Error updating visitor:", err);
    return res.status(500).json({ error: err.message || "Failed to update visitor" });
  }
};

// 5. Delete Visitor
const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "No such visitor" });
    }
    const deleted = await visitorModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "No such visitor" });
    }
    return res.status(200).json({
      message: "Visitor deleted successfully",
      deleted,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createVisitor,
  getVisitors,
  getVisitor,
  updateVisitor,
  deleteVisitor,
};