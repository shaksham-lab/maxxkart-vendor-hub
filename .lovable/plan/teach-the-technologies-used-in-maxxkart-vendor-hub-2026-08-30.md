# Teach the Technologies Used in Maxxkart Vendor Hub

## Goal
Give you a clear, practical understanding of every technology in the project by comparing the two versions side by side: the modern Lovable-hosted React app and the plain `maxxkart-node/` version you originally asked for.

## Approach
- Concept first: what the technology does and why it is used.
- Practical second: point to the exact file(s) where it lives in this project.
- Compare the two implementations of the same feature when possible.

## Outline

### 1. Frontend layer
- **HTML / JSX / React components**: how pages are built.
  - Plain version: `maxxkart-node/public/index.html`, `admin.html`, `vendor.html`.
  - Modern version: `src/routes/*.tsx` (TanStack file-based routing).
- **CSS / Tailwind CSS**: how the purple/white design is applied.
  - Plain version: `maxxkart-node/public/css/style.css`.
  - Modern version: `src/styles.css` (Tailwind v4 theme tokens).
- **JavaScript / TypeScript**: where logic lives.
  - Plain version: `maxxkart-node/public/js/*.js`.
  - Modern version: `src/**/*.tsx` and `src/lib/*.ts`.
- **React 19**: components, state, effects, and why it is used in the modern app.
- **Lucide icons**: consistent icon set in both versions.

### 2. Routing and navigation
- **Plain version**: Express serves static HTML files; navigation is normal links.
- **Modern version**: TanStack Router with file-based routes (`src/routes/admin.vendors.tsx` → `/admin/vendors`).
- How the URL decides which page renders.

### 3. State management and data fetching
- **Plain version**: browser `fetch()` calls the Express API; state is reloaded on each page load.
- **Modern version**: TanStack Query caches server data, React Context holds shared UI state in `src/lib/store.tsx`.
- Forms: React Hook Form + Zod validation in the modern app; manual validation in the plain app.

### 4. Backend layer
- **Node.js**: the runtime that runs JavaScript on the server.
- **Express.js**: the web framework that defines routes like `POST /api/login`.
  - Plain version: `maxxkart-node/server.js`.
  - Modern version: `src/lib/*.functions.ts` using `createServerFn` from TanStack Start.
- **Server functions vs REST endpoints**: when each approach is used.

### 5. Database layer
- **MySQL** (plain version): tables defined in `maxxkart-node/database/schema.sql`.
- **PostgreSQL / Supabase** (modern version): tables, RLS policies, and triggers managed through Lovable Cloud.
- Key tables in both: users, vendors, purchase_orders, po_items, invoices, vendor_documents.
- How relationships work: foreign keys, JOINs, and the data flow from UI → API → database.

### 6. Authentication and authorization
- **Plain version**: `express-session` with bcrypt-hashed passwords.
- **Modern version**: Supabase Auth with JWT tokens and role-based access via `user_roles` table.
- How admins and vendors are redirected to different dashboards.

### 7. File uploads and storage
- **Plain version**: `multer` saves files to the `uploads/` folder on disk.
- **Modern version**: Supabase Storage buckets (`vendor-docs`, `invoices`) with signed URLs.

### 8. Charts, exports, and extras
- **Charts**: Recharts in the modern app; a custom CSS bar chart in the plain app.
- **PDF / Excel exports**: `jspdf` + `jspdf-autotable` + `xlsx` in the modern app.
- **Email notifications**: `@lovable.dev/email-js` and `@react-email/components` in the modern app.

### 9. Build tools and deployment
- **Vite**: dev server and production bundler for the modern app (`vite.config.ts`).
- **TypeScript**: type checking and modern JavaScript features (`tsconfig.json`).
- **ESLint / Prettier**: code quality and formatting.
- **How to run locally**:
  - Modern app: `npm install` → `npm run dev`.
  - Plain version: create MySQL DB → `cp .env.example .env` → `npm install` → `npm start`.
- **Lovable Cloud**: what it provides (database, auth, storage) and how it differs from running MySQL on your own computer.

## Deliverable
A written lesson in chat that walks through each section above, with file references and short code snippets where helpful. No project files will be changed.
