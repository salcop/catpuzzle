/* 냥이 대탈출 - core game
   Tap a cat -> it walks the way it faces. Blocked -> "콩!" (-1 heart). Clear the bathroom.
   - Tier schedule (Normal / Rest / Hard / Super Hard), always-solvable reverse generator
   - Hidden picture reveal, follow-the-leader chains, combo, churu fever, pickups
   - Boosters: hint / cushion shield / lift ; continue (+3 hearts)                     */
(function () {
  'use strict';
  const CELL = 56, MARGIN = 44, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  let dpr = 1, cw = 0, ch = 0, scale = 1, offX = 0, offY = 0, bg = null, tileCache = null;
  const S = { stage: 1, cols: 5, rows: 6, cats: [], grid: [], obs: [], pick: [], rev: [], pic: null, hearts: 3, maxHearts: 3, total: 0, out: 0, time: 0, state: 'idle',
    fx: [], prints: [], ripples: [], bubbles: [], words: [], confetti: [], hint: null, finger: null, info: null, kind: 'normal', tutorial: false,
    combo: 0, comboT: 0, bestCombo: 0, gauge: 0, fever: 0, score: 0, shake: 0, chatT: 2, shield: 0, revealAll: 0, bumps: 0, reward: 20, hooks: {} };
  const rand = (a, b) => a + Math.random() * (b - a);
  const emit = (h, ...v) => S.hooks[h] && S.hooks[h](...v);
  const sfx = (n, rate, vol) => emit('sfx', n, rate || 1, vol == null ? 1 : vol);
  const timers = []; const later = (fn, ms) => timers.push({ t: S.time + ms / 1000, fn });
  let seed = 1; const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ================= DIFFICULTY =================
  function tierOf(n) { if (n >= 20 && n % 20 === 0) return 'super'; if (n >= 10 && n % 5 === 0) return 'hard'; if (n > 10 && n % 5 === 1) return 'rest'; return 'normal'; }
  const TIER_REWARD = { normal: 20, rest: 15, hard: 45, super: 100 };
  function stageParams(n) {
    let d = Math.min(1, Math.log(1 + n / 3) / Math.log(1 + 40 / 3)); const kind = tierOf(n);
    if (kind === 'super') d = Math.min(1, d + .32); else if (kind === 'hard') d = Math.min(1, d + .18); else if (kind === 'rest') d = Math.max(0, d - .15);
    const size = n <= 2 ? [4, 5] : n <= 5 ? [5, 6] : d < .4 ? [5, 7] : kind === 'super' ? [7, 9] : [6, 8];
    return { d, kind, cols: size[0], rows: size[1], density: n === 1 ? .45 : .5 + .42 * d, depth: n === 1 ? 2 : 2 + Math.round(d * 12), inward: .3 + .7 * d,
      obstacles: n < 8 ? 0 : Math.round(d * 5), sleepy: n < 12 ? 0 : Math.round(d * 4), pickups: n < 3 ? 1 : 1 + (n % 2),
      order: n < 6 ? 0 : Math.min(9, 2 + Math.round(d * 7) + (kind === 'hard' ? 1 : kind === 'super' ? 2 : 0)),
      time: n < 8 ? 0 : 0, maxFree: n <= 3 ? 99 : Math.max(2, Math.round(7 - d * 5)) };
  }
  function pathHit(grid, obs, cols, rows, c, r, d) {
    let x = c + DX[d], y = r + DY[d];
    while (x >= 0 && x < cols && y >= 0 && y < rows) { if (obs[y][x]) return { x, y, obs: true }; if (grid[y][x] != null) return { x, y }; x += DX[d]; y += DY[d]; }
    return null;
  }
  function measure(cats, cols, rows, obs) {
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null)); cats.forEach(k => grid[k.r][k.c] = k.id);
    let left = cats.length, depth = 0, firstFree = 0;
    while (left > 0) {
      const free = cats.filter(k => grid[k.r][k.c] === k.id && !pathHit(grid, obs, cols, rows, k.c, k.r, k.dir));
      if (!free.length) return { depth: 99, firstFree }; if (depth === 0) firstFree = free.length;
      free.forEach(k => grid[k.r][k.c] = null); left -= free.length; depth++;
    }
    return { depth, firstFree };
  }
  // Reverse construction: every cat placed has a clear exit at placement time => always solvable.
  function buildOnce(P, s) {
    seed = s; const { cols, rows } = P;
    const obs = Array.from({ length: rows }, () => Array(cols).fill(0)), grid = Array.from({ length: rows }, () => Array(cols).fill(null)), cats = [];
    for (let i = 0; i < P.obstacles; i++) { const c = 1 + Math.floor(srand() * (cols - 2)), r = 1 + Math.floor(srand() * (rows - 2)); obs[r][c] = 1 + (i % 2); }
    const cells = [], cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!obs[r][c]) cells.push({ c, r, k: (1 - P.inward) * srand() * 6 + P.inward * (Math.abs(c - cx) + Math.abs(r - cy)) * (.8 + srand() * .4) });
    cells.sort((a, b) => a.k - b.k);
    const target = Math.round(cells.length * P.density);
    for (const { c, r } of cells) {
      if (cats.length >= target) break;
      const dirs = [0, 1, 2, 3].sort(() => srand() - .5);
      const chainD = dirs.filter(d => { const bc = c - DX[d], br = r - DY[d]; return bc >= 0 && br >= 0 && bc < cols && br < rows && grid[br][bc] != null && cats[grid[br][bc]].dir === d; });
      if (chainD.length && srand() < .55) dirs.unshift(chainD[0]);
      for (const d of dirs) if (!pathHit(grid, obs, cols, rows, c, r, d)) { const id = cats.length; grid[r][c] = id; cats.push({ id, c, r, dir: d, lvl: Math.floor(srand() * CatArt.CATS.length) }); break; }
    }
    return { obs, cats };
  }
  function generate(n) {
    const P = stageParams(n); let best = null;
    for (let a = 0; a < 70; a++) {
      const g = buildOnce(P, n * 7919 + a * 104729 + 17), m = measure(g.cats, P.cols, P.rows, g.obs);
      const score = Math.abs(m.depth - P.depth) * 3 + Math.abs(g.cats.length - P.cols * P.rows * P.density) * .2 + (m.firstFree < 2 ? 5 : 0) + Math.max(0, m.firstFree - P.maxFree) * 4;
      if (!best || score < best.score) best = { ...g, m, score };
    }
    // numbered cats: choose from successive removal layers -> order 1..k is always achievable
    if (P.order) {
      const layers = []; const grid = Array.from({ length: P.rows }, () => Array(P.cols).fill(null)); best.cats.forEach(k => grid[k.r][k.c] = k.id);
      let left = best.cats.slice();
      while (left.length) { const free = left.filter(k => !pathHit(grid, best.obs, P.cols, P.rows, k.c, k.r, k.dir)); if (!free.length) break; layers.push(free); free.forEach(k => grid[k.r][k.c] = null); left = left.filter(k => !free.includes(k)); }
      seed = n * 53 + 1; let num = 1; const picks = [];
      // spread numbers across layers (deeper numbers need earlier ones out first)
      for (let L = 0; L < layers.length && num <= P.order; L += Math.max(1, Math.floor(layers.length / P.order))) {
        const cand = layers[L].filter(k => !picks.includes(k)); if (!cand.length) continue;
        const k = cand[Math.floor(srand() * cand.length)]; k.num = num++; picks.push(k);
      }
      best.orderCount = num - 1;
    }
    seed = n * 31 + 5; const pool = best.cats.filter(k => !k.num).sort(() => srand() - .5);
    for (let i = 0; i < P.sleepy && i < pool.length; i++) pool[i].sleepy = true;
    best.cats.forEach(k => { const q = srand(); k.acc = q < .14 ? 'bubble' : q < .22 ? 'towel' : q < .27 ? 'duck' : null; });
    return { P, ...best };
  }

  // ================= STAGE =================
  function loadStage(n, pic) {
    const g = generate(n);
    const grid = Array.from({ length: g.P.rows }, () => Array(g.P.cols).fill(null));
    const cats = g.cats.map(k => ({ ...k, st: 'sit', x: k.c * CELL + CELL / 2, y: k.r * CELL + CELL / 2, t: 0, blinkT: rand(.5, 5), wob: 0, dizzy: 0, enter: rand(0, .35) }));
    cats.forEach(k => grid[k.r][k.c] = k.id);
    Object.assign(S, { stage: n, cols: g.P.cols, rows: g.P.rows, grid, obs: g.obs, cats, hearts: 3, maxHearts: 3, total: cats.length, out: 0, state: 'play', kind: g.P.kind, hearts: (g.P.kind === 'hard' || g.P.kind === 'super') ? 2 : 3, maxHearts: (g.P.kind === 'hard' || g.P.kind === 'super') ? 2 : 3,
      fx: [], prints: [], ripples: [], bubbles: [], words: [], confetti: [], hint: null, finger: null, info: { ...g.P, measured: g.m }, tutorial: false,
      combo: 0, comboT: 0, bestCombo: 0, gauge: 0, fever: 0, score: 0, shake: 0, chatT: 1.5, shield: 0, revealAll: 0, bumps: 0, reward: TIER_REWARD[g.P.kind], rescued: Array(CatArt.CATS.length).fill(0),
      nextNum: 1, orderCount: g.orderCount || 0, timeMax: 0, timeLeft: 0, mistakes: 0, timeAdds: 0, chain: 0, chainT: 0 });
    // butler timer: from level 8, based on solution length; harder tiers = tighter
    if (n >= 8) { const tf = { normal: 1.35, rest: 1.7, hard: 1.12, super: 1.0 }[g.P.kind]; S.timeMax = Math.round(Math.max(22, cats.length * tf + (g.orderCount || 0) * 1.5 + 6)); S.timeLeft = S.timeMax; }
    if (Game.outfitOf) cats.forEach(k => { const o = Game.outfitOf(k.lvl % CatArt.CATS.length); if (o) k.acc = o; });
    timers.length = 0;
    S.rev = Array.from({ length: g.P.rows }, () => Array(g.P.cols).fill(0));
    S.pick = Array.from({ length: g.P.rows }, () => Array(g.P.cols).fill(0));
    seed = n * 977 + 3; const empty = [];
    for (let r = 0; r < g.P.rows; r++) for (let c = 0; c < g.P.cols; c++) if (grid[r][c] == null && !g.obs[r][c]) empty.push([c, r]);
    empty.sort(() => srand() - .5).slice(0, Math.min(empty.length, g.P.pickups)).forEach(([c, r], i) => S.pick[r][c] = i % 3 === 2 ? 2 : 1);
    if (pic) S.pic = pic;
    tileCache = null; resize(); emit('hud'); emit('stage', S.info);
  }
  const cellXY = (c, r) => ({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 });
  const hit = k => pathHit(S.grid, S.obs, S.cols, S.rows, k.c, k.r, k.dir);
  const freeCats = () => S.cats.filter(k => k.st === 'sit' && !hit(k));
  const blockedCats = () => S.cats.filter(k => k.st === 'sit' && hit(k));

  // ================= CUTE FEEDBACK =================
  const VOICE = [1, 1.16, .96, 1.07, .9, 1.03, 1.11, .86];
  const LINES = { go: ['가자냥!', '탈출이다냥!', '야호~', '냥!', '안녕~'], follow: ['나도!', '같이 가!', '기다려냥!', '나도 나도!'], bump: ['콩!', '아야!', '꺅!'],
    grump: ['흥!', '뭐냥!', '비켜냥!', '으으…'], wake: ['냐…?', '으냥…', '5분만…'], nom: ['냠냠!', '츄르다!', '맛있다냥♥'],
    chat: ['목욕 싫어…', '물 무서워…', '냥?', '뽀송하고 싶다…', '나갈래냥', '흐냥…', '…!', '샴푸 냄새…'], fever: ['츄르 타임!', '신난다냥!'], safe: ['괜찮다냥~', '피버 무적!'] };
  const pickLine = k => LINES[k][Math.floor(Math.random() * LINES[k].length)];
  function say(k, kind, style, dur) { S.bubbles = S.bubbles.filter(b => b.cat !== k.id); S.bubbles.push({ cat: k.id, text: LINES[kind] ? pickLine(kind) : kind, style: style || 'round', life: dur || 1.1, max: dur || 1.1 }); }
  function word(x, y, text, col, size, rot) { const W = S.cols * CELL, H = S.rows * CELL; S.words.push({ x: Math.max(-MARGIN + 34, Math.min(W + MARGIN - 34, x)), y: Math.max(-MARGIN + 14, Math.min(H + MARGIN - 10, y)), text, col: col || '#FF7F95', size: size || 20, rot: rot ?? rand(-.25, .25), life: .9, max: .9 }); }
  function burstConfetti(n) { const W = S.cols * CELL; for (let i = 0; i < n; i++) S.confetti.push({ x: rand(0, W), y: rand(-MARGIN - 80, -MARGIN), vx: rand(-40, 40), vy: rand(60, 200), r: rand(0, 6), vr: rand(-6, 6), s: rand(5, 9), c: ['#FF9CB5', '#FFD457', '#9FE0C8', '#8FC4F0', '#C9A8F0'][i % 5], kind: i % 4, life: 3.5 }); }
  function addCombo() {
    S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = S.fever > 0 ? 1.4 : 1.0; S.bestCombo = Math.max(S.bestCombo, S.combo);
    S.score += 10 * S.combo * (S.fever > 0 ? 2 : 1);
    if (S.fever <= 0) S.gauge = Math.min(1, S.gauge + (S.combo >= 3 ? .03 + .008 * Math.min(S.combo, 8) : .012));
    if (S.combo >= 5 && S.combo % 5 === 0) { sfx('combo', Math.min(1.5, .9 + S.combo * .03), .8); word(S.cols * CELL / 2, -10, '냥콤보 x' + S.combo + '!', '#FF7F95', 26, 0); }
    if (S.gauge >= 1 && S.fever <= 0) startFever();
  }
  function startFever() { S.fever = 4.5; S.gauge = 1; sfx('fever'); S.shake = .25; emit('fever', true); emit('vibrate', 60);
    S.cats.filter(k => k.st === 'sit').sort(() => Math.random() - .5).slice(0, 2).forEach((k, i) => later(() => say(k, 'fever', 'shout', 1.3), i * 250)); }
  function follow(leader, delay) {
    const bc = leader.c - DX[leader.dir], br = leader.r - DY[leader.dir];
    if (bc < 0 || br < 0 || bc >= S.cols || br >= S.rows) return;
    const id = S.grid[br][bc]; if (id == null) return;
    const f = S.cats[id]; if (f.st !== 'sit' || f.sleepy || f.dir !== leader.dir || f.num) return;
    f.st = 'queued'; S.grid[br][bc] = null; S.rev[br][bc] = Math.max(S.rev[br][bc], .01);
    later(() => { if (f.st !== 'queued') return; Object.assign(f, { st: 'walk', t: 0, lp: -1, squash: .25 }); say(f, 'follow', 'round', .9); sfx('tok', 1 + Math.min(S.chain, 8) * .06, .5);
      word(f.x, f.y - 30, '줄줄이~', '#C9A8F0', 15); follow(f, .13); }, delay * 1000);
  }

  // ================= ACTIONS =================
  function tapCell(c, r) {
    if (S.state !== 'play' || c < 0 || r < 0 || c >= S.cols || r >= S.rows) return;
    const id = S.grid[r][c]; if (id == null) return;
    const k = S.cats[id]; if (k.st !== 'sit') return;
    if (S.tutorial && S.hint != null && id !== S.hint) { const h = S.cats[S.hint]; say(h, '나부터!', 'heart', .8); return; }
    const p = cellXY(c, r); S.ripples.push({ x: p.x, y: p.y, t: 0 }); emit('vibrate', 12);
    if (k.sleepy) { k.sleepy = false; k.squash = .3; sfx('grumble', 1.15); say(k, 'wake', 'sleepy', 1.1); word(k.x + 18, k.y - 20, '번쩍!', '#8FA8E8', 15); return; }
    S.hint = null; emit('tapped', k);
    let b = hit(k);
    if (!b && k.num && k.num !== S.nextNum) { // wrong order: cat refuses
      S.mistakes++; k.squash = .3; k.wob = .5; S.shake = .12; S.combo = 0; S.comboT = 0;
      if (S.fever > 0) say(k, '순서 지켜냥~', 'round', .9);
      else if (S.shield > 0) { S.shield--; say(k, '방석 덕분에!', 'heart', 1); }
      else { S.hearts--; say(k, S.nextNum + '번 먼저냥!', 'angry', 1); sfx('heart', 1, .6); }
      sfx('grumble', VOICE[k.lvl % 8], .7); emit('vibrate', 35); emit('hud');
      word(k.x, k.y - 30, '순서!', '#9B7BE0', 20);
      if (S.hearts <= 0) { S.state = 'fail'; later(() => { sfx('fail'); emit('fail', 'hearts'); }, 300); }
      return;
    }
    if (b) {
      const dist = (Math.abs(b.x - k.c) + Math.abs(b.y - k.r)) * CELL - CELL * .6;
      Object.assign(k, { st: 'bump', t: 0, bdist: Math.max(6, dist), blocker: b.obs ? null : S.grid[b.y][b.x], hitDone: false, squash: .25 });
      sfx('tap_go', 1.05, .7);
    } else {
      if (k.num) { S.nextNum++; word(k.x, k.y - 36, k.num + '번 출발!', '#9B7BE0', 16, 0); }
      S.grid[r][c] = null; S.rev[r][c] = Math.max(S.rev[r][c], .01); Object.assign(k, { st: 'walk', t: 0, lp: -1, squash: .3 });
      sfx('tap_go', VOICE[k.lvl % 8] * rand(.97, 1.05)); later(() => sfx('steps', rand(.95, 1.1), .6), 60);
      say(k, 'go', 'round', .9); word(k.x - DX[k.dir] * 14, k.y + 8, '토도독', '#E3A0B4', 13, 0); follow(k, .14);
    }
  }
  function useHint() { const f = freeCats(); if (!f.length) return false; f.sort((a, b) => (a.c + a.r) - (b.c + b.r)); S.hint = f[0].id; sfx('hint'); return true; }
  function useShield() { S.shield++; sfx('pop', 1.2); emit('hud'); const k = S.cats.find(k => k.st === 'sit'); if (k) say(k, '폭신폭신~', 'heart', 1); return true; }
  function lift(id) { const k = S.cats[id]; if (!k || k.st !== 'sit') return false; S.grid[k.r][k.c] = null; S.rev[k.r][k.c] = .01; k.st = 'lift'; k.t = 0; sfx('lift'); say(k, '냐앙?!', 'shout', .8); return true; }
  function liftBest() {
    const b = blockedCats(); if (!b.length) return false;
    const score = k => S.cats.filter(o => o.st === 'sit' && o !== k && (() => { const h = hit(o); return h && !h.obs && S.grid[h.y][h.x] === k.id; })()).length;
    b.sort((a, c) => score(c) - score(a)); return lift(b[0].id);
  }
  function continueGame(why) { if (why === 'time') S.timeLeft = Math.max(S.timeLeft, 15); else S.hearts = 3; S.state = 'play'; emit('hud'); sfx('coin'); }
  function addTime(s) { if (!S.timeMax) return false; S.timeLeft += s; S.timeAdds++; sfx('pop', 1.1); word(S.cols * CELL / 2, -14, '+' + s + '초', '#5DB3D6', 24, 0); emit('hud'); return true; }

  function exitCat(k) {
    k.st = 'gone'; S.out++; S.rescued[k.lvl % CatArt.CATS.length]++;
    const ex = Math.max(-MARGIN + 12, Math.min(S.cols * CELL + MARGIN - 12, k.x)), ey = Math.max(-MARGIN + 12, Math.min(S.rows * CELL + MARGIN - 12, k.y));
    for (let i = 0; i < 9; i++) S.fx.push({ x: ex, y: ey, vx: rand(-90, 90), vy: rand(-130, 10), life: rand(.5, .9), type: i % 3 ? 'heart' : 'bubble', s: rand(4, 8) });
    S.chain = S.chainT > 0 ? S.chain + 1 : 0; S.chainT = .45;
    const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    sfx('note', Math.pow(2, SCALE[Math.min(S.chain, SCALE.length - 1)] / 12), .75);
    if (S.chain === 0) sfx('exit', VOICE[k.lvl % 8] * rand(.96, 1.06), .7);
    addCombo();
    word(ex, ey, ['뿅!', '총총', '쏙!', '냥!', '폴짝'][S.out % 5], '#FF9CB5', 16 + Math.min(S.chain, 6) * 1.5);
    emit('hud');
    if (S.out === S.total) { S.state = 'clear'; burstConfetti(70); sfx('confetti'); emit('vibrate', 40); later(() => { sfx('clear'); emit('clear'); }, 1100); }
  }

  // ================= UPDATE =================
  function update(dt) {
    S.time += dt;
    if (!S.rev.length) return;
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= S.time) timers.splice(i, 1)[0].fn();
    const W = S.cols * CELL, H = S.rows * CELL;
    if (S.chainT > 0) S.chainT -= dt;
    if (S.timeMax && S.state === 'play' && !S.tutorial && S.fever <= 0) {
      const before = S.timeLeft; S.timeLeft = Math.max(0, S.timeLeft - dt); emit('timer');
      if (before > 10 && S.timeLeft <= 10) { sfx('warn', 1.1, .6); S.cats.filter(k => k.st === 'sit').slice(0, 2).forEach(k => say(k, '집사 온다냥!', 'shout', 1.2)); }
      if (S.timeLeft <= 0) { S.state = 'fail'; S.cats.filter(k => k.st === 'sit').forEach(k => k.dizzy = 1); later(() => { sfx('fail'); emit('fail', 'time'); }, 400); }
    }
    if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) { S.combo = 0; emit('hud'); } }
    if (S.fever > 0) { S.fever -= dt; S.gauge = Math.max(0, S.fever / 4.5); if (S.fever <= 0) { S.gauge = 0; emit('fever', false); } emit('gauge'); }
    if (S.shake > 0) S.shake -= dt;
    if (S.state === 'play' && !S.tutorial) { S.chatT -= dt; if (S.chatT <= 0) { S.chatT = rand(2.2, 4); const sit = S.cats.filter(k => k.st === 'sit' && !S.bubbles.some(b => b.cat === k.id)); if (sit.length) { const k = sit[Math.floor(Math.random() * sit.length)]; k.sleepy ? say(k, 'zZz…', 'sleepy', 1.6) : say(k, 'chat', 'think', 1.6); } } }
    for (const b of S.bubbles) b.life -= dt; S.bubbles = S.bubbles.filter(b => b.life > 0);
    for (const w of S.words) { w.life -= dt; w.y -= 22 * dt; } S.words = S.words.filter(w => w.life > 0);
    for (const c of S.confetti) { c.life -= dt; c.x += c.vx * dt + Math.sin(S.time * 4 + c.r) * 20 * dt; c.y += c.vy * dt; c.r += c.vr * dt; } S.confetti = S.confetti.filter(c => c.life > 0);
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) if (S.rev[r][c] > 0 && S.rev[r][c] < 1) S.rev[r][c] = Math.min(1, S.rev[r][c] + dt * 3.2);
    if (S.state === 'clear') { S.revealAll += dt; for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) if (S.rev[r][c] === 0 && S.revealAll * 9 > r + c) S.rev[r][c] = .01; }
    for (const k of S.cats) {
      k.blinkT -= dt; if (k.blinkT < -.14) k.blinkT = rand(2, 6);
      if (k.enter > -1) k.enter -= dt; if (k.squash > 0) k.squash -= dt;
      if (k.st === 'walk') {
        k.t += dt; const sp = Math.min(470, 160 + k.t * 900); k.x += DX[k.dir] * sp * dt; k.y += DY[k.dir] * sp * dt;
        const lp = Math.floor(k.t * 13); if (lp !== k.lp) { k.lp = lp; const side = lp % 2 ? 1 : -1; S.prints.push({ x: k.x - DX[k.dir] * 12 + DY[k.dir] * side * 7, y: k.y + 12 - DY[k.dir] * 12 + DX[k.dir] * side * 5, a: k.dir, life: 1.4 }); }
        const pc = Math.floor(k.x / CELL), pr = Math.floor(k.y / CELL);
        if (pr >= 0 && pc >= 0 && pr < S.rows && pc < S.cols) {
          if (S.rev[pr][pc] === 0) S.rev[pr][pc] = .01;
          if (S.pick[pr][pc]) { const v = S.pick[pr][pc]; S.pick[pr][pc] = 0; S.score += v === 2 ? 50 : 20; emit('coinPick', v);
            sfx('nom', rand(.95, 1.1)); say(k, 'nom', 'heart', .9); word(pc * CELL + CELL / 2, pr * CELL + 10, v === 2 ? '+10' : '+5', '#F0A92C', 16, 0);
            for (let i = 0; i < 8; i++) S.fx.push({ x: pc * CELL + CELL / 2, y: pr * CELL + CELL / 2, vx: rand(-80, 80), vy: rand(-120, -30), life: .6, type: 'star', s: rand(3, 6) });
            if (S.gauge >= 1 && S.fever <= 0) startFever(); emit('hud'); }
        }
        if (k.x < -MARGIN - 30 || k.x > W + MARGIN + 30 || k.y < -MARGIN - 40 || k.y > H + MARGIN + 30) exitCat(k);
      } else if (k.st === 'bump') {
        k.t += dt; const Tt = .46, base = cellXY(k.c, k.r);
        const f = k.t < Tt * .42 ? k.t / (Tt * .42) : Math.max(0, 1 - (k.t - Tt * .42) / (Tt * .58)), e = f * f * (3 - 2 * f);
        k.x = base.x + DX[k.dir] * k.bdist * e; k.y = base.y + DY[k.dir] * k.bdist * e;
        if (k.t >= Tt * .42 && !k.hitDone) {
          k.hitDone = true; S.shake = .18; S.combo = 0; S.comboT = 0; S.bumps++; S.mistakes++; emit('vibrate', 35);
          if (S.fever > 0) say(k, 'safe', 'round', .9);
          else if (S.shield > 0) { S.shield--; say(k, '방석 덕분에!', 'heart', 1); word(k.x, k.y - 6, '폭신~', '#9FC9F0', 18); }
          else { S.hearts--; say(k, 'bump', 'burst', .8); sfx('heart', 1, .6); }
          emit('hud');
          if (k.blocker != null) { const b = S.cats[k.blocker]; b.wob = .5; b.grump = .9; later(() => { sfx('grumble', rand(.95, 1.1), .7); say(b, 'grump', 'angry', .9); }, 140); }
          sfx('bump', rand(.95, 1.08)); word(k.x + DX[k.dir] * 24, k.y + DY[k.dir] * 24 - 10, '콩!', '#FF7F95', 26);
          for (let i = 0; i < 7; i++) S.fx.push({ x: k.x + DX[k.dir] * 22, y: k.y + DY[k.dir] * 22 - 8, vx: rand(-80, 80), vy: rand(-110, -20), life: .55, type: 'star', s: rand(3, 6) });
        }
        if (k.t > Tt) { k.st = 'sit'; k.x = base.x; k.y = base.y; k.dizzy = 1.0; if (S.hearts <= 0 && S.state === 'play') { S.state = 'fail'; later(() => { sfx('fail'); emit('fail', 'hearts'); }, 300); } }
      } else if (k.st === 'lift') { k.t += dt; k.y -= 240 * dt; if (k.t > .9) exitCat(k); }
      if (k.wob > 0) k.wob = Math.max(0, k.wob - dt); if (k.dizzy > 0) k.dizzy -= dt; if (k.grump > 0) k.grump -= dt;
    }
    for (const p of S.fx) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.type === 'bubble' ? -60 : 220) * dt; } S.fx = S.fx.filter(p => p.life > 0);
    for (const p of S.prints) p.life -= dt; S.prints = S.prints.filter(p => p.life > 0);
    for (const r of S.ripples) r.t += dt; S.ripples = S.ripples.filter(r => r.t < .45);
  }

  // ================= RENDER =================
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3); cw = innerWidth; ch = innerHeight;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    const top = 150, bottom = 124, availH = ch - top - bottom, VW = S.cols * CELL + MARGIN * 2, VH = S.rows * CELL + MARGIN * 2;
    scale = Math.min((cw - 10) / VW, availH / VH, 1.25); offX = (cw - VW * scale) / 2 + MARGIN * scale; offY = top + (availH - VH * scale) / 2 + MARGIN * scale; bg = null; tileCache = null;
  }
  const BGT = { normal: ['#FFEFF3', '#FFF4EA', '#FFE4D3'], rest: ['#EFFAF3', '#F7FBEF', '#E6F5E4'], hard: ['#F1EAFF', '#F8F1FF', '#E6DCFA'], super: ['#FFE6EA', '#FFF0EE', '#FFD6DC'] };
  const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
  function buildBg() {
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; const x = c.getContext('2d'); x.scale(dpr, dpr);
    const t = BGT[S.kind] || BGT.normal; let g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, t[0]); g.addColorStop(.55, t[1]); g.addColorStop(1, t[2]); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    x.fillStyle = S.kind === 'hard' ? 'rgba(190,160,240,.25)' : S.kind === 'super' ? 'rgba(255,140,160,.25)' : 'rgba(255,190,205,.28)';
    for (let yy = 20, row = 0; yy < ch; yy += 46, row++) for (let xx = (row % 2) * 23 + 10; xx < cw; xx += 46) { x.beginPath(); x.ellipse(xx, yy + 2, 4.4, 3.8, 0, 0, 7); x.fill(); for (const [dx, dy] of [[-4, -4], [0, -6], [4, -4]]) { x.beginPath(); x.arc(xx + dx, yy + dy, 1.7, 0, 7); x.fill(); } }
    for (const [bx, by, br, col] of [[cw * .1, ch * .2, 90, 'rgba(255,214,226,.4)'], [cw * .92, ch * .55, 110, 'rgba(201,233,246,.4)'], [cw * .2, ch * .9, 120, 'rgba(255,236,190,.4)']]) { x.fillStyle = col; x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill(); }
    x.translate(offX, offY); x.scale(scale, scale);
    const W = S.cols * CELL, H = S.rows * CELL;
    const frame = { normal: ['#FFD9E2', '#FFC2D1', '#A7DCEB'], rest: ['#CDEFD9', '#A9E2BF', '#9ED8C0'], hard: ['#E2D4FB', '#CBB5F5', '#B9A2EE'], super: ['#FFC9D2', '#FF9FB0', '#FF8FA3'] }[S.kind] || ['#FFD9E2', '#FFC2D1', '#A7DCEB'];
    x.shadowColor = 'rgba(200,120,130,.25)'; x.shadowBlur = 18; x.shadowOffsetY = 6; x.fillStyle = '#FFFBF6'; rr(x, -MARGIN + 4, -MARGIN + 4, W + MARGIN * 2 - 8, H + MARGIN * 2 - 8, 34); x.fill(); x.shadowColor = 'transparent';
    x.fillStyle = frame[0]; const edges = [[-MARGIN + 4, -MARGIN + 4, W + MARGIN * 2 - 8, 0], [W + MARGIN - 4, -MARGIN + 4, 0, H + MARGIN * 2 - 8], [-MARGIN + 4, H + MARGIN - 4, W + MARGIN * 2 - 8, 0], [-MARGIN + 4, -MARGIN + 4, 0, H + MARGIN * 2 - 8]];
    for (const [ex, ey, ew, eh] of edges) { const L = Math.max(ew, eh), n = Math.floor(L / 22); for (let i = 1; i < n; i++) { x.beginPath(); x.arc(ex + (ew ? i * L / n : 0), ey + (eh ? i * L / n : 0), 4, 0, 7); x.fill(); } }
    x.strokeStyle = frame[1]; x.lineWidth = 3; x.setLineDash([2, 9]); x.lineCap = 'round'; rr(x, -MARGIN + 16, -MARGIN + 16, W + MARGIN * 2 - 32, H + MARGIN * 2 - 32, 26); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#CFEFF7'; rr(x, -7, -7, W + 14, H + 14, 20); x.fill(); x.strokeStyle = frame[2]; x.lineWidth = 4; rr(x, -7, -7, W + 14, H + 14, 20); x.stroke();
    const deco = (dx, dy, fn) => { x.save(); x.translate(dx, dy); fn(); x.restore(); };
    deco(-MARGIN + 22, -MARGIN + 22, () => { for (const [bx, by, br] of [[0, 0, 11], [13, 6, 7], [5, 13, 5]]) { x.fillStyle = 'rgba(255,255,255,.95)'; x.strokeStyle = '#B9E3F0'; x.lineWidth = 2; x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill(); x.stroke(); } });
    deco(W + MARGIN - 24, -MARGIN + 24, () => { x.fillStyle = '#FFB8CB'; rr(x, -10, -12, 20, 26, 8); x.fill(); x.fillStyle = '#FF92AE'; rr(x, -5, -20, 10, 9, 3); x.fill(); x.fillStyle = '#fff'; rr(x, -6, -4, 12, 8, 3); x.fill(); });
    deco(W + MARGIN - 24, H + MARGIN - 22, () => { x.fillStyle = '#FFE680'; rr(x, -14, -8, 28, 16, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; rr(x, -9, -5, 12, 4, 2); x.fill(); });
    deco(-MARGIN + 22, H + MARGIN - 22, () => { x.fillStyle = '#FFE066'; x.beginPath(); x.ellipse(0, 2, 12, 9, 0, 0, 7); x.fill(); x.beginPath(); x.arc(7, -7, 7, 0, 7); x.fill(); x.fillStyle = '#FF9F43'; x.beginPath(); x.ellipse(14, -6, 5, 2.5, 0, 0, 7); x.fill(); x.fillStyle = '#4A3A35'; x.beginPath(); x.arc(9, -9, 1.4, 0, 7); x.fill(); });
    bg = c;
  }
  const TINT = { normal: ['#F1FBFE', '#E4F6FB', '#D6F0F8', '#CFEFF7'], rest: ['#F1FCF6', '#E3F7EC', '#D3F0E0', '#C8EBD7'], hard: ['#F6F1FE', '#ECE3FB', '#DED2F6', '#D6C8F2'], super: ['#FFF1F3', '#FDE2E7', '#F9CFD8', '#F6C5CF'] };
  function tiles() {
    if (tileCache) return tileCache; const t = TINT[S.kind] || TINT.normal;
    tileCache = [0, 1].map(a => { const c = document.createElement('canvas'); const px = Math.ceil(CELL * scale * dpr); c.width = c.height = px; const x = c.getContext('2d'); x.scale(px / CELL, px / CELL);
      x.fillStyle = t[3]; x.fillRect(0, 0, CELL, CELL);
      const g = x.createLinearGradient(0, 0, 0, CELL); g.addColorStop(0, a ? t[0] : t[1]); g.addColorStop(1, a ? t[1] : t[2]); x.fillStyle = g; x.beginPath(); x.roundRect(2.5, 2.5, CELL - 5, CELL - 5, 12); x.fill();
      x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.roundRect(7, 6, CELL * .32, 4, 2); x.fill(); x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.arc(CELL - 11, CELL - 11, 2.2, 0, 7); x.fill(); return c; });
    return tileCache;
  }
  function drawBoard() {
    const W = S.cols * CELL, H = S.rows * CELL, T = tiles();
    if (S.pic && S.pic.complete && S.pic.naturalWidth) { ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, H, 12); ctx.clip(); const ir = S.pic.width / S.pic.height, br = W / H; let dw = W, dh = H; if (ir > br) dw = H * ir; else dh = W / ir; ctx.drawImage(S.pic, (W - dw) / 2, (H - dh) / 2, dw, dh); ctx.restore(); }
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) {
      const v = S.rev[r][c]; if (v >= 1) continue;
      const e = v * v * (3 - 2 * v), s = 1 - e * .5; ctx.save(); ctx.globalAlpha = 1 - e; ctx.translate(c * CELL + CELL / 2, r * CELL + CELL / 2); ctx.rotate(e * .4); ctx.scale(s, s); ctx.drawImage(T[(r + c) % 2], -CELL / 2, -CELL / 2, CELL, CELL); ctx.restore();
      if (v > 0 && v < .6) { ctx.fillStyle = `rgba(255,255,255,${.7 - v})`; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(c * CELL + CELL / 2 + Math.cos(i * 2.1 + r) * v * 30, r * CELL + CELL / 2 + Math.sin(i * 2.1 + c) * v * 30, 5 * (1 - v), 0, 7); ctx.fill(); } }
    }
  }
  const AMB = Array.from({ length: 14 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 3 + Math.random() * 6, sp: .02 + Math.random() * .04, ph: Math.random() * 6, k: i % 3 }));
  function drawAmbient() {
    const W = S.cols * CELL + MARGIN * 2, H = S.rows * CELL + MARGIN * 2;
    for (const a of AMB) { a.y -= a.sp / 60; if (a.y < -.05) { a.y = 1.05; a.x = Math.random(); }
      const x = -MARGIN + a.x * W + Math.sin(S.time + a.ph) * 8, y = -MARGIN + a.y * H; ctx.save(); ctx.globalAlpha = .55;
      if (a.k === 0) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.strokeStyle = '#CDEFF8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, a.s, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - a.s * .35, y - a.s * .35, a.s * .25, 0, 7); ctx.fill(); }
      else if (a.k === 1) { ctx.globalAlpha = .35 + .3 * Math.sin(S.time * 3 + a.ph); CatArt.heart(ctx, x, y, a.s * .7, '#FFC2D1'); }
      else { ctx.globalAlpha = .3 + .4 * Math.abs(Math.sin(S.time * 2 + a.ph)); ctx.fillStyle = '#FFE38A'; star(ctx, x, y, a.s * .6); }
      ctx.restore(); }
  }
  function star(x, cx, cy, s) { x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .5 : s, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill(); }
  function drawPickups() {
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) { const v = S.pick[r][c]; if (!v) continue;
      ctx.save(); ctx.translate(c * CELL + CELL / 2, r * CELL + CELL / 2 + Math.sin(S.time * 3 + c + r) * 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
      if (v === 1) { ctx.rotate(-.5); ctx.fillStyle = '#FF9CB5'; ctx.strokeStyle = '#E3728F'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.roundRect(-5, -13, 10, 24, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-5, -3, 10, 5); ctx.fillStyle = '#FFE38A'; ctx.beginPath(); ctx.moveTo(-3, -13); ctx.lineTo(0, -18); ctx.lineTo(3, -13); ctx.fill(); }
      else { ctx.fillStyle = '#8FD0EA'; ctx.strokeStyle = '#5DB3D6'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-2, -10, 8, 0); ctx.quadraticCurveTo(-2, 10, -12, 0); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(14, -6); ctx.lineTo(14, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4A3A35'; ctx.beginPath(); ctx.arc(-6, -1.5, 1.4, 0, 7); ctx.fill(); ctx.fillStyle = '#FFD457'; star(ctx, 12, -12, 4 + Math.sin(S.time * 6)); }
      ctx.restore(); }
  }
  function drawObstacle(x, kind) {
    x.fillStyle = 'rgba(90,120,140,.15)'; x.beginPath(); x.ellipse(0, 18, 20, 5, 0, 0, 7); x.fill();
    if (kind === 1) { x.fillStyle = '#FFE066'; x.strokeStyle = '#E5B530'; x.lineWidth = 2.2; x.beginPath(); x.ellipse(-2, 6, 19, 13, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(7, -9, 11, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#FF9F43'; x.beginPath(); x.ellipse(18, -7, 7, 3.5, 0, 0, 7); x.fill(); x.fillStyle = '#4A3A35'; x.beginPath(); x.arc(10, -11, 2, 0, 7); x.fill(); x.fillStyle = 'rgba(255,140,160,.5)'; x.beginPath(); x.ellipse(6, -4, 3, 2, 0, 0, 7); x.fill(); }
    else { x.fillStyle = '#F3C690'; x.strokeStyle = '#C9935B'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(-18, -8); x.lineTo(18, -8); x.lineTo(14, 17); x.lineTo(-14, 17); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#C9935B'; x.fillRect(-17, -1, 34, 3); x.fillRect(-15, 9, 30, 3); x.fillStyle = '#BDEBF6'; x.beginPath(); x.ellipse(0, -8, 18, 5, 0, 0, 7); x.fill(); x.stroke();
      for (const [bx, by, br] of [[-6, -14, 5], [4, -16, 6], [11, -12, 4]]) { x.fillStyle = '#fff'; x.strokeStyle = '#B9E3F0'; x.lineWidth = 1.5; x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill(); x.stroke(); } }
  }
  function pawArrow(x, dir) {
    x.save(); x.rotate([0, Math.PI / 2, Math.PI, -Math.PI / 2][dir]);
    for (const [py, s] of [[-CELL * .5 + 4, 1], [-CELL * .5 + 13, .75]]) { x.fillStyle = '#FF9CB5'; x.beginPath(); x.ellipse(0, py + 2, 3.6 * s, 3 * s, 0, 0, 7); x.fill(); for (const [dx, dy] of [[-3.4, -2.8], [0, -4.4], [3.4, -2.8]]) { x.beginPath(); x.arc(dx * s, py + dy * s, 1.4 * s, 0, 7); x.fill(); } }
    x.restore();
  }
  const BSTYLE = { round: ['#FFFFFF', '#F4B6C6', '#7A5260'], heart: ['#FFE6EE', '#FF9CB5', '#E3728F'], angry: ['#FFF0E6', '#FFA27A', '#E0643C'], think: ['#F6F2FF', '#C9B8EE', '#7E6BA8'], sleepy: ['#EEF3FF', '#AFC1EE', '#6C82C4'], shout: ['#FFF7C8', '#F0B43C', '#C9771A'], burst: ['#FFF0F3', '#FF7F95', '#E3506E'] };
  function drawBubbles() {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const b of S.bubbles) {
      const k = S.cats[b.cat]; if (!k || k.st === 'gone') continue;
      const age = b.max - b.life, sc = age < .18 ? .3 + .7 * (1 - Math.pow(1 - age / .18, 3)) + Math.sin(age / .18 * Math.PI) * .15 : b.life < .15 ? b.life / .15 : 1;
      ctx.save(); ctx.translate(k.x + 4, k.y - 42); ctx.scale(sc, sc);
      ctx.font = `900 ${b.style === 'shout' || b.style === 'burst' ? 15 : 13}px "Noto Sans CJK KR",sans-serif`; const w = Math.max(30, ctx.measureText(b.text).width + 18), h = 24;
      const col = BSTYLE[b.style] || BSTYLE.round;
      ctx.fillStyle = col[0]; ctx.strokeStyle = col[1]; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      if (b.style === 'burst') { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, q = i % 2 ? 1 : 1.28; ctx.lineTo(Math.cos(a) * w * .55 * q, Math.sin(a) * h * .75 * q); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12); ctx.fill(); ctx.stroke();
        if (b.style === 'think') for (const [tx, ty, tr] of [[-4, 17, 3.4], [-9, 24, 2.2]]) { ctx.beginPath(); ctx.arc(tx, ty, tr, 0, 7); ctx.fill(); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(-6, h / 2 - 1.5); ctx.lineTo(-2, h / 2 + 8); ctx.lineTo(4, h / 2 - 1.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = col[0]; ctx.fillRect(-5, h / 2 - 3, 8, 3.5); } }
      if (b.style === 'angry') { ctx.save(); ctx.translate(w / 2 - 2, -h / 2 - 2); ctx.strokeStyle = '#FF6B6B'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(2, 2); ctx.quadraticCurveTo(5, 2, 5, 6); ctx.stroke(); } ctx.restore(); }
      if (b.style === 'heart') CatArt.heart(ctx, w / 2 - 3, -h / 2, 6, '#FF8FB1');
      ctx.fillStyle = col[2]; ctx.fillText(b.text, 0, 1); ctx.restore();
    }
  }
  function drawWords() {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const w of S.words) { const age = w.max - w.life, sc = age < .15 ? .4 + .9 * (age / .15) : 1 + .3 * Math.max(0, .2 - (age - .15)), a = Math.min(1, w.life * 2.5);
      ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.rot); ctx.scale(sc, sc); ctx.globalAlpha = a; ctx.font = `900 ${w.size}px "Noto Sans CJK KR",sans-serif`;
      ctx.lineWidth = w.size * .38; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(w.text, 0, 0); ctx.fillStyle = w.col; ctx.fillText(w.text, 0, 0); ctx.restore(); }
    for (const c of S.confetti) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.globalAlpha = Math.min(1, c.life); ctx.fillStyle = c.c;
      if (c.kind === 0) ctx.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2); else if (c.kind === 1) CatArt.heart(ctx, 0, 0, c.s * .8, c.c); else if (c.kind === 2) star(ctx, 0, 0, c.s * .7);
      else { ctx.beginPath(); ctx.ellipse(0, 1, 3.2, 2.8, 0, 0, 7); ctx.fill(); for (const [dx, dy] of [[-3, -3], [0, -4.4], [3, -3]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.3, 0, 7); ctx.fill(); } }
      ctx.restore(); }
  }
  function render() {
    if (!S.obs.length) return; if (!bg) buildBg();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bg, 0, 0);
    const k = scale * dpr, shx = S.shake > 0 ? rand(-1, 1) * S.shake * 22 : 0, shy = S.shake > 0 ? rand(-1, 1) * S.shake * 22 : 0;
    ctx.setTransform(k, 0, 0, k, (offX + shx) * dpr, (offY + shy) * dpr);
    drawBoard();
    if (S.fever > 0) { ctx.save(); ctx.globalAlpha = .16 + .08 * Math.sin(S.time * 8); const fg = ctx.createRadialGradient(S.cols * CELL / 2, S.rows * CELL / 2, 20, S.cols * CELL / 2, S.rows * CELL / 2, S.rows * CELL); fg.addColorStop(0, '#FFF3A0'); fg.addColorStop(1, '#FF9CB5'); ctx.fillStyle = fg; ctx.fillRect(-MARGIN, -MARGIN, S.cols * CELL + MARGIN * 2, S.rows * CELL + MARGIN * 2); ctx.restore(); }
    drawPickups();
    for (const p of S.prints) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate([0, Math.PI / 2, Math.PI, -Math.PI / 2][p.a]); ctx.globalAlpha = Math.min(1, p.life) * .5; ctx.fillStyle = '#F4A4BA'; ctx.beginPath(); ctx.ellipse(0, 2, 3.4, 3, 0, 0, 7); ctx.fill(); for (const [dx, dy] of [[-3, -3], [0, -4.6], [3, -3]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.3, 0, 7); ctx.fill(); } ctx.restore(); }
    if (S.hint != null) { const h = S.cats[S.hint]; if (h && h.st === 'sit') {
      ctx.save(); ctx.globalAlpha = .55 + .3 * Math.sin(S.time * 7); ctx.fillStyle = '#FFF1A8'; rr(ctx, h.c * CELL + 1, h.r * CELL + 1, CELL - 2, CELL - 2, 13); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#FFB547'; ctx.lineWidth = 3; ctx.setLineDash([2, 8]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(h.x, h.y);
      const ex = DX[h.dir] ? (DX[h.dir] > 0 ? S.cols * CELL + MARGIN - 8 : -MARGIN + 8) : h.x, ey = DY[h.dir] ? (DY[h.dir] > 0 ? S.rows * CELL + MARGIN - 8 : -MARGIN + 8) : h.y; ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]); } }
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) if (S.obs[r][c]) { ctx.save(); ctx.translate(c * CELL + CELL / 2, r * CELL + CELL / 2); drawObstacle(ctx, S.obs[r][c]); ctx.restore(); }
    for (const c of S.cats) if (c.st === 'sit' && !c.sleepy) { ctx.save(); ctx.translate(c.c * CELL + CELL / 2, c.r * CELL + CELL / 2); pawArrow(ctx, c.dir); ctx.restore(); }
    const order = S.cats.filter(k => k.st !== 'gone').sort((a, b) => a.y - b.y);
    for (const c of order) {
      ctx.save(); const wx = c.wob > 0 ? Math.sin(c.wob * 40) * 3 * c.wob * 2 : 0;
      const ent = c.enter > 0 ? 0 : Math.min(1, -c.enter / .25), pop = ent < 1 ? .4 + .6 * (1 - Math.pow(1 - ent, 3)) + Math.sin(ent * Math.PI) * .12 : 1;
      ctx.translate(c.x + wx, c.y + (c.st === 'lift' ? -Math.sin(c.t * 3) * 6 : 0)); ctx.scale(pop, pop);
      if (c.squash > 0) { const q = Math.sin((1 - c.squash / .3) * Math.PI) * .22; ctx.translate(0, 12); ctx.scale(1 + q, 1 - q); ctx.translate(0, -12); }
      if (S.fever > 0 && c.st === 'sit') ctx.translate(0, -Math.abs(Math.sin(S.time * 9 + c.id)) * 3);
      if (c.st === 'lift') ctx.globalAlpha = Math.max(0, 1 - c.t / .9);
      const mood = (S.fever > 0 && c.st === 'sit') || c.st === 'queued' ? 'happy' : c.sleepy ? 'sleep' : c.st === 'walk' || c.st === 'lift' ? 'happy' : (c.dizzy > 0 || (c.st === 'bump' && c.hitDone) || c.grump > 0) ? 'bump' : c.blinkT < 0 ? 'blink' : 'idle';
      CatArt.drawCat(ctx, c.lvl, CELL * 1.02, c.dir, { mood, walk: c.st === 'walk' ? c.t + .01 : 0, t: S.time + c.id, acc: c.acc });
      if (c.num && c.st === 'sit') { const nx = 16, ny = -34, isNext = c.num === S.nextNum, pul = isNext ? 1 + .12 * Math.sin(S.time * 8) : 1;
        ctx.save(); ctx.translate(nx, ny); ctx.scale(pul, pul); ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fillStyle = isNext ? '#9B7BE0' : '#C9B8EE'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '900 12px "Noto Sans CJK KR",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.num, 0, 1); ctx.restore(); }
      if (c.dizzy > 0) { ctx.fillStyle = '#FFD84A'; for (let i = 0; i < 3; i++) { const a = S.time * 6 + i * 2.1; star(ctx, Math.cos(a) * 15, -38 + Math.sin(a) * 4, 4); } }
      ctx.restore();
    }
    for (const p of S.fx) { ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = Math.max(0, p.life * 1.6); const s = p.s;
      if (p.type === 'heart') CatArt.heart(ctx, 0, 0, s, '#FF8FB1'); else if (p.type === 'bubble') { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = '#B9E3F0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill(); ctx.stroke(); } else { ctx.fillStyle = '#FFD84A'; star(ctx, 0, 0, s); }
      ctx.restore(); }
    for (const r of S.ripples) { ctx.strokeStyle = `rgba(255,150,180,${1 - r.t / .45})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, 10 + r.t * 55, 0, 7); ctx.stroke(); }
    if (S.finger) { const f = S.finger, bob = Math.sin(S.time * 7) * 4; ctx.save(); ctx.translate(f.x + 8, f.y + 16 + bob); ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#E79AB0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(-5, -16, 11, 26, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-10, 4, 28, 22, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#FFC2D1'; ctx.beginPath(); ctx.arc(0, -12, 3, 0, 7); ctx.fill(); ctx.restore(); }
    drawAmbient(); drawWords(); drawBubbles();
    if (S.fever > 2.9) { const a = 4.5 - S.fever, sc = a < .25 ? .2 + 1.0 * (a / .25) : a < .45 ? 1.2 - (a - .25) : 1, al = S.fever < 3.3 ? (S.fever - 2.9) / .4 : 1;
      ctx.save(); ctx.translate(S.cols * CELL / 2, S.rows * CELL * .42); ctx.scale(sc, sc); ctx.globalAlpha = al; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.roundRect(-120, -42, 240, 96, 30); ctx.fill(); ctx.strokeStyle = '#FFC2D1'; ctx.lineWidth = 4; ctx.stroke();
      ctx.font = '900 40px "Noto Sans CJK KR",sans-serif'; ctx.lineWidth = 10; ctx.strokeStyle = '#FF9CB5'; ctx.strokeText('츄르 타임!', 0, -8); ctx.fillStyle = '#FFFFFF'; ctx.fillText('츄르 타임!', 0, -8);
      ctx.font = '900 13px "Noto Sans CJK KR",sans-serif'; ctx.fillStyle = '#E3728F'; ctx.fillText('부딪혀도 하트 무사 · 점수 2배', 0, 30); ctx.restore(); }
  }
  canvas.addEventListener('pointerdown', e => { const x = (e.clientX - offX) / scale, y = (e.clientY - offY) / scale; tapCell(Math.floor(x / CELL), Math.floor(y / CELL)); });
  let manual = false, paused = false, last = performance.now();
  (function loop(n) { const dt = Math.min(1 / 30, (n - last) / 1000); last = n; if (!manual && !paused) { update(dt); render(); } requestAnimationFrame(loop); })(last);
  addEventListener('resize', resize); resize();
  window.Game = { addTime, VOICE, S, tierOf, TIER_REWARD, stageParams, generate, loadStage, tapCell, useHint, useShield, lift, liftBest, continueGame, freeCats, blockedCats, say, startFever, burstConfetti, cellXY,
    setManual(m) { manual = m; }, setPaused(p) { paused = p; }, step(dt) { update(dt); render(); }, on(h, f) { S.hooks[h] = f; }, render };
})();
