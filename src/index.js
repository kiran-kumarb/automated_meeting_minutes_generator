// =============================================
// src/index.js
// Automated Meeting Minutes Generator API Server
// =============================================

// ---------- Import Required Modules ----------
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

// ---------- Initialize App ----------
const app = express();

// Enable CORS and serve static files from "public" folder
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

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

// ---------- Transcribe using Python ASR ----------
app.post("/transcribe", (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: "Filename missing" });
  }

  const audioFilePath = path.join(uploadPath, filename);
  const pythonProcess = spawn("python", ["transcribe.py", audioFilePath]);

  let transcript = "";
  pythonProcess.stdout.on("data", (data) => {
    transcript += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    res.json({ transcript: transcript.trim() });
  });
});

// ---------- Edit Transcript API ----------
let editedTranscripts = {}; // For demo; use a DB for production

app.post("/edit-transcript", (req, res) => {
  const { filename, transcript } = req.body;
  if (!filename || !transcript) {
    return res.status(400).json({ error: "Filename and transcript required" });
  }
  editedTranscripts[filename] = transcript;
  res.json({ message: "Transcript saved successfully!" });
});

app.get("/get-edited-transcript/:filename", (req, res) => {
  const { filename } = req.params;
  const transcript = editedTranscripts[filename];
  if (!transcript) {
    return res.status(404).json({ error: "No edited transcript found" });
  }
  res.json({ transcript });
});

// ---------- Helper Function: Extract Action Items ----------
const keywordList = [
  "action", "todo", "task", "follow-up", "deadline", "assign", "complete", "review", "finish"
];

function extractActionItems(transcript) {
  const sentences = transcript.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
  return sentences.filter((sentence) =>
    keywordList.some((keyword) => sentence.toLowerCase().includes(keyword))
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

// ---------- Generate Meeting Minutes Document ----------
app.post("/generate-minutes", (req, res) => {
  const { filename, transcript, actions, metadata } = req.body;
  if (!filename || !transcript || !actions || !metadata) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const content = `
Meeting Title: ${metadata.title}
Date: ${metadata.date}
Organizer: ${metadata.organizer}
Attendees: ${metadata.attendees}

--- Transcript ---
${transcript}

--- Action Items ---
${actions.map(a => `- ${a}`).join("\n")}
  `;
  const outpath = path.join(uploadPath, filename.replace(/\.[^/.]+$/, ".txt"));
  fs.writeFileSync(outpath, content, "utf-8");
  res.json({ message: "Minutes generated", download: `/uploads/${path.basename(outpath)}` });
});

// ---------- Export App for Testing ----------
module.exports = app;
