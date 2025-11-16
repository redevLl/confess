const { createClient } = require('@supabase/supabase-js');
module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code = (body.code||'').trim().toUpperCase();
    const nickname = (body.nickname||'Anonymous').toString().slice(0,24);
    const text = (body.text||'').toString().slice(0,240);

    if (!code || !text) return res.status(400).json({ error:'bad_input' });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const { data:room } = await supabase.from('party_rooms')
      .select('id, round, status, expires_at').eq('code',code).maybeSingle();
    if (!room) return res.status(404).json({ error:'not_found' });
    if (new Date(room.expires_at) < new Date()) return res.status(410).json({ error:'expired' });
    if (room.status !== 'collecting') return res.status(409).json({ error:'not_collecting' });

    const { error:insErr } = await supabase.from('party_entries')
      .insert({ room_id: room.id, round: room.round, nickname, text });
    if (insErr) return res.status(500).json({ error:'insert_failed' });

    return res.json({ ok:true });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
