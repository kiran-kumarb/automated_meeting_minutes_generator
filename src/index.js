// src/index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();

// basic server setup
const PORT = 3000;
app.use(cors());
app.use(express.static('public'));

// make sure uploads folder exists
const uploadPath = path.join(__dirname, "uploads");
fs.mkdirSync(uploadPath, { recursive: true });

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/wav", "audio/mp3"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only MP3 or WAV files allowed."));
  },
});

// Routes
app.get("/", (req, res) => {
  res.send("Automated Meeting Minutes Generator API Running ✅");
});

app.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.json({
    message: "Audio uploaded successfully!",
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
  });
});

// Serve uploaded files statically
app.use("/uploads", express.static(uploadPath));

app.listen(PORT, () =>
  console.log(`Server running → http://localhost:${PORT}`)
);
