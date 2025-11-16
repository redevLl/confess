const { createClient } = require('@supabase/supabase-js');
module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code = (body.code||'').trim().toUpperCase();

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const { data:room } = await supabase.from('party_rooms')
      .select('id, code, topic, round, status, expires_at, created_at')
      .eq('code', code).maybeSingle();
    if (!room) return res.status(404).json({ error:'not_found' });
    if (new Date(room.expires_at) < new Date()) return res.status(410).json({ error:'expired' });

    let entries = [];
    if (room.status === 'revealed'){
      const q = await supabase.from('party_entries')
        .select('id, text, nickname, created_at')
        .eq('room_id', room.id).eq('round', room.round)
        .order('created_at', { ascending:true });
      entries = q.data || [];
    } else {
      const q = await supabase.from('party_entries')
        .select('id')  // collecting sırasında sadece sayısını veririz
        .eq('room_id', room.id).eq('round', room.round);
      entries = Array(q.data?.length || 0).fill({});
    }

    return res.json({ room, entries });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
