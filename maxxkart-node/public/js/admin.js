/** admin.js — everything the admin page does. */

let vendors = [];
let draftItems = [];   // items being added to a new purchase order
let vendorTab = 'All';

// ---- Start-up: check login, fill profile, wire the navigation ----
(async function start() {
  const me = await requireRole('admin');
  if (!me) return;
  setupProfile(me.user, null);

  // Reload the data of whichever page the admin opens.
  setupNav('dashboard', (page) => {
    if (page === 'dashboard') loadDashboard();
    if (page === 'vendors') loadVendors();
    if (page === 'orders') loadOrders();
    if (page === 'invoices') loadInvoices();
    if (page === 'documents') loadDocuments();
  });
})();

/* ---------------- DASHBOARD ---------------- */
async function loadDashboard() {
  const s = await api('/api/stats');

  document.getElementById('stats').innerHTML = `
    ${statCard('Active vendors', s.activeVendors)}
    ${statCard('Pending approvals', s.pendingVendors)}
    ${statCard('Purchase orders', s.totalOrders)}
    ${statCard('Paid', money(s.paidAmount))}
    ${statCard('Outstanding', money(s.pendingAmount))}`;

  drawBars('categoryChart', s.byCategory.map((r) => ({ label: r.category, value: Number(r.total), text: money(r.total) })));
  drawBars('statusChart',   s.byStatus.map((r) => ({ label: r.status, value: Number(r.count), text: r.count })));
}

const statCard = (label, value) => `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div></div>`;

// Draws a simple bar chart using div heights — no chart library needed.
function drawBars(elementId, data) {
  const max = Math.max(1, ...data.map((d) => d.value));
  document.getElementById(elementId).innerHTML = data.map((d) => `
    <div class="bar-col">
      <div class="bar-value">${d.text}</div>
      <div class="bar" style="height:${(d.value / max) * 100}%"></div>
      <div class="bar-label">${esc(d.label)}</div>
    </div>`).join('');
}

/* ---------------- VENDORS ---------------- */
async function loadVendors() {
  vendors = await api('/api/vendors');
  renderVendors();
}

document.getElementById('vendorTabs').onclick = (e) => {
  if (!e.target.dataset.tab) return;
  vendorTab = e.target.dataset.tab;
  document.querySelectorAll('#vendorTabs button').forEach((b) =>
    (b.className = 'small ' + (b.dataset.tab === vendorTab ? 'ghost' : 'outline')));
  renderVendors();
};

