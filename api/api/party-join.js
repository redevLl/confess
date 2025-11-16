const { createClient } = require('@supabase/supabase-js');
module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code = (body.code||'').trim().toUpperCase();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const { data, error } = await supabase.from('party_rooms')
      .select('id, code, topic, round, status, created_at, expires_at')
      .eq('code', code).maybeSingle();

    if (error || !data) return res.status(404).json({ error:'not_found' });
    if (new Date(data.expires_at) < new Date()) return res.status(410).json({ error:'expired' });

    return res.json({ room: data });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
