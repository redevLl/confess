// api/approve.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch {}
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const { error } = await supabase.from('confessions').update({ approved: true }).eq('id', id);
    if (error) return res.status(500).json({ error: 'db_error' });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
};
