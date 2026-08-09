/** login.js — handles signing in and vendor registration. */

// Switch between the two forms
document.getElementById('showRegister').onclick = () => {
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('registerBox').classList.remove('hidden');
};
document.getElementById('showLogin').onclick = () => {
  document.getElementById('registerBox').classList.add('hidden');
  document.getElementById('loginBox').classList.remove('hidden');
};

// ---- Sign in ----
document.getElementById('loginBtn').onclick = async () => {
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  try {
    const { user } = await api('/api/login', {
      body: {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      },
    });
    // Send each role to its own page.
    location.href = user.role === 'admin' ? '/admin.html' : '/vendor.html';
  } catch (err) {
    errorEl.textContent = err.error || 'Could not sign in';
  }
};

// ---- Register a new vendor ----
document.getElementById('registerBtn').onclick = async () => {
  document.querySelectorAll('[data-err]').forEach((p) => (p.textContent = ''));

  const form = {
    name: r_name.value, contactPerson: r_contactPerson.value, phone: r_phone.value,
    email: r_email.value, category: r_category.value, address: r_address.value,
    gst: r_gst.value.toUpperCase(), password: r_password.value,
  };

  try {
    await api('/api/register', { body: form });
    toast('Registered! Wait for admin approval.');
    document.getElementById('showLogin').click();
  } catch (err) {
    // The server sends back { errors: { field: "message" } }
    const errors = err.errors || {};
    Object.keys(errors).forEach((field) => {
      const el = document.querySelector(`[data-err="${field}"]`);
      if (el) el.textContent = errors[field];
    });
    if (!Object.keys(errors).length) toast(err.error || 'Registration failed');
  }
};

// Pressing Enter in the login fields signs you in.
['email', 'password'].forEach((id) => {
  document.getElementById(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
});
