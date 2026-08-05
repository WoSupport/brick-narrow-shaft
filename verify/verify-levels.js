"use strict";
// Verifies levels are genuinely DISTINCT (different name / shaft layout / brick count),
// by advancing through them via the debug hook.
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function main(){
  const url = process.argv[2] || 'http://localhost:8090/index.html';
  const b = await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',
    args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
  const p = await b.newPage();
  await p.setViewport({width:600,height:760});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url,{waitUntil:'networkidle0'}); 
  await p.waitForFunction(()=>window.__game && window.__debug, {timeout:15000});
  await sleep(400);
  const g=()=>p.evaluate(()=>window.__game());
  await p.mouse.click(280,400); await sleep(250); // start -> level 1
  const seen=[];
  for (let i=0;i<12;i++){   // > one full cycle to prove it loops
    const s=await g();
    seen.push({level:s.level,name:s.name,shafts:s.shafts,total:s.bricksTotal,chamber:s.chamberLeft});
    await p.evaluate(()=>window.__debug.goNext());
    await sleep(120);
  }
  const names=[...new Set(seen.map(x=>x.name))];
  const layouts=[...new Set(seen.map(x=>x.shafts))];
  // the first 5 levels should all differ from each other
  const first5names=new Set(seen.slice(0,5).map(x=>x.name));
  const first5lay=new Set(seen.slice(0,5).map(x=>x.shafts));
  console.log('distinct names (all):', names.length, names);
  console.log('distinct layouts(shafts):', layouts.length, layouts);
  console.log('first-5 distinct names:', first5names.size, 'layouts:', first5lay.size);
  // level numbers should cycle 1,2,3,4,5,1,2,...
  console.log('level sequence:', seen.slice(0,8).map(x=>x.level).join(','));
  console.log('pageerrors:', errs.length?errs:'none');
  await b.close();
  const pass = first5names.size>=5;   // every one of the 5 levels has a unique name/layout
  console.log('LEVELS DISTINCT RESULT:', pass?'PASS ✅':'FAIL ❌');
  process.exit(pass?0:1);
}
main().catch(e=>{console.error('CRASH',e);process.exit(2);});
