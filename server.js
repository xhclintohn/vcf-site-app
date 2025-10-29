const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "contacts.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "toxic123";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(PUBLIC_DIR)); // Serve index.html + assets

// --- Utility functions ---
function readContacts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeContacts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateVCF(contacts) {
  return contacts
    .map(
      (c) => `BEGIN:VCARD
VERSION:3.0
FN:${c.name}
TEL;TYPE=CELL:+${c.phone}
END:VCARD`
    )
    .join("\n");
}

// --- API: Add contact ---
app.post("/api/contacts", (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone)
    return res.status(400).json({ error: "Name and phone are required" });

  const contacts = readContacts();

  if (contacts.some((c) => c.phone === phone))
    return res.status(400).json({ error: "Contact already exists" });

  contacts.push({
    name,
    phone,
    date: new Date().toISOString(),
  });

  writeContacts(contacts);
  res.json({ success: true });
});

// --- API: Get stats ---
app.get("/api/contacts/stats", (req, res) => {
  const contacts = readContacts();
  const today = new Date().toISOString().split("T")[0];
  const todayCount = contacts.filter((c) => c.date.startsWith(today)).length;
  res.json({ total: contacts.length, today: todayCount });
});

// --- API: Export VCF ---
app.get("/api/contacts/export", (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });

  const contacts = readContacts();
  const vcf = generateVCF(contacts);

  res.setHeader("Content-Disposition", "attachment; filename=contacts.vcf");
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.send(vcf);
});

// --- Route fallback to index.html ---
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});