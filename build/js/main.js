const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = window.__SUPABASE_CONFIG__ || {};
const initialSubmitHtml = document.getElementById('submit-btn')?.innerHTML;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase config missing — did you run "npm run build" with SUPABASE_URL / SUPABASE_ANON_KEY set?');
}

const supabaseClient = SUPABASE_URL && SUPABASE_ANON_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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

async function loadCount() {
  if (!supabaseClient) {
    countEl.textContent = '—';
    return;
  }

  try {
    const { data, error } = await supabaseClient.from('waitlist_count').select('total').single();
    if (error || !data) throw error;
    countEl.textContent = data.total.toLocaleString();
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
    if (!supabaseClient) {
      throw new Error('Supabase config missing');
    }

    const { error } = await supabaseClient.from('waitlist_emails').insert({ email });

    if (error) {
      console.error('Supabase insert failed:', error);
      if (error.code === '23505') {
        showError('That email is already on the list.');
      } else {
        showError('Something went wrong. Try again.');
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = initialSubmitHtml || 'Join Waitlist';
      return;
    }

    successEmail.textContent = email;
    form.classList.add('hidden');
    successBox.classList.remove('hidden');
    loadCount();
  } catch (err) {
    console.error('Waitlist submit failed:', err);
    showError('Network error. Try again.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = initialSubmitHtml || 'Join Waitlist';
  }
});

loadCount();
