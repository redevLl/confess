const { createClient } = require('@supabase/supabase-js');

function randHex(bytes=16){
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
}

module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body=JSON.parse(req.body||'{}'); }catch{}
    const code = (body.code||'').trim().toUpperCase();
    const nickname = (body.nickname||'Anonymous').toString().slice(0,24);

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const roomQ = await supabase.from('party_rooms')
      .select('id, code, topic, round, status, created_at, expires_at, max_players, duration_seconds')
      .eq('code', code).maybeSingle();
    if (!roomQ.data) return res.status(404).json({ error:'not_found' });
    const room = roomQ.data;

    // mevcut üye sayısı
    const memQ = await supabase.from('party_members').select('id').eq('room_id', room.id);
    const count = memQ.data?.length || 0;
    if (count >= room.max_players) return res.status(409).json({ error:'room_full' });

    // client_token üret
    const client_token = randHex(16);

    // kaydet
    const ins = await supabase.from('party_members')
      .insert({ room_id: room.id, nickname, client_token })
      .select('id, nickname, ready, client_token').single();
    if (ins.error) return res.status(500).json({ error:'join_failed' });

    // tüm üyeleri (nickname+ready) döndür
    const membersQ = await supabase.from('party_members')
      .select('id, nickname, ready').eq('room_id', room.id).order('joined_at', { ascending:true });

    return res.json({
      room,
      me: ins.data,               // {id, nickname, ready, client_token}
      members: membersQ.data||[]
    });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
