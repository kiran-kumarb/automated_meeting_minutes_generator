const form = document.getElementById("upload-form");
const statusDiv = document.getElementById("upload-status");
const transcribeBtn = document.getElementById("transcribe-btn");
const transcriptPreview = document.getElementById("transcript-preview");
const editTextarea = document.getElementById("edit-transcript-text");
const saveEditBtn = document.getElementById("save-edit-btn");
const editStatus = document.getElementById("edit-status");
const extractActionsBtn = document.getElementById("extract-actions-btn");
const actionItemsLabel = document.getElementById("action-items-label");
const actionItemsList = document.getElementById("action-items-list");
const loadingIndicator = document.getElementById("loading-indicator");

let lastUploadedFilename = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusDiv.textContent = "";
  transcriptPreview.textContent = "";
  editTextarea.value = "";
  editTextarea.disabled = true;
  saveEditBtn.disabled = true;
  extractActionsBtn.disabled = true;
  loadingIndicator.hidden = true;

  if (!document.getElementById("audio").files.length) {
    statusDiv.textContent = "Please select an audio file.";
    transcribeBtn.disabled = true;
    return;
  }
  const formData = new FormData();
  formData.append("audio", document.getElementById("audio").files[0]);

  try {
    const res = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      statusDiv.textContent = "Upload failed: " + (await res.text());
      transcribeBtn.disabled = true;
    } else {
      const json = await res.json();
      statusDiv.textContent = "Upload succeeded: " + json.filename;
      lastUploadedFilename = json.filename;
      transcribeBtn.disabled = false;
    }
  } catch (err) {
    statusDiv.textContent = "Error: " + err.message;
    transcribeBtn.disabled = true;
  }
});
const loadingMessage = document.getElementById("loading-message");

transcribeBtn.addEventListener("click", async () => {
  if (!lastUploadedFilename) return;

  loadingMessage.style.display = "block";   // Show message

  try {
    const res = await fetch("http://localhost:3000/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: lastUploadedFilename }),
    });
    if (!res.ok) {
      transcriptPreview.textContent = "Failed to get transcript.";
      editTextarea.disabled = true;
      saveEditBtn.disabled = true;
    } else {
      const data = await res.json();
      transcriptPreview.textContent = data.transcript;
      editTextarea.value = data.transcript;
      editTextarea.disabled = false;
      saveEditBtn.disabled = false;
    }
  } catch (err) {
    transcriptPreview.textContent = "Error: " + err.message;
    editTextarea.disabled = true;
    saveEditBtn.disabled = true;
  }

  loadingMessage.style.display = "none";   // Hide message
});


saveEditBtn.addEventListener("click", async () => {
  if (!lastUploadedFilename || !editTextarea.value.trim()) return;
  try {
    const res = await fetch("http://localhost:3000/edit-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: lastUploadedFilename, transcript: editTextarea.value }),
    });
    if (!res.ok) {
      editStatus.textContent = "Failed to save edits.";
      extractActionsBtn.disabled = true;
    } else {
      editStatus.textContent = "Transcript saved! You can now extract action items.";
      extractActionsBtn.disabled = false;
    }
  } catch (err) {
    editStatus.textContent = "Error: " + err.message;
    extractActionsBtn.disabled = true;
  }
});

extractActionsBtn.addEventListener("click", async () => {
  const transcript = editTextarea.value.trim();
  if (!transcript) {
    actionItemsLabel.textContent = "No transcript to process.";
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/extract-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) {
      actionItemsLabel.textContent = "Failed to extract action items.";
      actionItemsList.textContent = "";
    } else {
      const data = await res.json();
      actionItemsLabel.textContent = "Extracted Action Items:";
      actionItemsList.textContent = data.actionItems.length ? data.actionItems.join("\n") : "(None found)";
    }
  } catch (err) {
    actionItemsLabel.textContent = "Error extracting action items.";
    actionItemsList.textContent = err.message;
  }
});
