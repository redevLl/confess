// api/pending.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    // 1) Admin token kontrolü
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // 2) Service role ile pendingleri çek
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'db_error' });
    return res.json({ data });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
