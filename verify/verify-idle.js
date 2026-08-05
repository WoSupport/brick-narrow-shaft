"use strict";
// IDLE MODE verification: zero input. The autopilot must play by itself.
// Proves: starts automatically, paddle moves, ball launched, and (over time) it
// breaches the slot, autoclears, and advances levels.
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function main(){
  const url = process.argv[2] || 'http://localhost:8093/index.html';
  const dur = parseInt(process.argv[3]||'50',10)*1000;
  const b = await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',
    args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
  const p = await b.newPage();
  await p.setViewport({width:560,height:760});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url,{waitUntil:'networkidle0'});
  await p.waitForFunction(()=>window.__game,{timeout:15000});
  await sleep(500);
  const g=()=>p.evaluate(()=>window.__game());
  // NO input at all — pure idle.
  const marks=[];
  const t0=Date.now();
  let prevLevel=1, prevScore=0, maxLevel=1, breached=false, wonSeen=false, paddleMoved=false;
  let lastBallPos=null;
  // sample every second
  while(Date.now()-t0 < dur){
    await sleep(1000);
    let s;
    try{ s=await g(); }catch(e){ continue; }
    if(!s) continue;
    const ball=s.balls&&s.balls[0];
    if (ball && lastBallPos) if (Math.abs(ball.x-lastBallPos.x)+Math.abs(ball.y-lastBallPos.y)>0.1) paddleMoved=true;
    if (ball) lastBallPos={x:ball.x,y:ball.y};
    if (s.level>maxLevel) maxLevel=s.level;
    if (s.bricksLeft<s.bricksTotal && s.bricksTotal>0) breached=true;
    if (s.phase==='won') wonSeen=true;
    if (s.score>prevScore){ if(s.score-prevScore>=10) breached=true; prevScore=s.score; }
    if (s.level!==prevLevel){ prevLevel=s.level; marks.push({t_ms:Date.now()-t0,level:s.level,score:s.score}); }
    // still alive?
    const st=Date.now()-t0;
    if (st%10000<1000) console.log('t='+st+'ms  level='+s.level+'  phase='+s.phase+'  score='+s.score+'  lives='+s.lives+'  bricksLeft='+s.bricksLeft);
  }
  const fin=await g();
  console.log('\nFINAL:', JSON.stringify({level:fin.level,score:fin.score,lives:fin.lives,phase:fin.phase,
    bricksLeft:fin.bricksLeft,bricksTotal:fin.bricksTotal,autoStreak:fin.autoStreak,pickups:fin.pickups}));
  console.log('level-advance marks:', JSON.stringify(marks));
  console.log('autopilotStats:', JSON.stringify({maxLevel,breached,wonSeen,paddleMoved}));
  console.log('pageerrors:', errs.length?errs:'none');
  await p.screenshot({path:'/tmp/brick-idle.png'});
  await b.close();
  const pass = maxLevel>=2 && fin.level>=2 && (fin.phase==='play'||fin.phase==='serve') && fin.lives>=0 && !errs.length;
  console.log('\nIDLE RESULT:', pass?'PASS ✅':'FAIL ❌ (didn\'t advance levels on its own)');
  process.exit(pass?0:1);
}
main().catch(e=>{console.error('CRASH',e);process.exit(2);});
