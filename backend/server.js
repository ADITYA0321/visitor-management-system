const dotenv = require('dotenv');
dotenv.config();  
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

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

// Middlewares & CORS Configuration (Sirf ek baar properly configure karein)
app.use(cors({
  origin: '*', // Ya aap apna Vercel URL bhi dal sakte hain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ensure 'uploads' folder exists automatically
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
app.use("/api/checklog", checkLogRoutes);

app.get('/', (req, res) => {
  res.send("Home");
});

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
