
## Goal

Turn the current localStorage prototype into a real interactive app with a proper backend, email notifications, document upload + verification, report exports, and richer analytics — keeping the existing purple/white design.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud and replace `src/lib/store.tsx` (localStorage) with real Supabase-backed data + auth.

Tables (all with RLS + `user_roles` pattern):
- `profiles` — id (auth.users), email, full_name
- `user_roles` — user_id, role ('admin' | 'vendor')
- `vendors` — id, owner_user_id, name, contact_person, phone, email, category, address, gst, status ('Pending'|'Active'|'Rejected'), rejection_reason
- `vendor_documents` — id, vendor_id, doc_type ('GST'|'PAN'|'Registration'|'Other'), file_path, status ('Pending'|'Verified'|'Rejected'), reviewer_notes, uploaded_at
- `purchase_orders` — id, vendor_id, total, status ('Pending'|'Delivered'|'Completed'), created_at
- `po_items` — id, po_id, name, qty, price
- `invoices` — id, po_id, vendor_id, file_path, amount, status ('Pending Review'|'Approved'|'Rejected'), payment ('Pending'|'Paid'), uploaded_at

Storage buckets (private, signed URLs):
- `vendor-docs`
- `invoices`

Auth: email + password. First admin seeded via SQL by email. Vendor signup creates a Pending vendor row + user_role='vendor'.

## 2. Email notifications (Lovable Emails)

Prompt for domain setup, then scaffold app-email templates and trigger on:
- Vendor approved / rejected
- New PO created (to vendor)
- Vendor marks PO delivered (to admin)
- Invoice uploaded (to admin)
- Invoice approved / rejected / paid (to vendor)
- Document verified / rejected (to vendor)

All sends run in server functions with `sendTemplateEmail` and idempotency keys.

## 3. Document upload + verification

- Vendor Profile → new "Documents" section: upload GST, PAN, Registration certificate (PDF/image) to `vendor-docs` bucket.
- Admin Vendor detail page → "Documents" tab listing each doc with preview link (signed URL), Verify / Reject buttons + notes.
- Vendor cannot be moved to Active until at least GST document is Verified (soft rule shown in UI).

## 4. Invoice file upload

Replace fake filename with real upload to `invoices` bucket; admin invoice list shows a "View file" signed link.

## 5. PDF / Excel report exports

Admin pages get an "Export" menu:
- Vendors list → CSV/XLSX + PDF
- Purchase Orders → CSV/XLSX + PDF
- Invoices & Payments → CSV/XLSX + PDF

Client-side using `xlsx` (Excel/CSV) and `jspdf` + `jspdf-autotable` (PDF) — no server dependency, works with the filtered/current view.

## 6. Analytics charts (admin dashboard)

Extend `/admin` with:
- KPI cards (kept, now live from DB)
- Spend by category (existing bar chart)
- Monthly spend trend (line chart, last 6 months)
- Invoice status breakdown (donut)
- Top 5 vendors by spend (horizontal bar)
- Payment aging (Pending 0-30 / 30-60 / 60+ days)

Using existing `recharts`.

## 7. UI/UX

- Keep purple/white system, cards, StatusBadge.
- Add loading skeletons and toasts for all async actions.
- Signed-in state drives header (already partially there).

## Technical notes

- All privileged writes go through `createServerFn` with `requireSupabaseAuth`; role check via `has_role(auth.uid(), 'admin')`.
- File uploads go browser → Supabase Storage; server fn records the row.
- Emails sent from server fns after the DB write succeeds.
- Migrations include `GRANT`s on every new public table per project rules.

## Scope kept out

RFQs, multi-approval, OCR, chatbots, multi-currency — unchanged.

## Delivery order

1. Enable Cloud + schema + auth migration + rewrite store hooks.
2. Wire vendors / POs / invoices to DB, keep UI.
3. Storage + document upload/verification + invoice file upload.
4. Email domain setup + templates + triggers.
5. Exports.
6. Extra analytics charts.

This is a large multi-step build; I'll execute the steps in order and check in after step 1 so you can verify auth/data before we layer on emails and docs.
