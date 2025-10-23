// =============================================
// src/index.js
// Automated Meeting Minutes Generator API Server
// =============================================

// ---------- Import Required Modules ----------
const express = require("express");   // For creating server and routes
const cors = require("cors");         // For handling cross-origin requests
const multer = require("multer");     // For handling file uploads
const path = require("path");         // For working with file & directory paths
const fs = require("fs");             // For file system operations

// ---------- Initialize App ----------
const app = express();
const PORT = 3000;

// Enable CORS and serve static files from "public" folder
app.use(cors());
app.use(express.static("public"));

// ---------- Ensure Upload Directory Exists ----------
const uploadPath = path.join(__dirname, "uploads");
fs.mkdirSync(uploadPath, { recursive: true }); // Creates folder if not present

// ---------- Configure Multer for File Uploads ----------
const storage = multer.diskStorage({
  // Where uploaded files will be stored
  destination: (req, file, cb) => cb(null, uploadPath),

  // File naming convention: <timestamp>-<original_filename>
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // Limit to 200 MB
  fileFilter: (req, file, cb) => {
    // Allow only MP3/WAV audio files
    const allowed = ["audio/mpeg", "audio/wav", "audio/mp3"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only MP3 or WAV files are allowed."));
  },
});

// ---------- Routes ----------

// Root route to check if API is running
app.get("/", (req, res) => {
  res.send("✅ Automated Meeting Minutes Generator API Running");
});

// Route: Upload an audio file
app.post("/upload", upload.single("audio"), (req, res) => {
  // If no file uploaded, return 400
  if (!req.file) return res.status(400).send("No file uploaded");

  // If uploaded successfully, return file details
  res.json({
    message: "Audio uploaded successfully!",
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
  });
});

// Serve uploaded files (static hosting)
app.use("/uploads", express.static(uploadPath));

// ---------- Transcription Stub API ----------
// This is a placeholder route — you can integrate a real speech-to-text model later
app.use(express.json());
app.post("/transcribe", (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: "Filename missing" });
  }

  // Stub response (simulated transcript)
  res.json({ transcript: `This is a stub transcript for ${filename}` });
});

// ---------- Helper Function: Extract Action Items ----------
// Finds sentences with specific keywords indicating actionable tasks
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

  // Validate input
  if (!transcript) {
    return res.status(400).json({ error: "Transcript missing" });
  }

  // Run extraction function
  const actionItems = extractActionItems(transcript);
  res.json({ actionItems });
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
