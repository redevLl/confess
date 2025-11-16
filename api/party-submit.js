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

    const roomQ = await supabase.from('party_rooms')
      .select('id, round, status, duration_seconds, writing_started_at')
      .eq('code',code).maybeSingle();
    const room = roomQ.data;
    if (!room) return res.status(404).json({ error:'not_found' });
    if (room.status !== 'writing') return res.status(409).json({ error:'not_writing' });

    // (opsiyonel timer kontrolü)
    if (room.duration_seconds > 0 && room.writing_started_at){
      const left = room.duration_seconds - Math.floor((Date.now() - new Date(room.writing_started_at).getTime())/1000);
      if (left <= 0) return res.status(409).json({ error:'time_over' });
    }

    const ins = await supabase.from('party_entries')
      .insert({ room_id: room.id, round: room.round, nickname, text });
    if (ins.error) return res.status(500).json({ error:'insert_failed' });

    return res.json({ ok:true });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
