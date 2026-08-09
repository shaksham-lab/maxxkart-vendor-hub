/**
 * common.js — small helpers used by every page.
 * Loaded before the page-specific script.
 */

// Call the backend. Example:  await api('/api/vendors')
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    method: options.method || (options.body ? 'POST' : 'GET'),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

// Show ₹ amounts in Indian format.
function money(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
}

// Turn a status word into a coloured badge.
function badge(status) {
  const colours = {
    Active: 'green', Approved: 'green', Paid: 'green', Verified: 'green', Completed: 'green',
    Pending: 'amber', 'Pending Review': 'amber', Delivered: 'purple',
    Rejected: 'red',
  };
  return `<span class="badge ${colours[status] || 'purple'}">${status}</span>`;
}

// Escape text before putting it inside HTML (stops broken layouts / XSS).
function esc(text) {
  return String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Little message in the bottom-right corner.
function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// Sends the user back to the login page if they are not logged in / wrong role.
async function requireRole(role) {
  const { user, vendor } = await api('/api/me');
  if (!user || user.role !== role) { location.href = '/'; return null; }
  return { user, vendor };
}

// Fills the top-right avatar dropdown and wires the click to open/close it.
function setupProfile(user, vendor) {
  document.getElementById('avatar').textContent = user.email[0].toUpperCase();
  document.getElementById('who').textContent = user.email;
  document.getElementById('role').textContent = vendor ? `${user.role} · ${vendor.category} · ${vendor.status}` : user.role;
  document.getElementById('avatar').onclick = () => document.getElementById('dropdown').classList.toggle('open');
  document.getElementById('logout').onclick = async () => { await api('/api/logout', { method: 'POST' }); location.href = '/'; };
}

// Simple page switcher: shows one <section data-page="..."> at a time.
function setupNav(defaultPage, onShow) {
  const show = (page) => {
    document.querySelectorAll('section[data-page]').forEach((s) => s.classList.toggle('hidden', s.dataset.page !== page));
    document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
    if (onShow) onShow(page);
  };
  document.querySelectorAll('.nav button').forEach((b) => (b.onclick = () => show(b.dataset.page)));
  show(defaultPage);
  return show;
}
