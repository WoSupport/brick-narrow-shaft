"use strict";
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await puppeteer.launch({executablePath:'/snap/chromium/current/usr/lib/chromium-browser/chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']});
 const p=await b.newPage(); await p.setViewport({width:560,height:760});
 await p.goto(process.argv[2],{waitUntil:'networkidle0'}); await sleep(400);
 const g=()=>p.evaluate(()=>window.__game());
 // level 1 ready (title screen)
 await p.screenshot({path:'/tmp/lvl1.png'});
 const l1=await g(); console.log('L1:',l1.name,l1.shafts,l1.chamberLeft);
 // advance to level 3 and 4, capture ready screens
 for(const [lv,f] of [[3,'/tmp/lvl3.png'],[4,'/tmp/lvl4.png']]){
   await p.evaluate(()=>{window.__debug.goNext();});
   if(lv===3){} else {await p.evaluate(()=>{window.__debug.goNext();});}
   await sleep(300);
   await p.screenshot({path:f});
   const s=await g(); console.log('L'+lv+':',s.name,s.shafts,'chamberLeft='+s.chamberLeft);
 }
 await b.close();
})();
