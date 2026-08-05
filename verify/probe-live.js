"use strict";
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
 const p=await b.newPage(); await p.setViewport({width:560,height:760});
 const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR: '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
 await p.goto(process.argv[2],{waitUntil:'networkidle0',timeout:20000});
 try{ await p.waitForFunction(()=>window.__game,{timeout:15000}); }catch(e){console.log('no __game');}
 console.log('autoMode?', await p.evaluate(()=>{try{return window.__game().phase}catch(e){return 'ERR '+e.message}}));
 for(let i=0;i<10;i++){
   await sleep(1000);
   const s=await p.evaluate(()=>{try{const g=window.__game(); return {phase:g.phase,score:g.score,level:g.level,bricksLeft:g.bricksLeft,balls:g.balls.length,autoStreak:g.autoStreak};}catch(e){return {err:e.message};}});
   console.log(i,'s',JSON.stringify(s));
 }
 console.log('errors:',errs);
 await b.close();
})();
