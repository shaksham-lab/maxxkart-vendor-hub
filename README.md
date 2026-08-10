# Maxxkart Vendor Hub

Build a simple, clean Vendor Management System web app for "Maxxkart", a supermarket. 

This is a 2-month internship project — keep the scope minimal and functional, not enterprise-heavy. 

Prioritize a clean, modern, visually STUNNING UI over feature count — this should look like a premium SaaS product, not a college project.

TECH STACK

- Frontend: React + JavaScript, HTML, CSS

- Backend: Node.js + Express.js

- Database: MySQL

USER ROLES (keep simple — just 2)

1. Admin (supermarket staff) — manages vendors, purchase orders, and payments

2. Vendor — views their own orders, uploads invoices, checks payment status

CORE FEATURES

1. Authentication

- Simple login/signup with email + password

- Role-based redirect (Admin dashboard vs Vendor dashboard)

- Make the login/signup page visually striking — split-screen layout with a bold purple gradient panel on one side and the form on the other

2. Vendor Management (Admin)

- Add / edit / view / deactivate vendors

- Vendor fields: Name, Contact Person, Phone, Email, Category (e.g. Groceries, Dairy, Bakery, Household, Electronics), Address, GST Number

- Vendor list with search and filter by category/status

3. Vendor Profile (Vendor login)

- View their own details

- View assigned purchase orders

- View invoice/payment status

4. Purchase Orders

- Admin creates a PO: select vendor, add items (name, quantity, price), auto-calculate total

- PO status: Pending → Delivered → Completed (use colored status pills/badges)

- Vendor can view POs assigned to them and mark as "Delivered"

5. Invoices & Payments

- Vendor uploads an invoice (simple file upload) against a delivered PO

- Admin marks invoice as Approved/Rejected

- Admin marks payment status: Pending / Paid

- Simple payment history table

6. Dashboard (Admin)

- Stat cards: total vendors, active POs, pending payments, this month's spend

- Simple bar/pie chart for spend by category

- Recent activity list (last 5 POs/invoices)

7. Dashboard (Vendor)

- Number of active/completed orders

- Payment status summary

DESIGN SYSTEM — PURPLE & WHITE THEME

Color palette:

- Primary purple: #7C3AED (vibrant violet — buttons, active states, key highlights)

- Deep purple: #4C1D95 (headers, sidebar background, hover states)

- Accent lavender: #EDE9FE (card backgrounds, subtle section fills)

- Soft lilac: #C4B5FD (secondary buttons, chart accents, tags)

- Background: #FAFAFC (near-white, slightly cool tone — not stark white)

- Text: #1E1B2E (near-black with a purple undertone) for headings, #6B7280 for secondary text

- Status colors: green (#10B981) for Paid/Completed, amber (#F59E0B) for Pending, red (#EF4444) for Rejected — used sparingly, only in badges

Visual style:

- Sidebar navigation (Admin) with deep purple background (#4C1D95), white icons/text, and a soft glow/highlight on the active menu item

- Vendor portal uses a lighter top-nav in white with purple accents instead of a sidebar

- Cards with soft rounded corners (16px radius), subtle drop shadows, and generous padding — avoid harsh borders

- Buttons: solid purple with rounded-full or rounded-xl shape, subtle hover lift/shadow animation

- Use gradient accents tastefully — e.g. a purple-to-violet gradient on the dashboard header banner, stat card icons, or the login screen

- Typography: a modern sans-serif (Inter or Poppins), bold confident headings, clear hierarchy

- Icons: consistent icon set (e.g. Lucide icons) in purple tones

- Tables: clean rows with alternating subtle lavender tint, sticky headers, hover row highlight

- Charts: use the purple palette (violet, lilac, deep purple) for a cohesive look instead of default rainbow chart colors

- Add subtle micro-interactions: smooth transitions, hover states, fade-ins on page load

- Empty states and loading states should be designed, not blank — friendly illustrations or icons in purple tones

- Overall feel: premium, trustworthy, modern fintech/SaaS aesthetic — think Stripe or Linear, but in purple

KEEP OUT OF SCOPE (do not build)

- RFQs, bidding, contract management

- Multi-level approval workflows

- AI features, OCR, chatbots

- Multi-currency/multi-language

- Advanced audit logs

Focus on a working, end-to-end flow: Admin adds vendor → creates PO → vendor delivers → vendor uploads invoice → admin approves & pays. The functionality should be simple and easy for non-technical staff to use, but the visual execution should feel high-end and polished.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://maxxkart-vendor-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed5eac51-8220-44df-a8a3-0f986cb0b21b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
