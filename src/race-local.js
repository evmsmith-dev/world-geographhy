// World Geography Quiz: a stand-in for Firebase, for the automatic tests of Race a friend (see raceLocalBackend in src/20-race.js).
// Players never use it. It runs as a shared worker, so every tab of the game talks to the same copy of each race,
// and it takes one change at a time like Firebase does: a change made from an old copy of a race is refused, and the tab tries again.
'use strict';
const races = {}, ports = [];
self.onconnect = e => {
  const port = e.ports[0]; ports.push(port);
  const tell = code => { for(const p of ports) p.postMessage({code, rec: races[code].rec, ver: races[code].ver}); };
  port.onmessage = m => {
    const {id, op, code, ver, rec, seat, on} = m.data, cur = races[code] || {ver: 0, rec: null};
    let reply = cur;
    if(op === 'cas'){ // compare and set: only if nobody changed it since `ver`
      if(ver !== cur.ver) reply = {ok: false, ...cur};
      else { races[code] = {ver: cur.ver + 1, rec}; reply = {ok: true, ...races[code]}; tell(code); }
    } else if(op === 'presence' && cur.rec){
      races[code] = {ver: cur.ver + 1, rec: {...cur.rec, presence: {...cur.rec.presence, [seat]: on}}}; reply = races[code]; tell(code);
    }
    if(id) port.postMessage({id, reply});
  };
};
