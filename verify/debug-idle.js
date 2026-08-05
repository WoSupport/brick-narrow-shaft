"use strict";
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
 const p=await b.newPage(); await p.setViewport({width:560,height:760});
 await p.goto(process.argv[2],{waitUntil:'networkidle0'});
 await p.waitForFunction(()=>window.__game,{timeout:15000});
 const g=()=>p.evaluate(()=>window.__game());
 for(let i=0;i<20;i++){
   await sleep(2500);
   const s=await g(); if(!s) continue;
   const ys=(s.balls||[]).map(b2=>Math.round(b2.y));
   console.log('t='+((i+1)*2.5)+'s phase='+s.phase+' level='+s.level+' bricksLeft='+s.bricksLeft+' chamberLeft='+s.chamberLeft+' balls='+(s.balls||[]).length+' auto='+s.autoStreak+' ballYs=['+ys.join(',')+']');
   if(s.phase==='won') break;
 }
 await b.close();
})();
