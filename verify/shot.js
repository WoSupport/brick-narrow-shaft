"use strict";
const puppeteer = require('puppeteer-core');
(async()=>{
  const browser = await puppeteer.launch({
    executablePath: '/snap/chromium/current/usr/lib/chromium-browser/chrome',
    headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewport({width:560, height:760});
  await page.goto(process.argv[2], {waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,500));
  await page.screenshot({path:'/tmp/brick-ready.png'});
  // also a mid-action: put ball in chamber for an action shot
  await page.evaluate(()=>window.__debug.putBallInChamber());
  await new Promise(r=>setTimeout(r,1500));
  await page.screenshot({path:'/tmp/brick-action.png'});
  await browser.close();
  console.log('screenshots saved');
})();
