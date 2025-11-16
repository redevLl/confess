// party-next.js
const { createClient } = require('@supabase/supabase-js');
module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code = (body.code||'').trim().toUpperCase();
    const secret = (body.secret||'').trim();
    const newTopic = (body.topic||'').toString().slice(0,80)||null;

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const roomQ = await supabase.from('party_rooms')
      .select('id, host_secret, round').eq('code',code).maybeSingle();
    const room = roomQ.data;
    if (!room) return res.status(404).json({ error:'not_found' });
    if (secret !== room.host_secret) return res.status(401).json({ error:'unauthorized' });

    const upd = await supabase.from('party_rooms')
      .update({ status:'lobby', round: room.round + 1, topic: newTopic, writing_started_at: null })
      .eq('id', room.id);
    if (upd.error) return res.status(500).json({ error:'update_failed' });

    // herkesin ready=false
    await supabase.from('party_members').update({ ready:false }).eq('room_id', room.id);

    return res.json({ ok:true });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
