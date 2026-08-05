"use strict";
// START PROBE: on a fresh load, the ONLY ball must sit on the paddle (below the
// wall) — no ball may appear above the steel line until the slit is breached.
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
 const p=await b.newPage(); await p.setViewport({width:560,height:760});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto(process.argv[2],{waitUntil:'networkidle0'});
 await p.waitForFunction(()=>window.__game,{timeout:15000});
 const g=()=>p.evaluate(()=>window.__game());
 // sample early: 0.2s .. 2.5s — before the autopilot is expected to breach (it takes a few rallies)
 let bad=[];
 for(let i=0;i<14;i++){
   await sleep(180);
   const s=await g(); if(!s) continue;
   // chamber floor y = 64 + cfg.chamber*22. If any ball has y < floor - 10, it's "up above steel line"
   const floorY = 64 + 3*22; // level 1 chamber=3
   const above = (s.balls||[]).filter(b2=>b2.y < floorY - 14).length;
   if (above>0){ bad.push({t_ms:i*180+180, above}); }
 }
 const fin=await g();
 console.log('demo balls above steel line in first ~2.5s:', bad.length?JSON.stringify(bad):'NONE ✅');
 console.log('final phase:', fin.phase, 'level:', fin.level, 'bricksLeft:', fin.bricksLeft);
 console.log('errors:', errs.length?errs:'none');
 await p.screenshot({path:'/tmp/brick-start.png'});
 await b.close();
 const pass = bad.length===0;
 console.log('START PROBE:', pass?'PASS ✅ (no early chamber ball)':'FAIL ❌');
 process.exit(pass?0:1);
})();
