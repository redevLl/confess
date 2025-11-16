const { createClient } = require('@supabase/supabase-js');

function randCode(n=6){
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for (let i=0;i<n;i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return s;
}
function randHex(bytes=16){
  return [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
}

module.exports = async (req, res) => {
  try{
    if (req.method !== 'POST') return res.status(405).json({ error:'method_not_allowed' });
    const origin = req.headers.origin || '';
    if (!origin.includes('confess-gray.vercel.app')) return res.status(403).json({ error:'forbidden' });

    let body={}; try{ body = JSON.parse(req.body||'{}'); }catch{}
    const topic   = (body.topic||'').toString().slice(0,80);
    let   maxP    = Number(body.maxPlayers||5);
    let   durSec  = Number(body.durationSeconds||0);

    if (isNaN(maxP) || maxP<3 || maxP>10) maxP = 5;
    if (isNaN(durSec) || durSec<0 || durSec>3600) durSec = 0;

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    let code, host_secret, ok=false, tries=0;

    while(!ok && tries<5){
      code = randCode(6);
      host_secret = randHex(16);
      const ins = await supabase.from('party_rooms').insert({
        code, host_secret, topic, max_players: maxP, duration_seconds: durSec, status:'lobby'
      }).select('id').single();
      if (!ins.error) ok=true; else tries++;
    }
    if (!ok) return res.status(500).json({ error:'create_failed' });

    const joinUrl = `https://confess-gray.vercel.app/party.html?code=${code}`;
    const hostUrl = `https://confess-gray.vercel.app/party.html?code=${code}&host=1&secret=${host_secret}`;
    return res.json({ code, topic, maxPlayers:maxP, durationSeconds:durSec, joinUrl, hostUrl });
  }catch{
    return res.status(500).json({ error:'server_error' });
  }
};
