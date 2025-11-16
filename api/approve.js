// api/approve.js
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'missing id' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    const { error } = await supabase
      .from('confessions')
      .update({ approved: true })
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'db_error' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