function renderVendors() {
  const list = vendorTab === 'All' ? vendors : vendors.filter((v) => v.status === vendorTab);
  document.getElementById('vendorRows').innerHTML = list.map((v) => `
    <tr>
      <td><strong>${esc(v.name)}</strong><br><span class="muted">${esc(v.email)}</span></td>
      <td>${esc(v.contact_person)}<br><span class="muted">${esc(v.phone)}</span></td>
      <td>${esc(v.category)}</td>
      <td>${esc(v.gst)}</td>
      <td>${badge(v.status)}${v.rejection_reason ? `<br><span class="muted">${esc(v.rejection_reason)}</span>` : ''}</td>
      <td>
        ${v.status !== 'Active'   ? `<button class="small" onclick="setVendorStatus(${v.id},'Active')">Approve</button>` : ''}
        ${v.status !== 'Rejected' ? `<button class="small danger" onclick="rejectVendor(${v.id})">Reject</button>` : ''}
      </td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No vendors here.</td></tr>';
}

async function setVendorStatus(id, status, reason) {
  await api(`/api/vendors/${id}/status`, { method: 'PUT', body: { status, reason } });
  toast('Vendor updated');
  loadVendors();
}
function rejectVendor(id) {
  const reason = prompt('Reason for rejection (optional):') || '';
  setVendorStatus(id, 'Rejected', reason);
}

/* ---------------- PURCHASE ORDERS ---------------- */
async function loadOrders() {
  if (!vendors.length) vendors = await api('/api/vendors');

  // Only approved vendors can receive an order.
  document.getElementById('poVendor').innerHTML = vendors
    .filter((v) => v.status === 'Active')
    .map((v) => `<option value="${v.id}">${esc(v.name)}</option>`).join('');

  const orders = await api('/api/orders');
  document.getElementById('orderRows').innerHTML = orders.map((o) => `
    <tr>
      <td><strong>${esc(o.po_number)}</strong></td>
      <td>${esc(o.vendor_name)}</td>
      <td class="muted">${o.items.map((i) => `${esc(i.name)} ×${i.qty}`).join(', ')}</td>
      <td>${money(o.total)}</td>
      <td>${badge(o.status)}</td>
      <td class="muted">${new Date(o.created_at).toLocaleDateString()}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No orders yet.</td></tr>';
}

document.getElementById('addItem').onclick = () => {
  const name = poItem.value.trim();
  const qty = Number(poQty.value);
  const price = Number(poPrice.value);
  if (!name || qty <= 0 || price <= 0) return toast('Fill item, quantity and price');
  draftItems.push({ name, qty, price });
  poItem.value = ''; poQty.value = 1; poPrice.value = 0;
  renderDraft();
};

function renderDraft() {
  document.getElementById('draftItems').innerHTML = draftItems.map((i, index) => `
    <tr>
      <td>${esc(i.name)}</td><td>×${i.qty}</td><td>${money(i.price)}</td>
      <td>${money(i.qty * i.price)}</td>
      <td><button class="small outline" onclick="removeItem(${index})">Remove</button></td>
    </tr>`).join('');
}
function removeItem(index) { draftItems.splice(index, 1); renderDraft(); }

document.getElementById('createPO').onclick = async () => {
  if (!draftItems.length) return toast('Add at least one item');
  await api('/api/orders', { body: { vendorId: poVendor.value, items: draftItems } });
  draftItems = []; renderDraft();
  toast('Purchase order created');
  loadOrders();
};

/* ---------------- INVOICES ---------------- */
async function loadInvoices() {
  const invoices = await api('/api/invoices');
  document.getElementById('invoiceRows').innerHTML = invoices.map((i) => `
    <tr>
      <td><strong>${esc(i.invoice_number)}</strong></td>
      <td>${esc(i.vendor_name)}</td>
      <td>${esc(i.po_number)}</td>
      <td>${money(i.amount)}</td>
      <td>${badge(i.status)}</td>
      <td>${badge(i.payment)}</td>
      <td><a href="/uploads/${esc(i.file_path)}" target="_blank">${esc(i.file_name)}</a></td>
      <td>
        ${i.status === 'Pending Review' ? `
          <button class="small" onclick="setInvoice(${i.id},'Approved')">Approve</button>
          <button class="small danger" onclick="setInvoice(${i.id},'Rejected')">Reject</button>` : ''}
        ${i.status === 'Approved' && i.payment === 'Pending' ? `
          <button class="small ghost" onclick="payInvoice(${i.id})">Mark paid</button>` : ''}
      </td>
    </tr>`).join('') || '<tr><td colspan="8" class="muted">No invoices yet.</td></tr>';
}
async function setInvoice(id, status) {
  await api(`/api/invoices/${id}/status`, { method: 'PUT', body: { status } });
  toast('Invoice ' + status); loadInvoices();
}
async function payInvoice(id) {
  await api(`/api/invoices/${id}/pay`, { method: 'PUT' });
  toast('Payment recorded'); loadInvoices();
}

/* ---------------- DOCUMENTS ---------------- */
async function loadDocuments() {
  const docs = await api('/api/documents');
  document.getElementById('documentRows').innerHTML = docs.map((d) => `
    <tr>
      <td>${esc(d.vendor_name)}</td>
      <td>${esc(d.doc_type)}</td>
      <td><a href="/uploads/${esc(d.file_path)}" target="_blank">${esc(d.file_name)}</a></td>
      <td>${badge(d.status)}</td>
      <td>
        <button class="small" onclick="setDoc(${d.id},'Verified')">Verify</button>
        <button class="small danger" onclick="setDoc(${d.id},'Rejected')">Reject</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" class="muted">No documents uploaded.</td></tr>';
}
async function setDoc(id, status) {
  await api(`/api/documents/${id}/status`, { method: 'PUT', body: { status } });
  toast('Document ' + status); loadDocuments();
}
