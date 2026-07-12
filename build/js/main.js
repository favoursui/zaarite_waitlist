const initialSubmitHtml = document.getElementById('submit-btn')?.innerHTML;

const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submit-btn');
const errorMsg = document.getElementById('error-msg');
const successBox = document.getElementById('success-box');
const successEmail = document.getElementById('success-email');
const countEl = document.getElementById('count');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}
function clearError() {
  errorMsg.classList.add('hidden');
}

async function requestWaitlist(options = {}) {
  const { headers, ...fetchOptions } = options;
  const response = await fetch('/api/waitlist', {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function loadCount() {
  try {
    const data = await requestWaitlist();
    countEl.textContent = Number(data.total || 0).toLocaleString();
  } catch (e) {
    countEl.textContent = '—';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const email = emailInput.value.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showError('Enter a valid email address.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Joining…';

  try {
    await requestWaitlist({
      method: 'POST',
      body: JSON.stringify({ email })
    });

    successEmail.textContent = email;
    form.classList.add('hidden');
    successBox.classList.remove('hidden');
    loadCount();
  } catch (err) {
    console.error('Waitlist submit failed:', err);
    if (err.status === 409) {
      showError('That email is already on the list.');
    } else if (err.status === 400) {
      showError('Enter a valid email address.');
    } else {
      showError('Something went wrong. Try again.');
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = initialSubmitHtml || 'Join Waitlist';
  }
});

loadCount();
