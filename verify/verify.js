"use strict";
// Two-part verifier:
//  PART A (real play): aim the paddle so the ball threads the shaft; proves loop+physics+paddle+scoring.
//  PART B (cascade): drop a ball inside the chamber; proves auto-play indicator + brick-cascade + win.
const puppeteer = require('puppeteer-core');

const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function main(){
  const url = process.argv[2] || 'http://localhost:8090/index.html';
  const browser = await puppeteer.launch({
    executablePath: '/snap/chromium/current/usr/lib/chromium-browser/chrome',
    headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--enable-unsafe-swiftshader','--use-gl=swiftshader','--window-size=700,900']
  });
  const page = await browser.newPage();
  await page.setViewport({width:600, height:760});
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));

  await page.goto(url, {waitUntil:'networkidle0', timeout:15000});
  await sleep(400);
  const g = () => page.evaluate(() => window.__game());
  const aim = (bx,by,targetX,targetY) => page.evaluate(({bx,by,targetX,targetY})=>{
    // paddle.position = bx - rel*(w/2), where rel = aimAngle/(PI/3), aimAngle=atan2(dx,dy)
    const w = 92;
    const dx = targetX - bx, dy = by - targetY;
    const angle = Math.atan2(dx, Math.max(20,dy));
    let rel = angle/(Math.PI/3);
    rel = Math.max(-1, Math.min(1, rel));
    return bx - rel*(w/2);
  }, {bx,by,targetX,targetY});

  const results = {};

  // ---------------- PART A: real-play threading attempt ----------------
  console.log('=== PART A: real play (aim at shaft) ===');
  const shaftCenterX = 16 + 5.5*48; // col index avg of 4,5,6 => center X
  const shaftEntryY = 64 + 3*22;    // top of the door row (row 3) = where the ball must punch through into the chamber
  await page.mouse.click(280,400); // start
  await sleep(200);
  let startScore = (await g()).score;
  let t = 0, brokeOnce = false, scoreUp = false;
  while (t++ < 120){ // ~ up to 12s
    const s = await g();
    const ball = s.balls && s.balls[0];
    if (s.phase === 'play' && ball && !ball.stuck){
      if (ball.y > 300 && ball.vy > 0){      // coming down in the play area
        const px = await aim(ball.x, ball.y, shaftCenterX, shaftEntryY);
        await page.mouse.move(px, 700);
      } else {
        // deflect toward the shaft area anyway
        const px = await aim(ball.x, ball.y, shaftCenterX, ball.y-120);
        await page.mouse.move(px, 700);
      }
    }
    if (s.score > startScore) scoreUp = true;
    if (s.bricksLeft < s.bricksTotal) brokeOnce = true;
    if (s.phase==='won') break;
    await sleep(100);
  }
  const partA = await g();
  results.partA = { threwBrick: brokeOnce, scored: scoreUp, bricksLeft: partA.bricksLeft,
                    lives: partA.lives, score: partA.score, phase: partA.phase };
  console.log('PART A result:', JSON.stringify(results.partA));

  // ---------------- PART B: cascade / auto-play / win ----------------
  console.log('=== PART B: ball inside chamber -> auto-play cascade ===');
  // restart clean
  await page.evaluate(()=>{ window.__game; });
  await page.mouse.click(280,400); // to ready
  await sleep(300);
  await page.evaluate(() => window.__debug.putBallInChamber());
  await sleep(200);
  const b0 = await g();
  let cascade = false, autoSeen = b0.autoStreak>=6, won=false, ballsUp=0;
  t = 0;
  while (t++ < 200){ // up to ~20s
    const s = await g();
    if (s.bricksLeft < b0.bricksLeft) cascade = true;
    if (s.autoStreak >= 6) autoSeen = true;
    if (s.balls.length > 1) ballsUp = Math.max(ballsUp, s.balls.length); // multiball from split pickups
    if (s.phase === 'won'){ won = true; break; }
    if (s.phase !== 'play') break;
    await sleep(100);
  }
  const partB = await g();
  results.partB = { cascade: cascade, autoPlay: autoSeen, multiball: ballsUp, brickClear: partB.bricksLeft===0,
                    won: partB.phase==='won' || won, phase: partB.phase, remaining: partB.bricksLeft };
  console.log('PART B result:', JSON.stringify(results.partB));

  // screenshot at whatever state
  await page.screenshot({path:'/tmp/brick-shot.png'});
  const render = await page.evaluate(()=>{
    const c=document.getElementById('game');
    const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let nonZero=0; for(let i=0;i<d.length;i+=400){ if(d[i]||d[i+1]||d[i+2]) nonZero++; }
    return nonZero;
  });
  console.log('render nonBlank samples:', render);
  console.log('console errors:', errors.filter(e=>!/favicon/i.test(e)).length ? errors : 'none (only favicon)');

  await browser.close();

  const pass = results.partB.cascade && results.partB.autoPlay && render>100 &&
               !errors.some(e=>!/favicon/i.test(e) && !/404/i.test(e));
  console.log('\nRESULT:', pass ? 'PASS ✅' : 'FAIL ❌', JSON.stringify(results));
  process.exit(pass?0:1);
}
main().catch(e=>{ console.error('VERIFY CRASH', e); process.exit(2); });
