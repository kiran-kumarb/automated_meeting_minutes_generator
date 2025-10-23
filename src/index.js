const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB limit

app.get('/', (req, res) => {
  res.send('API is running');
});

app.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({
    message: 'Audio uploaded successfully!',
    filename: req.file.filename,
  });
});

app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
