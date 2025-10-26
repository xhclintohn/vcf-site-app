const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Clean phone helper
function cleanPhone(num) {
  let cleaned = num.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

// POST /api/contacts - Add contact
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });

    const cleanedPhone = cleanPhone(phone);
    const result = await pool.query(
      'INSERT INTO contacts (name, phone) VALUES ($1, $2) RETURNING *',
      [name.trim(), cleanedPhone]
    );

    res.status(201).json({ message: 'Contact added successfully!', contact: result.rows[0] });
  } catch (err) {
    console.error('Add contact error:', err);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// GET /api/contacts/stats - Get counts
app.get('/api/contacts/stats', async (req, res) => {
  try {
    const { rows: [total] } = await pool.query('SELECT COUNT(*) as count FROM contacts');
    const todayCount = Math.min(parseInt(total.count), Math.floor(Math.random() * 5) + 1);

    res.json({
      total: parseInt(total.count),
      today: todayCount
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/contacts/export - Download VCF
app.get('/api/contacts/export', async (req, res) => {
  const { password } = req.query;
  if (password !== 'toxic123') {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  try {
    const { rows } = await pool.query('SELECT name, phone FROM contacts');
    let vcfData = '';
    rows.forEach(c => {
      vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL:${c.phone}\nEND:VCARD\n`;
    });

    if (!vcfData) return res.status(404).json({ error: 'No contacts found' });

    res.set({
      'Content-Type': 'text/vcard',
      'Content-Disposition': 'attachment; filename="contacts.vcf"'
    });
    res.send(vcfData);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/vcf.html'));
});

// Health check
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/contacts`);
});