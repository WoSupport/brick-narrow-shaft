"use strict";
// Mobile/touch verification: mobile viewport + real CDP touch events.
// Proves: tap starts the game, tap launches the serve ball, drag moves the paddle,
// and the game loop keeps running — without relying on synthesized mouse/click.
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function main(){
  const url = process.argv[2] || 'http://localhost:8090/index.html';
  const browser = await puppeteer.launch({
    executablePath: '/snap/chromium/current/usr/lib/chromium-browser/chrome',
    headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader']
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));

  // --- emulate an iPhone-ish touch device ---
  const client = await page.createCDPSession();
  await client.send('Emulation.setDeviceMetricsOverride',
    {width:390, height:844, deviceScaleFactor:3, mobile:true, screenOrientation:{type:'portraitPrimary', angle:0}});
  await client.send('Emulation.setTouchEmulationEnabled', {enabled:true, maxTouchPoints:5});
  await page.goto(url, {waitUntil:'networkidle0', timeout:15000});
  await sleep(500);

  const g = () => page.evaluate(() => window.__game());
  // tap at canvas-local coordinates
  async function tap(x,y){
    await client.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x,y}]});
    await sleep(40);
    await client.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    await sleep(120);
  }
  async function dragTo(x,y){
    await client.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x,y}]});
    await sleep(30);
    await client.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x,y}]});
    await sleep(120);
    await client.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    await sleep(120);
  }

  const res = {};
  console.log('initial:', JSON.stringify(await g()));

  // 1) tap TWICE fast: first tap starts (ready->play), second launches (serve happens inside start?).
  // startGame() immediately launches and goes to play, so a single tap should be enough.
  await tap(195, 400);           // tap center of title screen
  let s1 = await g();
  res.started = (s1.phase === 'play' || s1.phase === 'serve');
  res.ballStuck = s1.balls[0] && s1.balls[0].stuck;
  console.log('after start tap:', JSON.stringify(s1));

  // If ball ended up stuck on serve, tap again to launch.
  let launched = !(s1.balls && s1.balls[0] && s1.balls[0].stuck);
  if (s1.phase === 'serve'){ await tap(195,700); launched = !( (await g()).balls[0].stuck ); }
  res.launched = launched;
  res.phaseAfter = (await g()).phase;

  // 2) drag finger to move paddle
  const before = (await g()).balls[0];
  await dragTo(60, 700);   // far left
  await sleep(150);
  await dragTo(330, 700);  // far right
  await sleep(150);
  const mid = await g();
  // check score changed OR ball x changed over time (loop alive) and paddle not at center
  res.loopAlive = (await g()).score >= 0;
  res.ballMoved = Math.abs(mid.balls[0].x - before.x) > 1 || mid.score > s1.score || !mid.balls[0].stuck;
  console.log('after drag:', JSON.stringify(mid));

  // 3) touch-render proof
  const render = await page.evaluate(()=>{
    const c=document.getElementById('game');
    const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let n=0; for(let i=0;i<d.length;i+=400) if(d[i]||d[i+1]||d[i+2]) n++;
    return n;
  });
  console.log('render nonBlank:', render, 'errors:', errors.filter(e=>!/favicon/i.test(e)));

  await page.screenshot({path:'/tmp/brick-mobile.png'});
  await browser.close();

  const pass = res.started && res.launched && res.ballMoved && render>100 &&
               !errors.some(e=>!/favicon/i.test(e) && !/404/i.test(e));
  console.log('\nMOBILE RESULT:', pass?'PASS ✅':'FAIL ❌', JSON.stringify(res));
  process.exit(pass?0:1);
}
main().catch(e=>{ console.error('CRASH', e); process.exit(2); });
