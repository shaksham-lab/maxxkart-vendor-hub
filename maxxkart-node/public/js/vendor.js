/** vendor.js — everything the vendor page does. */

let myVendor = null;

(async function start() {
  const me = await requireRole('vendor');
  if (!me) return;
  myVendor = me.vendor;
  setupProfile(me.user, me.vendor);
  fillProfileForm();

  setupNav('orders', (page) => {
    if (page === 'orders') loadOrders();
    if (page === 'invoices') loadInvoices();
    if (page === 'profile') loadDocuments();
  });
})();

/* ---------------- ORDERS ---------------- */
async function loadOrders() {
  const orders = await api('/api/orders');
  document.getElementById('orderRows').innerHTML = orders.map((o) => `
    <tr>
      <td><strong>${esc(o.po_number)}</strong></td>
      <td class="muted">${o.items.map((i) => `${esc(i.name)} ×${i.qty}`).join(', ')}</td>
      <td>${money(o.total)}</td>
      <td>${badge(o.status)}</td>
      <td class="muted">${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${o.status === 'Pending' ? `<button class="small" onclick="markDelivered(${o.id})">Mark delivered</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No orders yet.</td></tr>';
}

async function markDelivered(id) {
  await api(`/api/orders/${id}/status`, { method: 'PUT', body: { status: 'Delivered' } });
  toast('Marked as delivered');
  loadOrders();
}

/* ---------------- INVOICES ---------------- */
async function loadInvoices() {
  const orders = await api('/api/orders');

  // You can only invoice an order you have already delivered.
  document.getElementById('invPO').innerHTML = orders
    .filter((o) => o.status === 'Delivered')
    .map((o) => `<option value="${o.id}">${esc(o.po_number)} — ${money(o.total)}</option>`).join('')
    || '<option value="">No delivered orders</option>';

  const invoices = await api('/api/invoices');
  document.getElementById('invoiceRows').innerHTML = invoices.map((i) => `
    <tr>
      <td><strong>${esc(i.invoice_number)}</strong></td>
      <td>${esc(i.po_number)}</td>
      <td>${money(i.amount)}</td>
      <td>${badge(i.status)}</td>
      <td>${badge(i.payment)}</td>
      <td><a href="/uploads/${esc(i.file_path)}" target="_blank">${esc(i.file_name)}</a></td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">No invoices yet.</td></tr>';
}

document.getElementById('uploadInvoice').onclick = async () => {
  const file = document.getElementById('invFile').files[0];
  const poId = document.getElementById('invPO').value;
  if (!file || !poId) return toast('Choose an order and a file');

  // FormData is how you send a file to the server.
  const form = new FormData();
  form.append('poId', poId);
  form.append('file', file);
  await api('/api/invoices', { body: form });

  document.getElementById('invFile').value = '';
  toast('Invoice uploaded');
  loadInvoices();
};

/* ---------------- PROFILE ---------------- */
function fillProfileForm() {
  if (!myVendor) return;
  p_name.value = myVendor.name;
  p_contactPerson.value = myVendor.contact_person;
  p_phone.value = myVendor.phone;
  p_email.value = myVendor.email;
  p_category.value = myVendor.category;
  p_gst.value = myVendor.gst;
  p_address.value = myVendor.address;
}

document.getElementById('saveProfile').onclick = async () => {
  if (!/^\d{10}$/.test(p_phone.value)) return toast('Phone must be 10 digits');
  await api('/api/my/profile', {
    method: 'PUT',
    body: {
      name: p_name.value, contactPerson: p_contactPerson.value, phone: p_phone.value,
      email: p_email.value, address: p_address.value,
    },
  });
  toast('Profile saved');
};

/* ---------------- DOCUMENTS ---------------- */
async function loadDocuments() {
  const docs = await api('/api/my/documents');
  document.getElementById('docRows').innerHTML = docs.map((d) => `
    <tr>
      <td>${esc(d.doc_type)}</td>
      <td><a href="/uploads/${esc(d.file_path)}" target="_blank">${esc(d.file_name)}</a></td>
      <td>${badge(d.status)}</td>
      <td class="muted">${new Date(d.uploaded_at).toLocaleDateString()}</td>
    </tr>`).join('') || '<tr><td colspan="4" class="muted">No documents uploaded.</td></tr>';
}

document.getElementById('uploadDoc').onclick = async () => {
  const file = document.getElementById('docFile').files[0];
  if (!file) return toast('Choose a file');
  const form = new FormData();
  form.append('docType', document.getElementById('docType').value);
  form.append('file', file);
  await api('/api/my/documents', { body: form });
  document.getElementById('docFile').value = '';
  toast('Document uploaded');
  loadDocuments();
};
