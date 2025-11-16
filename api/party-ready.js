const { createClient } = require('@supabase/supabase-js');
module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code   = (body.code||'').trim().toUpperCase();
    const token  = (body.clientToken||'').trim();
    const ready  = !!body.ready;

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const roomQ = await supabase.from('party_rooms').select('id,status').eq('code', code).maybeSingle();
    if (!roomQ.data) return res.status(404).json({ error:'not_found' });
    if (roomQ.data.status !== 'lobby') return res.status(409).json({ error:'not_lobby' });

    const upd = await supabase.from('party_members')
      .update({ ready })
      .eq('room_id', roomQ.data.id)
      .eq('client_token', token);
    if (upd.error || upd.count===0) return res.status(401).json({ error:'unauthorized' });

    return res.json({ ok:true });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
