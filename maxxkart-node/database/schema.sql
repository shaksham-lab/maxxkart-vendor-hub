-- ============================================================
--  Maxxkart Vendor Management System — MySQL schema + demo data
--  Run with:  mysql -u root -p < database/schema.sql
-- ============================================================

DROP DATABASE IF EXISTS maxxkart;
CREATE DATABASE maxxkart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maxxkart;

-- ---------- Users (both admins and vendors log in here) ----------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,   -- bcrypt hash, never the plain password
  role          ENUM('admin','vendor') NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Vendors (company details, linked to a user) ----------
CREATE TABLE vendors (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNIQUE,
  name             VARCHAR(150) NOT NULL,
  contact_person   VARCHAR(150) NOT NULL,
  phone            VARCHAR(15)  NOT NULL,
  email            VARCHAR(150) NOT NULL,
  category         VARCHAR(60)  NOT NULL,
  address          VARCHAR(255) NOT NULL,
  gst              VARCHAR(15)  NOT NULL,
  status           ENUM('Pending','Active','Rejected') NOT NULL DEFAULT 'Pending',
  rejection_reason VARCHAR(255),
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- Documents uploaded by a vendor, verified by admin ----------
CREATE TABLE vendor_documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id   INT NOT NULL,
  doc_type    ENUM('GST','PAN','Registration','Other') NOT NULL,
  file_name   VARCHAR(255) NOT NULL,
  file_path   VARCHAR(255) NOT NULL,   -- where the file sits inside /uploads
  status      ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- ---------- Purchase orders created by the admin ----------
CREATE TABLE purchase_orders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  po_number  VARCHAR(20) NOT NULL UNIQUE,
  vendor_id  INT NOT NULL,
  total      DECIMAL(12,2) NOT NULL DEFAULT 0,
  status     ENUM('Pending','Delivered','Completed') NOT NULL DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- ---------- Line items of a purchase order ----------
CREATE TABLE po_items (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  po_id INT NOT NULL,
  name  VARCHAR(150) NOT NULL,
  qty   INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- ---------- Invoices uploaded by vendors ----------
CREATE TABLE invoices (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  po_id          INT NOT NULL,
  vendor_id      INT NOT NULL,
  file_name      VARCHAR(255) NOT NULL,
  file_path      VARCHAR(255) NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,
  status         ENUM('Pending Review','Approved','Rejected') NOT NULL DEFAULT 'Pending Review',
  payment        ENUM('Pending','Paid') NOT NULL DEFAULT 'Pending',
  uploaded_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id)     REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)         ON DELETE CASCADE
);

-- ============================================================
--  DEMO DATA
--  Passwords below are bcrypt hashes of:
--    hellt5409@gmail.com -> Admin_123
--    every vendor        -> Vendor_123
-- ============================================================

INSERT INTO users (email, password_hash, role) VALUES
('hellt5409@gmail.com', '$2b$10$4Ml.bZOzVtve4Awdns336eZ9flZI2plPrtcKThJtKGQI03rG9rjVK', 'admin'),
('vendor@vd.com',       '$2b$10$TA3Ys9Ucc.41EL.f9KhzLerBuO/XPCsFUOZrKZOJYL/qKuBcDAx02', 'vendor'),
('sharma@fresh.com',    '$2b$10$TA3Ys9Ucc.41EL.f9KhzLerBuO/XPCsFUOZrKZOJYL/qKuBcDAx02', 'vendor'),
('info@dailydairy.com', '$2b$10$TA3Ys9Ucc.41EL.f9KhzLerBuO/XPCsFUOZrKZOJYL/qKuBcDAx02', 'vendor'),
('sales@bakehouse.com', '$2b$10$TA3Ys9Ucc.41EL.f9KhzLerBuO/XPCsFUOZrKZOJYL/qKuBcDAx02', 'vendor');

INSERT INTO vendors (user_id, name, contact_person, phone, email, category, address, gst, status, rejection_reason) VALUES
(2, 'Vendor Demo Supplies', 'Ravi Kumar',  '9876543210', 'vendor@vd.com',       'Groceries',   '12 MG Road, Bengaluru',   '29ABCDE1234F1Z5', 'Active',   NULL),
(3, 'Sharma Fresh Produce', 'Anil Sharma', '9812345678', 'sharma@fresh.com',    'Groceries',   '4 Market Lane, Pune',     '27PQRSX5678K1Z2', 'Active',   NULL),
(4, 'Daily Dairy Pvt Ltd',  'Meera Nair',  '9900112233', 'info@dailydairy.com', 'Dairy',       '88 Milk Colony, Kochi',   '32LMNOP9012Q1Z9', 'Active',   NULL),
(5, 'Bake House Foods',     'Imran Sheikh','9765432109', 'sales@bakehouse.com', 'Bakery',      '9 Baker Street, Mumbai',  '27BAKER1234H1Z1', 'Pending',  NULL);

INSERT INTO vendor_documents (vendor_id, doc_type, file_name, file_path, status) VALUES
(1, 'GST',          'gst-certificate.pdf', 'demo/gst-certificate.pdf', 'Verified'),
(1, 'PAN',          'pan-card.pdf',        'demo/pan-card.pdf',        'Pending'),
(2, 'GST',          'gst.pdf',             'demo/gst.pdf',             'Verified'),
(4, 'Registration', 'registration.pdf',    'demo/registration.pdf',    'Pending');

INSERT INTO purchase_orders (po_number, vendor_id, total, status) VALUES
('PO-1001', 1, 25000.00, 'Completed'),
('PO-1002', 1, 12500.00, 'Delivered'),
('PO-1003', 2, 18000.00, 'Pending'),
('PO-1004', 3, 42000.00, 'Delivered'),
('PO-1005', 3,  9000.00, 'Pending');

INSERT INTO po_items (po_id, name, qty, price) VALUES
(1, 'Basmati Rice 25kg', 20, 1250.00),
(2, 'Sunflower Oil 5L',  25,  500.00),
(3, 'Wheat Flour 10kg',  60,  300.00),
(4, 'Full Cream Milk 1L',2000, 21.00),
(5, 'Paneer 1kg',        30,  300.00);

INSERT INTO invoices (invoice_number, po_id, vendor_id, file_name, file_path, amount, status, payment) VALUES
('INV-2001', 1, 1, 'invoice-1001.pdf', 'demo/invoice-1001.pdf', 25000.00, 'Approved',      'Paid'),
('INV-2002', 2, 1, 'invoice-1002.pdf', 'demo/invoice-1002.pdf', 12500.00, 'Pending Review','Pending'),
('INV-2003', 4, 3, 'invoice-1004.pdf', 'demo/invoice-1004.pdf', 42000.00, 'Approved',      'Pending');
