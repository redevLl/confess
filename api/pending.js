// api/pending.js
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

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const { data, error } = await supabase
      .from('confessions')
      .select('id, text, created_at')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'db_error' });
    return res.json({ data: data || [] });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
};
