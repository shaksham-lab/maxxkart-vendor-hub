/**
 * ============================================================
 *  Maxxkart Vendor Management System — Express backend
 * ============================================================
 *  Start it with:  npm start        (then open http://localhost:3000)
 *
 *  What this file does:
 *    1. Serves the plain HTML/CSS/JS pages from the "public" folder.
 *    2. Exposes a small JSON API (/api/...) that the pages call with fetch().
 *    3. Talks to MySQL through db.js.
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Basic setup ----------
app.use(express.json());                                  // read JSON request bodies
app.use(express.static(path.join(__dirname, 'public')));  // serve the frontend

// Login state is stored in a cookie-backed session.
app.use(session({
  secret: process.env.SESSION_SECRET || 'maxxkart_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
}));

// Uploaded files (invoices / documents) go into the "uploads" folder.
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });
app.use('/uploads', express.static(uploadDir));

// ---------- Small helpers ----------

// Blocks the request if nobody is logged in.
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in' });
  next();
}

// Blocks the request if the logged-in user is not an admin.
function requireAdmin(req, res, next) {
  if (req.session.user?.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

// Returns the vendor row that belongs to the logged-in vendor user.
async function myVendor(req) {
  const rows = await query('SELECT * FROM vendors WHERE user_id = ?', [req.session.user.id]);
  return rows[0] || null;
}

// Wraps an async route so errors don't crash the server.
const safe = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

/* ============================================================
 *  AUTHENTICATION
 * ========================================================== */

// Who am I? Used by every page to know if the user is logged in.
app.get('/api/me', safe(async (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  const vendor = req.session.user.role === 'vendor' ? await myVendor(req) : null;
  res.json({ user: req.session.user, vendor });
}));

// Login
app.post('/api/login', safe(async (req, res) => {
  const { email, password } = req.body;
  const users = await query('SELECT * FROM users WHERE email = ?', [String(email || '').toLowerCase()]);
  const user = users[0];

  // Compare the typed password with the stored bcrypt hash.
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Vendors can only log in once the admin has approved them.
  if (user.role === 'vendor') {
    const v = (await query('SELECT status, rejection_reason FROM vendors WHERE user_id = ?', [user.id]))[0];
    if (v?.status === 'Pending')  return res.status(403).json({ error: 'Your account is waiting for admin approval' });
    if (v?.status === 'Rejected') return res.status(403).json({ error: 'Registration rejected: ' + (v.rejection_reason || 'contact the admin') });
  }

  req.session.user = { id: user.id, email: user.email, role: user.role };
  res.json({ user: req.session.user });
}));

// Logout
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

