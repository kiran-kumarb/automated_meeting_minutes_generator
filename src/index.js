// =============================================
// src/index.js
// Automated Meeting Minutes Generator API Server
// =============================================

// ---------- Import Required Modules ----------
const express = require("express");   // For creating server and routes
const cors = require("cors");          // For handling cross-origin requests
const multer = require("multer");      // For handling file uploads
const path = require("path");          // For working with file & directory paths
const fs = require("fs");              // For file system operations

// ---------- Initialize App ----------
const app = express();

// Enable CORS and serve static files from "public" folder
app.use(cors());
app.use(express.static("public"));
app.use(express.json()); // For parsing JSON bodies

// ---------- Ensure Upload Directory Exists ----------
const uploadPath = path.join(__dirname, "uploads");
fs.mkdirSync(uploadPath, { recursive: true }); // Creates folder if not present

// ---------- Configure Multer for File Uploads ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/wav", "audio/mp3"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only MP3 or WAV files are allowed."));
  },
});

// ---------- Routes ----------

// Root route to check if API is running
app.get("/", (req, res) => {
  res.send("Automated Meeting Minutes Generator API Running");
});

// Route: Upload an audio file
app.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  res.json({
    message: "Audio uploaded successfully!",
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
  });
});

// Serve uploaded files (static hosting)
app.use("/uploads", express.static(uploadPath));

// ---------- Transcription Stub API ----------
app.post("/transcribe", (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: "Filename missing" });
  }
  res.json({ transcript: `This is a  transcript for ${filename}` });
});

// ---------- Helper Function: Extract Action Items ----------
function extractActionItems(transcript) {
  const keywords = ["action", "todo", "task", "follow-up", "deadline"];
  const sentences = transcript.split(/[.!?]/).map((s) => s.trim());
  return sentences.filter((sentence) =>
    keywords.some((keyword) => sentence.toLowerCase().includes(keyword))
  );
}

// ---------- Route: Extract Action Items from Transcript ----------
app.post("/extract-actions", (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: "Transcript missing" });
  }
  const actionItems = extractActionItems(transcript);
  res.json({ actionItems });
});

// ---------- Export App for Testing ----------
module.exports = app;
