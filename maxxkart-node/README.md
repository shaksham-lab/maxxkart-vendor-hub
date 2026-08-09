# Maxxkart – Vendor Management System (HTML + CSS + JavaScript + Node.js + Express + MySQL)

This folder is a **complete standalone version** of the project using only the stack you asked for.
No React, no build tools. Just plain files you can run on your own computer.

```
maxxkart-node/
├── server.js            # Node.js + Express backend (all API routes)
├── db.js                # MySQL connection pool
├── package.json         # Dependencies
├── .env.example         # Copy to .env and fill your MySQL password
├── database/
│   └── schema.sql       # Creates the database, tables and demo data
└── public/              # Frontend (plain HTML, CSS, JavaScript)
    ├── index.html       # Login + vendor registration
    ├── admin.html       # Admin dashboard (vendors, orders, invoices)
    ├── vendor.html      # Vendor portal (profile, orders, invoices)
    ├── css/style.css    # Purple & white design system
    └── js/
        ├── common.js    # Shared helper functions (API calls, badges, money)
        ├── login.js     # Login page logic
        ├── admin.js     # Admin page logic
        └── vendor.js    # Vendor page logic
```

## How to run on your computer

### 1. Install the tools (once)
- **Node.js** (v18 or newer): https://nodejs.org
- **MySQL** (v8): https://dev.mysql.com/downloads/  (MySQL Workbench is handy too)

### 2. Create the database
Open a terminal in this folder and run:

```bash
mysql -u root -p < database/schema.sql
```

(Or open `database/schema.sql` in MySQL Workbench and press the lightning bolt to run it.)

This creates a database called `maxxkart` with all tables and some demo data.

### 3. Configure the connection
```bash
cp .env.example .env      # Windows: copy .env.example .env
```
Open `.env` and put your MySQL password in `DB_PASSWORD`.

### 4. Install dependencies
```bash
npm install
```

### 5. Start the server
```bash
npm start
```

Now open http://localhost:3000 in your browser.

### Demo logins
| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Admin  | hellt5409@gmail.com  | Admin_123   |
| Vendor | vendor@vd.com        | Vendor_123  |

## How it works (short version)
- The browser loads plain HTML pages from `public/`.
- JavaScript in the browser calls the backend with `fetch()` (see `public/js/common.js`).
- Express receives those calls in `server.js` and talks to MySQL through `db.js`.
- Login state is kept in a signed cookie session (`express-session`).
- Uploaded invoice/document files are saved in the `uploads/` folder by `multer`.
