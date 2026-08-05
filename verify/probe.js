"use strict";
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
 const p=await b.newPage();
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
 await p.goto(process.argv[2],{waitUntil:'networkidle0'}); await sleep(300);
 const g=()=>p.evaluate(()=>window.__game());
 await p.mouse.click(280,400); await sleep(200);
 await p.evaluate(()=>window.__debug.putBallInChamber());
 for(let i=0;i<20;i++){
   await sleep(300);
   const s=await g();
   console.log(i, 'phase='+s.phase,'chamberLeft='+s.chamberLeft,'bricksLeft='+s.bricksLeft,'lives='+s.lives,'autoplay='+s.autoStreak,'balls='+s.balls.length, s.balls[0]?('(',s.balls[0].x,s.balls[0].y+')'):'');
   if(s.phase==='won') break;
 }
 await b.close();
})();
