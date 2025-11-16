const { createClient } = require('@supabase/supabase-js');
module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code = (body.code||'').trim().toUpperCase();
    const secret = (body.secret||'').trim();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const roomQ = await supabase.from('party_rooms')
      .select('id, host_secret, status, max_players, duration_seconds')
      .eq('code', code).maybeSingle();
    const room = roomQ.data;
    if (!room) return res.status(404).json({ error:'not_found' });
    if (room.host_secret !== secret) return res.status(401).json({ error:'unauthorized' });
    if (room.status !== 'lobby') return res.status(409).json({ error:'not_lobby' });

    const membersQ = await supabase.from('party_members')
      .select('id, ready').eq('room_id', room.id);
    const members = membersQ.data || [];
    if (members.length < 3) return res.status(409).json({ error:'need_min_3' });
    if (members.length > room.max_players) return res.status(409).json({ error:'too_many' });
    const allReady = members.every(m => m.ready);
    if (!allReady) return res.status(409).json({ error:'not_all_ready' });

    const upd = await supabase.from('party_rooms')
      .update({ status:'writing', writing_started_at: new Date().toISOString() })
      .eq('id', room.id);
    if (upd.error) return res.status(500).json({ error:'update_failed' });

    return res.json({ ok:true });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
