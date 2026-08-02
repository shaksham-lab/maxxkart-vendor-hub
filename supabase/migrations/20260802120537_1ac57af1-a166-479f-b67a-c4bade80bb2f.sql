
INSERT INTO public.vendors (id, name, contact_person, phone, email, category, address, gst, status, rejection_reason, created_at) VALUES
('11111111-1111-4111-8111-000000000001','Fresh Farms Produce','Ravi Menon','9876543210','contact@freshfarms.in','Groceries','21 Market Road, Kochi','29ABCDE1234F1Z5','Active',NULL, now() - interval '150 days'),
('11111111-1111-4111-8111-000000000002','Amrit Dairy Co.','Sneha Patil','9812345678','sales@amritdairy.in','Dairy','La Plaza, Pune','27AAECD1234K1Z9','Active',NULL, now() - interval '130 days'),
('11111111-1111-4111-8111-000000000003','Golden Crust Bakery','Imran Sheikh','9900112233','orders@goldencrust.in','Bakery','9 Baker Street, Mumbai','27AAGCB5678L1Z2','Active',NULL, now() - interval '110 days'),
('11111111-1111-4111-8111-000000000004','CleanHome Supplies','Meera Nair','9765432180','hello@cleanhome.in','Household','Sector 18, Noida','09AACCH9012M1Z7','Active',NULL, now() - interval '90 days'),
('11111111-1111-4111-8111-000000000005','VoltEdge Electronics','Karthik Rao','9845098450','biz@voltedge.in','Electronics','MG Road, Bengaluru','29AABCV3456N1Z4','Active',NULL, now() - interval '70 days'),
('11111111-1111-4111-8111-000000000006','Sunrise Organics','Divya Sharma','9711122233','info@sunriseorganics.in','Groceries','Karol Bagh, Delhi','07AAFCS7890P1Z1','Pending',NULL, now() - interval '9 days'),
('11111111-1111-4111-8111-000000000007','Metro Cold Storage','Anil Kumar','9822011223','anil@metrocold.in','Dairy','Wakad, Pune','27AAJCM2345Q1Z8','Pending',NULL, now() - interval '3 days'),
('11111111-1111-4111-8111-000000000008','QuickPack Traders','Rohit Verma','9090909090','rohit@quickpack.in','Household','Ambattur, Chennai','33AAKCQ6789R1Z3','Rejected','Incomplete GST documentation submitted.', now() - interval '40 days');

INSERT INTO public.purchase_orders (id, po_number, vendor_id, total, status, created_at) VALUES
('22222222-2222-4222-8222-000000000001','PO-2601-0001','11111111-1111-4111-8111-000000000001',48500,'Completed', now() - interval '150 days'),
('22222222-2222-4222-8222-000000000002','PO-2602-0002','11111111-1111-4111-8111-000000000002',32000,'Completed', now() - interval '120 days'),
('22222222-2222-4222-8222-000000000003','PO-2603-0003','11111111-1111-4111-8111-000000000003',18750,'Completed', now() - interval '95 days'),
('22222222-2222-4222-8222-000000000004','PO-2604-0004','11111111-1111-4111-8111-000000000004',26400,'Completed', now() - interval '62 days'),
('22222222-2222-4222-8222-000000000005','PO-2605-0005','11111111-1111-4111-8111-000000000005',91000,'Delivered', now() - interval '31 days'),
('22222222-2222-4222-8222-000000000006','PO-2606-0006','11111111-1111-4111-8111-000000000001',54300,'Delivered', now() - interval '12 days'),
('22222222-2222-4222-8222-000000000007','PO-2606-0007','11111111-1111-4111-8111-000000000002',21500,'Pending', now() - interval '5 days'),
('22222222-2222-4222-8222-000000000008','PO-2606-0008','11111111-1111-4111-8111-000000000003',13200,'Pending', now() - interval '1 day');

INSERT INTO public.po_items (po_id, name, qty, price) VALUES
('22222222-2222-4222-8222-000000000001','Tomatoes (crate)',100,285),
('22222222-2222-4222-8222-000000000001','Onions (sack)',80,250),
('22222222-2222-4222-8222-000000000002','Full Cream Milk (crate)',200,160),
('22222222-2222-4222-8222-000000000003','Whole Wheat Bread',750,25),
('22222222-2222-4222-8222-000000000004','Floor Cleaner 5L',120,220),
('22222222-2222-4222-8222-000000000005','LED Bulb 9W',700,130),
('22222222-2222-4222-8222-000000000006','Potatoes (sack)',150,362),
('22222222-2222-4222-8222-000000000007','Paneer 1kg',100,215),
('22222222-2222-4222-8222-000000000008','Croissant (dozen)',120,110);

INSERT INTO public.invoices (invoice_number, po_id, vendor_id, file_path, file_name, amount, status, payment, uploaded_at, paid_at) VALUES
('INV-2601-0001','22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000001','demo/inv-0001.pdf','freshfarms-jan.pdf',48500,'Approved','Paid', now() - interval '148 days', now() - interval '140 days'),
('INV-2602-0002','22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000002','demo/inv-0002.pdf','amritdairy-feb.pdf',32000,'Approved','Paid', now() - interval '118 days', now() - interval '112 days'),
('INV-2603-0003','22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000003','demo/inv-0003.pdf','goldencrust-mar.pdf',18750,'Approved','Paid', now() - interval '93 days', now() - interval '88 days'),
('INV-2604-0004','22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000004','demo/inv-0004.pdf','cleanhome-apr.pdf',26400,'Approved','Paid', now() - interval '60 days', now() - interval '55 days'),
('INV-2605-0005','22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000005','demo/inv-0005.pdf','voltedge-may.pdf',91000,'Pending Review','Pending', now() - interval '28 days', NULL),
('INV-2606-0006','22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000001','demo/inv-0006.pdf','freshfarms-jun.pdf',54300,'Pending Review','Pending', now() - interval '9 days', NULL);

INSERT INTO public.vendor_documents (vendor_id, doc_type, file_path, file_name, status, reviewer_notes, uploaded_at, reviewed_at) VALUES
('11111111-1111-4111-8111-000000000001','GST','demo/ff-gst.pdf','gst-certificate.pdf','Verified',NULL, now() - interval '149 days', now() - interval '147 days'),
('11111111-1111-4111-8111-000000000001','PAN','demo/ff-pan.pdf','pan-card.pdf','Verified',NULL, now() - interval '149 days', now() - interval '147 days'),
('11111111-1111-4111-8111-000000000002','GST','demo/ad-gst.pdf','gst-certificate.pdf','Verified',NULL, now() - interval '129 days', now() - interval '128 days'),
('11111111-1111-4111-8111-000000000006','GST','demo/so-gst.pdf','gst-certificate.pdf','Pending',NULL, now() - interval '8 days', NULL),
('11111111-1111-4111-8111-000000000006','Registration','demo/so-reg.pdf','company-registration.pdf','Pending',NULL, now() - interval '8 days', NULL),
('11111111-1111-4111-8111-000000000007','PAN','demo/mc-pan.pdf','pan-card.pdf','Pending',NULL, now() - interval '3 days', NULL),
('11111111-1111-4111-8111-000000000008','GST','demo/qp-gst.pdf','gst-certificate.pdf','Rejected','Document was unreadable.', now() - interval '39 days', now() - interval '38 days');
