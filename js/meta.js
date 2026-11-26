/* 냥이 대탈출 v2.0 - 보상 사용처 & 진행 시스템
   1) 냥이 옷가게 : 생선으로 옷 구매 → 냥이별로 입히기 (게임판·홈·결과에 반영)
   2) 욕실 테마   : 생선으로 타일·배경 테마 구매/적용
   3) 간식 주기   : 생선 → 간식 → 원하는 냥이 호감도 직접 올리기
   4) 행운 캡슐   : 생선으로 뽑기 (옷 조각·부스터·생선), 중복은 '냥 코인'으로 교환
   5) 일일 미션   : 매일 3개, 모두 완료 시 보너스 상자
   6) 연출       : 생선이 카운터로 날아가는 애니메이션, 숫자 롤업, 화면 전환 발바닥 와이프 */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const P = Platform, D = P.D, S = Game.S;
  // ---------- save fields ----------
  D.owned = D.owned || {};            // accessory id -> true
  D.wear = D.wear || {};              // cat idx -> accessory id ('' = auto/bond outfit)
  D.themes = D.themes || { bath: true }; D.theme = D.theme || 'bath';
  D.snacks = D.snacks || { churu: 0, fishcake: 0, cake: 0 };
  D.capsule = D.capsule || { n: 0, pity: 0, tokens: 0, free: '' };
  D.mission = D.mission || { day: '', list: [], bonus: false };
  P.save();

  // ---------- catalogues ----------
  const ACC = [
    { id: 'beanie', n: '털모자', price: 600, r: 1 }, { id: 'glasses', n: '동글 안경', price: 700, r: 1 }, { id: 'strawhat', n: '밀짚모자', price: 900, r: 1 },
    { id: 'bow', n: '보라 나비넥타이', price: 800, r: 1 }, { id: 'sprout', n: '새싹', price: 1000, r: 2 }, { id: 'pjhood', n: '병아리 잠옷', price: 1500, r: 2 },
    { id: 'halo', n: '천사 링', price: 2500, r: 3 },
  ];
  const THEMES = [
    { id: 'bath', n: '하늘 욕실', price: 0, tile: ['#F1FBFE', '#E4F6FB', '#D6F0F8', '#CFEFF7'], bg: ['#FFEFF3', '#FFF4EA', '#FFE4D3'] },
    { id: 'sakura', n: '벚꽃 욕실', price: 1200, tile: ['#FFF3F6', '#FFE4EC', '#FCD3E0', '#F8C6D6'], bg: ['#FFE4EE', '#FFF2F5', '#FFD9E6'] },
    { id: 'mint', n: '민트 초코', price: 1200, tile: ['#F0FBF6', '#DDF5EA', '#C9EEDC', '#BDE7D1'], bg: ['#E8F8F0', '#F6FBF2', '#E2C9B5'] },
    { id: 'night', n: '별밤 욕실', price: 2000, tile: ['#E9E8FF', '#DAD8FA', '#C9C5F2', '#BDB8EC'], bg: ['#C9C4F2', '#E3DDFB', '#B9B0EA'] },
    { id: 'lemon', n: '레몬 욕실', price: 2000, tile: ['#FFFBE8', '#FFF4C8', '#FFEBA6', '#FFE393'], bg: ['#FFF6D6', '#FFFBEC', '#FFE9B8'] },
  ];
  const SNACK = [
    { id: 'churu', n: '츄르', price: 80, bond: 6, col: '#FF9CB5' }, { id: 'fishcake', n: '붕어빵', price: 200, bond: 18, col: '#F6C27A' }, { id: 'cake', n: '참치 케이크', price: 500, bond: 50, col: '#FFB3C7' },
  ];
  const CAP_PRICE = 300, CAP_TOKENS_FOR_PICK = 10;
  const MISSIONS = [
    ['clear', '레벨 {n}개 클리어', [2, 3, 4], 1], ['star3', '별 3개 {n}번 받기', [1, 2], 1], ['cats', '냥이 {n}마리 구출', [40, 60, 90], 1],
    ['combo', '냥콤보 x{n} 달성', [6, 8, 10], 0], ['chain', '줄줄이 {n}마리 한 번에', [3, 4], 0], ['nom', '츄르·생선 {n}개 줍기', [3, 5], 1],
    ['nohint', '부스터 없이 {n}레벨 클리어', [1, 2], 1], ['pet', '홈에서 냥이 {n}번 쓰다듬기', [5, 10], 1], ['snack', '간식 {n}번 주기', [1, 2], 1],
  ];
  const FISH = '<svg viewBox="0 0 30 20" width="22" height="15"><path d="M3 10c5-8 15-8 20 0-5 8-15 8-20 0z" fill="#8FD0EA" stroke="#5DB3D6" stroke-width="1.5"/><path d="M23 10l5-5v10z" fill="#8FD0EA" stroke="#5DB3D6" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="8.5" r="1.6" fill="#5A3E4A"/></svg>';
  const FS = FISH.replace('width="22" height="15"', 'width="14" height="10"');
  const CATN = ['치즈', '구름', '고등어', '삼색이', '턱시도', '하늘', '샴', '까망'];
  const click = () => P.sfx('click');
  const toast = (m, ms) => window.App && App.toast(m, ms);
  const open = h => { $('#card').innerHTML = h; $('#modal').classList.remove('hidden'); };
  const close = () => $('#modal').classList.add('hidden');
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- outfit resolution: chosen wear > bond outfit ----------
  const bondOutfit = Game.outfitOf;
  Game.outfitOf = c => (D.wear[c] && D.owned[D.wear[c]]) ? D.wear[c] : bondOutfit(c);

  // ---------- theme injection into game renderer ----------
  Game.theme = () => THEMES.find(t => t.id === D.theme) || THEMES[0];

  // ---------- fish fly-to-counter + roll-up ----------
  let shown = D.coins;
  function counterEl() { const all = [...$$('.coinTxt')].filter(e => e.offsetParent); return all[0]; }
  function rollTo(v) {
    const els = [...$$('.coinTxt')]; const from = shown, t0 = performance.now(), dur = 650; shown = v;
    (function f(n) { const k = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - k, 3), cur = Math.round(from + (v - from) * e); els.forEach(x => x.textContent = cur.toLocaleString()); if (k < 1) requestAnimationFrame(f); })(t0);
    els.forEach(x => { const c = x.closest('.coins'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } });
  }
  function flyFish(n, fromEl) {
    const tgt = counterEl(); if (!tgt) { rollTo(D.coins); return; }
    const tr = tgt.getBoundingClientRect(), fr = (fromEl || document.body).getBoundingClientRect();
    const k = Math.min(10, Math.max(3, Math.round(n / 10)));
    for (let i = 0; i < k; i++) {
      const e = document.createElement('div'); e.className = 'flyfish'; e.innerHTML = FISH;
      const sx = fr.left + fr.width / 2 + (Math.random() - .5) * 60, sy = fr.top + fr.height / 2 + (Math.random() - .5) * 30;
      e.style.left = sx + 'px'; e.style.top = sy + 'px'; e.style.setProperty('--tx', (tr.left + 6 - sx) + 'px'); e.style.setProperty('--ty', (tr.top + 4 - sy) + 'px');
      e.style.animationDelay = (i * 55) + 'ms'; document.body.appendChild(e);
      setTimeout(() => { e.remove(); P.sfx('tick', 1 + i * .04, .5); if (i === k - 1) rollTo(D.coins); }, 700 + i * 55);
    }
  }
  // watch coin changes: when coins increase, animate; when decrease, roll down
  setInterval(() => { if (D.coins !== shown) { if (D.coins > shown && !document.hidden) { const src = $('#modal:not(.hidden) .reward') || $('#modal:not(.hidden) .card'); flyFish(D.coins - shown, src); shown = D.coins; } else rollTo(D.coins); } }, 250);
  const origCoinsTxt = () => { }; // placeholder for clarity

  // ---------- paw wipe transition ----------
  const wipe = document.createElement('div'); wipe.id = 'pawwipe'; wipe.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join(''); document.body.appendChild(wipe);
  function pawWipe(cb) { wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go'); P.sfx('whoosh', 1, .5); setTimeout(cb, 380); }
  if (window.App) { const s0 = App.startLevel; App.startLevel = (...a) => pawWipe(() => s0(...a)); }

  // ---------- missions ----------
  function rollMissions() {
    if (D.mission.day === today()) return;
    const pool = MISSIONS.slice().sort(() => Math.random() - .5).slice(0, 3);
    D.mission = { day: today(), bonus: false, list: pool.map(([id, txt, ns, w]) => { const n = ns[Math.floor(Math.random() * ns.length)]; return { id, txt: txt.replace('{n}', n), need: n, got: 0, done: false, reward: id === 'combo' || id === 'chain' ? 60 : 40 }; }) };
    P.save();
  }
  function track(id, v, max) {
    rollMissions(); let changed = false;
    D.mission.list.forEach(m => { if (m.id !== id || m.done) return; const nv = max ? Math.max(m.got, v) : m.got + v; if (nv !== m.got) { m.got = Math.min(m.need, nv); changed = true; } if (m.got >= m.need && !m.ready) { m.ready = true; toast('미션 완료! ' + m.txt, 2200); P.sfx('unlock', 1, .7); } });
    if (changed) { P.save(); dot(); }
  }
  const missionReady = () => D.mission.list.some(m => m.ready && !m.done) || (D.mission.list.every(m => m.done) && !D.mission.bonus);
  function openMissions() {
    rollMissions();
    const all = D.mission.list.every(m => m.done);
    open(`<h2>오늘의 미션</h2><div class="sub2">매일 새로 바뀌어요 · 3개 모두 완료하면 보너스 상자!</div>
      <div class="mlist">${D.mission.list.map((m, i) => `<div class="mi ${m.done ? 'done' : m.ready ? 'ready' : ''}"><div class="mt"><b>${m.txt}</b><div class="mbar"><i style="width:${m.got / m.need * 100}%"></i></div><small>${m.got} / ${m.need}</small></div>
        <button class="mb" data-m="${i}">${m.done ? '완료' : m.ready ? '받기 ' + FS + m.reward : FS + m.reward}</button></div>`).join('')}</div>
      <div class="mbonus ${all && !D.mission.bonus ? 'ready' : D.mission.bonus ? 'done' : ''}" id="mBonus"><span class="cap big"></span><div><b>보너스 상자</b><small>행운 캡슐 1회 + 생선 80</small></div><button class="mb">${D.mission.bonus ? '완료' : all ? '열기' : '잠김'}</button></div>
      <button class="btn ghost" id="mClose">닫기</button>`);
    $$('[data-m]').forEach(b => b.onclick = () => { const m = D.mission.list[+b.dataset.m]; if (!m.ready || m.done) return; m.done = true; D.coins += m.reward; P.save(); P.sfx('coin_big'); window.Cute && Cute.celebrate(b); setTimeout(openMissions, 650); dot(); });
    $('#mBonus').onclick = () => { if (!all || D.mission.bonus) return; D.mission.bonus = true; D.coins += 80; D.capsule.freeTickets = (D.capsule.freeTickets || 0) + 1; P.save(); P.sfx('chest'); window.Cute && Cute.celebrate($('#mBonus')); setTimeout(openMissions, 700); dot(); };
    $('#mClose').onclick = () => { click(); close(); };
  }

  // ---------- shop (냥이 가게) ----------
  let tab = 'acc', selCat = 0;
  function openStore(t) {
    tab = t || tab;
    const tabs = [['acc', '옷가게'], ['theme', '욕실 테마'], ['snack', '간식'], ['cap', '행운 캡슐']];
    let body = '';
    if (tab === 'acc') {
      body = `<div class="catpick">${CATN.map((n, i) => `<button class="cp ${i === selCat ? 'on' : ''}" data-cat="${i}"><img src="${CatArt.iconURL(i, 72, 2, 'idle', Game.outfitOf(i))}"><small>${n}</small></button>`).join('')}</div>
        <div class="preview"><img id="pv" src="${CatArt.iconURL(selCat, 220, 2, 'happy', Game.outfitOf(selCat))}"><div class="pvname">${CATN[selCat]} · ${D.wear[selCat] && D.owned[D.wear[selCat]] ? ACC.find(a => a.id === D.wear[selCat]).n + ' 착용 중' : '호감도 옷 착용 중'}</div></div>
        <div class="accgrid">${ACC.map(a => { const own = D.owned[a.id], on = D.wear[selCat] === a.id;
          return `<div class="ai r${a.r} ${on ? 'on' : ''}" data-acc="${a.id}"><img src="${CatArt.iconURL(selCat, 80, 2, 'idle', a.id)}"><b>${a.n}</b><button class="ab2 ${own ? (on ? 'wear' : 'have') : D.coins >= a.price ? '' : 'poor'}">${own ? (on ? '벗기' : '입히기') : FS + a.price.toLocaleString()}</button></div>`; }).join('')}</div>
        <div class="hint2">한 번 사면 모든 냥이에게 입힐 수 있어요</div>`;
    } else if (tab === 'theme') {
      body = `<div class="thgrid">${THEMES.map(t => { const own = D.themes[t.id], on = D.theme === t.id;
        return `<div class="th ${on ? 'on' : ''}" data-th="${t.id}"><div class="thsw" style="background:linear-gradient(${t.bg[0]},${t.bg[2]})">${[0, 1, 2, 3, 4, 5].map(i => `<i style="background:${t.tile[i % 2]}"></i>`).join('')}</div><b>${t.n}</b><button class="ab2 ${own ? (on ? 'wear' : 'have') : D.coins >= t.price ? '' : 'poor'}">${own ? (on ? '사용 중' : '적용') : FS + t.price.toLocaleString()}</button></div>`; }).join('')}</div>`;
    } else if (tab === 'snack') {
      body = `<div class="catpick">${CATN.map((n, i) => `<button class="cp ${i === selCat ? 'on' : ''}" data-cat="${i}"><img src="${CatArt.iconURL(i, 72, 2, 'idle', Game.outfitOf(i))}"><small>${n} Lv${App.levelOf(i)}</small></button>`).join('')}</div>
        <div class="preview"><img id="pv" src="${CatArt.iconURL(selCat, 220, 2, 'happy', Game.outfitOf(selCat))}"><div class="pvname">${CATN[selCat]} 호감도 ${D.bond[selCat]}</div></div>
        <div class="snackrow">${SNACK.map(s => `<div class="sn" data-sn="${s.id}"><span class="snico" style="--c:${s.col}"></span><b>${s.n}</b><small>호감도 +${s.bond}</small><small>보유 ${D.snacks[s.id]}</small><button class="ab2 ${D.snacks[s.id] ? 'have' : D.coins >= s.price ? '' : 'poor'}">${D.snacks[s.id] ? '주기' : FS + s.price}</button></div>`).join('')}</div>
        <div class="hint2">좋아하는 냥이를 골라 간식을 주면 바로 친해져요</div>`;
    } else {
      const free = (D.capsule.freeTickets || 0) > 0;
      body = `<div class="capmachine"><canvas id="capcv" width="220" height="220"></canvas></div>
        <div class="capinfo">옷 · 부스터 · 생선이 나와요 · 10번 안에 옷 1개 보장 (${D.capsule.pity}/10)</div>
        <div class="row2"><button class="btn yellow" id="capOne">${free ? '무료 1회 (' + D.capsule.freeTickets + '장)' : FS + CAP_PRICE + ' 1회'}</button><button class="btn pink" id="capAd"><span class="ad">AD</span>무료 1회</button></div>
        <div class="tokens">냥 코인 ${D.capsule.tokens} · ${CAP_TOKENS_FOR_PICK}개면 원하는 옷 교환 <button class="ab2 ${D.capsule.tokens >= CAP_TOKENS_FOR_PICK ? 'have' : 'poor'}" id="capEx">교환</button></div>`;
    }
    open(`<h2>냥이 가게</h2><div class="coins inline"><span class="fishico">${FISH}</span><span class="coinTxt">${D.coins.toLocaleString()}</span></div>
      <div class="tabs">${tabs.map(([k, n]) => `<button class="tb ${k === tab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div><div class="tabbody">${body}</div>
      <button class="btn ghost" id="stClose">닫기</button>`);
    $$('[data-tab]').forEach(b => b.onclick = () => { click(); openStore(b.dataset.tab); });
    $$('[data-cat]').forEach(b => b.onclick = () => { selCat = +b.dataset.cat; P.sfx('meow_pet', Game.VOICE[selCat], .7); openStore(); });
    $$('[data-acc]').forEach(el => el.querySelector('button').onclick = () => {
      const a = ACC.find(q => q.id === el.dataset.acc);
      if (!D.owned[a.id]) { if (D.coins < a.price) { toast('생선이 부족해요'); P.sfx('heart'); return; } D.coins -= a.price; D.owned[a.id] = true; D.wear[selCat] = a.id; P.save(); P.sfx('buy'); setTimeout(() => P.sfx('equip'), 200); window.Cute && Cute.celebrate(el); toast(`${a.n} 구매! ${CATN[selCat]}에게 입혔어요`); }
      else { D.wear[selCat] = D.wear[selCat] === a.id ? '' : a.id; P.save(); P.sfx('equip'); }
      setTimeout(() => openStore(), 260); App.refresh();
    });
    $$('[data-th]').forEach(el => el.querySelector('button').onclick = () => {
      const t = THEMES.find(q => q.id === el.dataset.th);
      if (!D.themes[t.id]) { if (D.coins < t.price) { toast('생선이 부족해요'); P.sfx('heart'); return; } D.coins -= t.price; D.themes[t.id] = true; P.sfx('buy'); window.Cute && Cute.celebrate(el); }
      D.theme = t.id; P.save(); P.sfx('unlock', 1, .6); toast(`${t.n} 적용! 다음 레벨부터 바뀌어요`); setTimeout(() => openStore(), 260);
    });
    $$('[data-sn]').forEach(el => el.querySelector('button').onclick = () => {
      const s = SNACK.find(q => q.id === el.dataset.sn);
      if (!D.snacks[s.id]) { if (D.coins < s.price) { toast('생선이 부족해요'); P.sfx('heart'); return; } D.coins -= s.price; D.snacks[s.id]++; P.sfx('buy'); P.save(); openStore(); return; }
      const before = App.levelOf(selCat); D.snacks[s.id]--; D.bond[selCat] += s.bond; P.save(); track('snack', 1);
      P.sfx('nom'); setTimeout(() => P.sfx('meow_pet', Game.VOICE[selCat]), 500); window.Cute && Cute.celebrate($('#pv'));
      const pv = $('#pv'); pv.classList.remove('munch'); void pv.offsetWidth; pv.classList.add('munch');
      if (App.levelOf(selCat) > before) setTimeout(() => toast(`${CATN[selCat]} 호감도 Lv${App.levelOf(selCat)}!`, 2200), 600);
      setTimeout(() => openStore(), 900);
    });
    if (tab === 'cap') capsuleUI();
    $('#stClose').onclick = () => { click(); close(); App.refresh(); };
  }
  // ---------- capsule machine ----------
  function capPrize() {
    D.capsule.n++; D.capsule.pity++;
    const notOwned = ACC.filter(a => !D.owned[a.id]);
    const r = Math.random();
    if (D.capsule.pity >= 10 || r < .12) { D.capsule.pity = 0;
      const pool = ACC.flatMap(a => Array(a.r === 3 ? 1 : a.r === 2 ? 3 : 6).fill(a)); const a = pool[Math.floor(Math.random() * pool.length)];
      if (D.owned[a.id]) { D.capsule.tokens += a.r * 2; return { t: `${a.n} (중복) → 냥 코인 +${a.r * 2}`, c: '#C9A8F0', acc: a.id }; }
      D.owned[a.id] = true; return { t: `옷 · ${a.n}!`, c: a.r === 3 ? '#FFD457' : '#FF9CB5', acc: a.id, rare: a.r }; }
    if (r < .42) { const b = ['hint', 'shield', 'lift'][Math.floor(Math.random() * 3)]; D.b[b]++; return { t: { hint: '힌트', shield: '방석', lift: '집어올리기' }[b] + ' +1', c: '#9FE0C8' }; }
    if (r < .62) { const s = SNACK[Math.floor(Math.random() * 2)]; D.snacks[s.id]++; return { t: s.n + ' +1', c: '#F6C27A' }; }
    if (r < .7) { D.tAdd++; return { t: '시간 +15초 +1', c: '#8FC4F0' }; }
    const f = [80, 120, 200, 500][Math.random() < .05 ? 3 : Math.floor(Math.random() * 3)]; D.coins += f; return { t: '생선 +' + f, c: '#8FD0EA' };
  }
  let capAnim = 0;
  function capsuleUI() {
    const cv = $('#capcv'), dp = Math.min(devicePixelRatio || 1, 3); cv.width = 220 * dp; cv.height = 220 * dp; const x = cv.getContext('2d'); x.scale(dp, dp);
    const balls = Array.from({ length: 14 }, (_, i) => ({ x: 60 + Math.random() * 100, y: 50 + Math.random() * 60, c: ['#FF9CB5', '#FFD457', '#9FE0C8', '#8FC4F0', '#C9A8F0'][i % 5], vx: 0, vy: 0 }));
    let shake = 0, drop = null, t0 = performance.now();
    function draw(n) {
      if (!$('#capcv')) return; const t = (n - t0) / 1000; x.clearRect(0, 0, 220, 220);
      // stand
      x.fillStyle = '#FF9CB5'; x.beginPath(); x.roundRect(55, 120, 110, 80, 18); x.fill(); x.strokeStyle = '#E3728F'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.roundRect(92, 160, 36, 26, 8); x.fill(); x.fillStyle = '#FFE38A'; x.beginPath(); x.arc(150, 145, 11, 0, 7); x.fill(); x.strokeStyle = '#E3A52A'; x.stroke();
      x.save(); x.translate(150, 145); x.rotate(shake * 6); x.fillStyle = '#E3A52A'; x.fillRect(-2, -9, 4, 18); x.restore();
      // dome
      x.save(); x.beginPath(); x.arc(110, 85, 62, 0, 7); x.fillStyle = 'rgba(230,248,255,.75)'; x.fill(); x.clip();
      balls.forEach(b => { if (shake > 0) { b.vx += (Math.random() - .5) * 3; b.vy -= Math.random() * 2; } b.vy += .3; b.x += b.vx; b.y += b.vy; b.vx *= .92; b.vy *= .92;
        const dx = b.x - 110, dy = b.y - 85, d = Math.hypot(dx, dy); if (d > 50) { b.x = 110 + dx / d * 50; b.y = 85 + dy / d * 50; b.vy *= -.4; b.vx *= -.4; }
        x.fillStyle = b.c; x.beginPath(); x.arc(b.x, b.y, 11, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(b.x, b.y, 11, Math.PI, 0); x.globalAlpha = .55; x.fill(); x.globalAlpha = 1; });
      x.restore(); x.beginPath(); x.arc(110, 85, 62, 0, 7); x.strokeStyle = '#BFE7F4'; x.lineWidth = 4; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(85, 55, 14, 8, -.6, 0, 7); x.fill();
      // cat on top
      x.save(); x.translate(110, 30 + Math.sin(t * 3) * 2); CatArt.drawCat(x, 0, 40, 2, { mood: shake > 0 ? 'happy' : 'idle', t }); x.restore();
      if (drop) { drop.y += 3; x.fillStyle = drop.c; x.beginPath(); x.arc(110, Math.min(drop.y, 174), 10, 0, 7); x.fill(); }
      if (shake > 0) shake -= .02;
      capAnim = requestAnimationFrame(draw);
    }
    cancelAnimationFrame(capAnim); capAnim = requestAnimationFrame(draw);
    const spin = pay => {
      if (!pay()) return; P.save(); shake = 1; P.sfx('whoosh'); P.vibrate(20);
      setTimeout(() => { drop = { y: 120, c: ['#FF9CB5', '#FFD457', '#9FE0C8'][Math.floor(Math.random() * 3)] }; P.sfx('pop'); }, 700);
      setTimeout(() => {
        const pr = capPrize(); P.save(); cancelAnimationFrame(capAnim);
        open(`<div class="capopen"><div class="capball" style="--c:${pr.c}"><i></i><i></i></div>${pr.acc ? `<img class="capacc" src="${CatArt.iconURL(selCat, 200, 2, 'happy', pr.acc)}">` : ''}<h2 style="color:${pr.rare === 3 ? '#E0A812' : '#FF7F95'}">${pr.rare === 3 ? '대박!' : pr.acc ? '새 옷!' : '짜잔!'}</h2><div class="reward">${pr.t}</div>
          <button class="btn yellow" id="capAgain">한 번 더</button><button class="btn ghost" id="capBack">돌아가기</button></div>`);
        P.sfx(pr.acc ? 'perfect' : 'chest'); window.Cute && Cute.celebrate($('.capopen')); if (pr.acc) Game.burstConfetti(40);
        $('#capAgain').onclick = () => { click(); openStore('cap'); }; $('#capBack').onclick = () => { click(); openStore('cap'); };
      }, 1500);
    };
    $('#capOne').onclick = () => spin(() => { if ((D.capsule.freeTickets || 0) > 0) { D.capsule.freeTickets--; return true; } if (D.coins < CAP_PRICE) { toast('생선이 부족해요'); P.sfx('heart'); return false; } D.coins -= CAP_PRICE; return true; });
    $('#capAd').onclick = () => { if (D.capsule.free === today()) { toast('광고 무료 뽑기는 하루 1번이에요'); return; } P.rewarded('capsule', ok => { if (ok) { D.capsule.free = today(); spin(() => true); } }); };
    $('#capEx').onclick = () => { if (D.capsule.tokens < CAP_TOKENS_FOR_PICK) { toast(`냥 코인 ${CAP_TOKENS_FOR_PICK}개가 필요해요`); return; }
      const na = ACC.filter(a => !D.owned[a.id]); if (!na.length) { toast('모든 옷을 가지고 있어요!'); return; }
      open(`<h2>원하는 옷 고르기</h2><div class="accgrid">${na.map(a => `<div class="ai" data-pick="${a.id}"><img src="${CatArt.iconURL(selCat, 80, 2, 'idle', a.id)}"><b>${a.n}</b></div>`).join('')}</div><button class="btn ghost" id="pkBack">돌아가기</button>`);
      $$('[data-pick]').forEach(e => e.onclick = () => { D.capsule.tokens -= CAP_TOKENS_FOR_PICK; D.owned[e.dataset.pick] = true; P.save(); P.sfx('perfect'); toast('교환 완료!'); openStore('acc'); });
      $('#pkBack').onclick = () => openStore('cap'); };
  }

  // ---------- home buttons ----------
  function dot() { const d = $('#missionDot'); if (d) d.classList.toggle('hidden', !missionReady()); }
  const bar = $('.topbtns');
  if (bar) {
    const m = document.createElement('button'); m.className = 'mochi round sm'; m.id = 'btnMission'; m.setAttribute('aria-label', '미션');
    m.innerHTML = '<svg viewBox="0 0 32 32"><rect x="7" y="5" width="18" height="23" rx="4" fill="#fff" stroke="#E3728F" stroke-width="2"/><rect x="12" y="3" width="8" height="5" rx="2" fill="#FFB6C9"/><path d="M11 14l2 2 4-4M11 21l2 2 4-4" stroke="#7FD4B3" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 15h3M19 22h3" stroke="#E3A0B4" stroke-width="2" stroke-linecap="round"/></svg><i class="dot hidden" id="missionDot"></i>';
    bar.appendChild(m); m.onclick = () => { click(); openMissions(); };
  }
  const shopBtn = $('#btnShop');
  if (shopBtn) {
    const b = document.createElement('button'); b.className = 'mochi hb'; b.id = 'btnStore';
    b.innerHTML = '<svg viewBox="0 0 32 32"><path d="M5 12l2-6h18l2 6z" fill="#FF9CB5"/><path d="M5 12c0 2 2 3 3.7 3S12 14 12 12c0 2 2 3 4 3s4-1 4-3c0 2 1.6 3 3.3 3S27 14 27 12" fill="#FFD6E2" stroke="#E3728F" stroke-width="1.6"/><rect x="7" y="15" width="18" height="12" rx="2" fill="#fff" stroke="#E3728F" stroke-width="1.6"/><rect x="13" y="19" width="6" height="8" rx="1.5" fill="#FFE38A"/></svg>가게';
    shopBtn.parentNode.insertBefore(b, shopBtn.nextSibling); b.onclick = () => { click(); openStore('acc'); };
  }

  // ---------- game event tracking for missions ----------
  const evClear = Game.S.hooks.clear;
  Game.on('clear', (...a) => { track('clear', 1); track('cats', S.total); track('combo', S.bestCombo, true); if ((App.lastStars || 0) === 3 || S.mistakes === 0 && (!S.timeMax || S.timeLeft / S.timeMax >= .4)) track('star3', 1); if (!S.usedBooster) track('nohint', 1); evClear && evClear(...a); });
  const evCoin = Game.S.hooks.coinPick; Game.on('coinPick', v => { track('nom', 1); evCoin && evCoin(v); });
  const evSfx = Game.S.hooks.sfx; Game.on('sfx', (n, ...r) => { if (n === 'note') track('chain', (S.chain || 0) + 1, true); evSfx && evSfx(n, ...r); });
  const hc = $('#homeCat'); if (hc) hc.addEventListener('pointerdown', () => track('pet', 1));
  rollMissions(); dot();
  window.Meta = { openStore, openMissions, track, THEMES, ACC, flyFish };
})();
