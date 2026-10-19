const dotenv = require('dotenv');
dotenv.config();  
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // 👈 1. Yahan 'fs' module require karein

// Routes Import
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const appointmentRoutes = require("./routes/appointmentRoutes");
const passRoutes = require("./routes/passRoutes");
const checkLogRoutes = require("./routes/checkLogRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Port Initialization
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// 👇 2. Yahan 'uploads' folder automatic create karne ka code dalein
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Expose Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/user', authRoutes); // Temporary fallback route
app.use('/api/users', userRoutes);
app.use('/api/visitor', visitorRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/pass", passRoutes);
app.use("/api/report", reportRoutes);

app.get('/', (req, res) => {
  res.send("Home");
});
app.use(
  "/api/checklog",
  checkLogRoutes
);

// DB Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT} & connected to DB`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