// Vendor self-registration (creates a user + a Pending vendor)
app.post('/api/register', safe(async (req, res) => {
  const { name, contactPerson, phone, email, category, address, gst, password } = req.body;

  // --- validation (same rules as the browser, checked again here for safety) ---
  const errors = {};
  if (!name?.trim()) errors.name = 'Company name is required';
  if (!contactPerson?.trim()) errors.contactPerson = 'Contact person is required';
  if (!/^\d{10}$/.test(phone || '')) errors.phone = 'Phone must be exactly 10 digits';
  if (!/^\S+@\S+\.\S+$/.test(email || '')) errors.email = 'Enter a valid email';
  if (!category) errors.category = 'Choose a category';
  if (!address?.trim()) errors.address = 'Address is required';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test((gst || '').toUpperCase())) errors.gst = 'GST must be a valid 15-character number';
  if ((password || '').length < 6) errors.password = 'Password must be at least 6 characters';
  if (Object.keys(errors).length) return res.status(400).json({ errors });

  const mail = email.toLowerCase().trim();
  if ((await query('SELECT id FROM users WHERE email = ?', [mail])).length) {
    return res.status(400).json({ errors: { email: 'This email is already registered' } });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = await query('INSERT INTO users (email, password_hash, role) VALUES (?, ?, "vendor")', [mail, hash]);
  await query(
    `INSERT INTO vendors (user_id, name, contact_person, phone, email, category, address, gst, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
    [user.insertId, name.trim(), contactPerson.trim(), phone, mail, category, address.trim(), gst.toUpperCase()]
  );
  res.json({ ok: true });
}));

/* ============================================================
 *  VENDORS
 * ========================================================== */

// Admin: list every vendor
app.get('/api/vendors', requireLogin, requireAdmin, safe(async (_req, res) => {
  res.json(await query('SELECT * FROM vendors ORDER BY created_at DESC'));
}));

// Admin: one vendor with its documents
app.get('/api/vendors/:id', requireLogin, requireAdmin, safe(async (req, res) => {
  const vendor = (await query('SELECT * FROM vendors WHERE id = ?', [req.params.id]))[0];
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  vendor.documents = await query('SELECT * FROM vendor_documents WHERE vendor_id = ?', [vendor.id]);
  res.json(vendor);
}));

// Admin: approve / reject a vendor
app.put('/api/vendors/:id/status', requireLogin, requireAdmin, safe(async (req, res) => {
  const { status, reason } = req.body;
  if (!['Pending', 'Active', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  await query('UPDATE vendors SET status = ?, rejection_reason = ? WHERE id = ?', [status, reason || null, req.params.id]);
  res.json({ ok: true });
}));

// Vendor: update my own profile (GST and category stay locked)
app.put('/api/my/profile', requireLogin, safe(async (req, res) => {
  const vendor = await myVendor(req);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  const { name, contactPerson, phone, email, address } = req.body;
  await query(
    'UPDATE vendors SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?',
    [name, contactPerson, phone, email, address, vendor.id]
  );
  res.json({ ok: true });
}));

/* ============================================================
 *  DOCUMENTS
 * ========================================================== */

// Vendor: upload a document (the file arrives as multipart/form-data)
app.post('/api/my/documents', requireLogin, upload.single('file'), safe(async (req, res) => {
  const vendor = await myVendor(req);
  if (!vendor || !req.file) return res.status(400).json({ error: 'Missing vendor or file' });
  await query(
    'INSERT INTO vendor_documents (vendor_id, doc_type, file_name, file_path) VALUES (?, ?, ?, ?)',
    [vendor.id, req.body.docType || 'Other', req.file.originalname, path.basename(req.file.path)]
  );
  res.json({ ok: true });
}));

// Vendor: my documents
app.get('/api/my/documents', requireLogin, safe(async (req, res) => {
  const vendor = await myVendor(req);
  res.json(vendor ? await query('SELECT * FROM vendor_documents WHERE vendor_id = ? ORDER BY uploaded_at DESC', [vendor.id]) : []);
}));

// Admin: every document, with the vendor name attached
app.get('/api/documents', requireLogin, requireAdmin, safe(async (_req, res) => {
  res.json(await query(`
    SELECT d.*, v.name AS vendor_name
    FROM vendor_documents d
    JOIN vendors v ON v.id = d.vendor_id
    ORDER BY d.uploaded_at DESC`));
}));

// Admin: verify / reject a document
app.put('/api/documents/:id/status', requireLogin, requireAdmin, safe(async (req, res) => {
  await query('UPDATE vendor_documents SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ ok: true });
}));

/* ============================================================
 *  PURCHASE ORDERS
 * ========================================================== */

// List orders — admin sees all, a vendor only sees their own
app.get('/api/orders', requireLogin, safe(async (req, res) => {
  let orders;
  if (req.session.user.role === 'admin') {
    orders = await query(`
      SELECT p.*, v.name AS vendor_name
      FROM purchase_orders p JOIN vendors v ON v.id = p.vendor_id
      ORDER BY p.created_at DESC`);
  } else {
    const vendor = await myVendor(req);
    if (!vendor) return res.json([]);
    orders = await query(`
      SELECT p.*, v.name AS vendor_name
      FROM purchase_orders p JOIN vendors v ON v.id = p.vendor_id
      WHERE p.vendor_id = ? ORDER BY p.created_at DESC`, [vendor.id]);
  }
  // Attach the line items of each order.
  for (const o of orders) o.items = await query('SELECT * FROM po_items WHERE po_id = ?', [o.id]);
  res.json(orders);
}));

// Admin: create a purchase order with its items
app.post('/api/orders', requireLogin, requireAdmin, safe(async (req, res) => {
  const { vendorId, items } = req.body;
  if (!vendorId || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Vendor and at least one item are required' });

  const total = items.reduce((sum, i) => sum + Number(i.qty) * Number(i.price), 0);
  const poNumber = 'PO-' + Date.now().toString().slice(-6);

  const result = await query('INSERT INTO purchase_orders (po_number, vendor_id, total) VALUES (?, ?, ?)', [poNumber, vendorId, total]);
  for (const i of items) {
    await query('INSERT INTO po_items (po_id, name, qty, price) VALUES (?, ?, ?, ?)', [result.insertId, i.name, i.qty, i.price]);
  }
  res.json({ ok: true, poNumber });
}));

// Vendor marks an order Delivered / admin marks it Completed
app.put('/api/orders/:id/status', requireLogin, safe(async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Delivered', 'Completed'].includes(status)) return res.status(400).json({ error: 'Bad status' });
  await query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
}));

/* ============================================================
 *  INVOICES & PAYMENTS
 * ========================================================== */

// List invoices — admin sees all, vendor sees their own
app.get('/api/invoices', requireLogin, safe(async (req, res) => {
  const base = `
    SELECT i.*, p.po_number, v.name AS vendor_name
    FROM invoices i
    JOIN purchase_orders p ON p.id = i.po_id
    JOIN vendors v         ON v.id = i.vendor_id`;
  if (req.session.user.role === 'admin') {
    return res.json(await query(base + ' ORDER BY i.uploaded_at DESC'));
  }
  const vendor = await myVendor(req);
  res.json(vendor ? await query(base + ' WHERE i.vendor_id = ? ORDER BY i.uploaded_at DESC', [vendor.id]) : []);
}));

// Vendor uploads an invoice file against a delivered order
app.post('/api/invoices', requireLogin, upload.single('file'), safe(async (req, res) => {
  const vendor = await myVendor(req);
  if (!vendor || !req.file) return res.status(400).json({ error: 'Missing vendor or file' });

  const po = (await query('SELECT * FROM purchase_orders WHERE id = ? AND vendor_id = ?', [req.body.poId, vendor.id]))[0];
  if (!po) return res.status(400).json({ error: 'Purchase order not found' });

  await query(
    `INSERT INTO invoices (invoice_number, po_id, vendor_id, file_name, file_path, amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['INV-' + Date.now().toString().slice(-6), po.id, vendor.id, req.file.originalname, path.basename(req.file.path), po.total]
  );
  res.json({ ok: true });
}));

// Admin approves / rejects an invoice
app.put('/api/invoices/:id/status', requireLogin, requireAdmin, safe(async (req, res) => {
  await query('UPDATE invoices SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ ok: true });
}));

// Admin marks an invoice Paid (and closes the linked order)
app.put('/api/invoices/:id/pay', requireLogin, requireAdmin, safe(async (req, res) => {
  await query('UPDATE invoices SET payment = "Paid" WHERE id = ?', [req.params.id]);
  const inv = (await query('SELECT po_id FROM invoices WHERE id = ?', [req.params.id]))[0];
  if (inv) await query('UPDATE purchase_orders SET status = "Completed" WHERE id = ?', [inv.po_id]);
  res.json({ ok: true });
}));

/* ============================================================
 *  DASHBOARD STATS (numbers + chart data)
 * ========================================================== */
app.get('/api/stats', requireLogin, requireAdmin, safe(async (_req, res) => {
  const counts = (await query(`
    SELECT
      (SELECT COUNT(*) FROM vendors WHERE status = 'Active')  AS activeVendors,
      (SELECT COUNT(*) FROM vendors WHERE status = 'Pending') AS pendingVendors,
      (SELECT COUNT(*) FROM purchase_orders)                  AS totalOrders,
      (SELECT COALESCE(SUM(amount),0) FROM invoices WHERE payment = 'Paid')    AS paidAmount,
      (SELECT COALESCE(SUM(amount),0) FROM invoices WHERE payment = 'Pending') AS pendingAmount
  `))[0];

  // Spend per vendor category — used by the bar chart on the dashboard.
  const byCategory = await query(`
    SELECT v.category, COALESCE(SUM(p.total), 0) AS total
    FROM vendors v LEFT JOIN purchase_orders p ON p.vendor_id = v.id
    GROUP BY v.category ORDER BY total DESC`);

  // How many orders in each status — used by the second chart.
  const byStatus = await query('SELECT status, COUNT(*) AS count FROM purchase_orders GROUP BY status');

  res.json({ ...counts, byCategory, byStatus });
}));

// Anything else falls back to the login page.
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Maxxkart running on http://localhost:${PORT}`));
