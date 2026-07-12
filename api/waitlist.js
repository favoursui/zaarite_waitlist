const { createClient } = require('@supabase/supabase-js');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSupabaseClient() {
  const rawUrl = process.env.SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (status === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    return Promise.resolve(JSON.parse(req.body.toString() || '{}'));
  }

  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > 1024 * 8) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

async function getCount(supabase, res) {
  const { data, error } = await supabase
    .from('waitlist_count')
    .select('total')
    .single();

  if (error || !data) {
    console.error('Supabase count failed:', error);
    sendJson(res, 500, { error: 'Could not load waitlist count' });
    return;
  }

  sendJson(res, 200, { total: data.total });
}

async function addEmail(supabase, req, res) {
  let body;

  try {
    body = await readBody(req);
  } catch (error) {
    sendJson(res, 400, { error: 'Invalid request body' });
    return;
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!emailPattern.test(email) || email.length > 254) {
    sendJson(res, 400, { error: 'Enter a valid email address' });
    return;
  }

  const { error } = await supabase
    .from('waitlist_emails')
    .insert({ email });

  if (error) {
    console.error('Supabase insert failed:', error);

    if (error.code === '23505') {
      sendJson(res, 409, { error: 'That email is already on the list' });
      return;
    }

    sendJson(res, 500, { error: 'Could not join waitlist' });
    return;
  }

  sendJson(res, 201, { ok: true });
}

module.exports = async function waitlistHandler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET,POST,OPTIONS');
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET,POST,OPTIONS');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('Supabase environment variables are missing');
    sendJson(res, 500, { error: 'Waitlist is not configured' });
    return;
  }

  if (req.method === 'GET') {
    await getCount(supabase, res);
    return;
  }

  await addEmail(supabase, req, res);
};
