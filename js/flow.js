/* 냥이 대탈출 v2.1 - 진행 흐름
   · 기능은 레벨에 따라 천천히 열림 (처음엔 단순하게)
   · 재화는 '생선' 하나 (예전 냥 코인·간식·캡슐권·시계는 생선으로 자동 환급)
   · 오늘의 도전 (매일 바뀌는 특별 레벨 + 7일 도장)
   · 주간 이벤트 (이번 주 주인공 냥이를 구하면 한정 옷)
   · 목표 = 업적 + 오늘의 미션                                                          */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const P = Platform, D = P.D, S = Game.S;
  const CATN = ['치즈', '구름', '고등어', '삼색이', '턱시도', '하늘', '샴', '까망'];
  const FISH = '<svg viewBox="0 0 30 20" width="14" height="10"><path d="M3 10c5-8 15-8 20 0-5 8-15 8-20 0z" fill="#8FD0EA" stroke="#5DB3D6" stroke-width="1.5"/><path d="M23 10l5-5v10z" fill="#8FD0EA" stroke="#5DB3D6" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="8.5" r="1.6" fill="#5A3E4A"/></svg>';
  const click = () => P.sfx('click');
  const open = h => { $('#card').innerHTML = h; $('#modal').classList.remove('hidden'); };
  const close = () => $('#modal').classList.add('hidden');
  const dayIdx = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
  const weekIdx = () => Math.floor((dayIdx() + 3) / 7);

  // ---------------- features & unlock levels (long gaps on purpose) ----------------
  const F = [
    { id: 'daily', lv: 5, n: '출석 선물', d: '매일 들어오면 선물을 받아요.', btn: '#btnDaily' },
    { id: 'tower', lv: 8, n: '캣타워', d: '생선으로 냥이들의 캣타워를 지어요. 홈 화면에 나타나요!', btn: '#btnTower' },
    { id: 'chest', lv: 10, n: '별 보물상자', d: '챕터에서 별을 모으면 상자가 열려요.', el: '#chestBar' },
    { id: 'cats', lv: 12, n: '냥이 친구들', d: '구한 냥이들과 친해지면 새 옷을 입어요.', btn: '#btnCats' },
    { id: 'goal', lv: 15, n: '목표', d: '업적을 달성하고 생선을 받아요. (왼쪽 위 트로피)', btn: '#btnAch' },
    { id: 'store', lv: 20, n: '냥이 가게', d: '생선으로 옷을 사서 입히고, 간식으로 친해질 수 있어요.', btn: '#btnStore' },
    { id: 'challenge', lv: 25, n: '오늘의 도전', d: '매일 바뀌는 특별한 판! 7일 도장을 모으면 선물이 있어요.', btn: '#btnChal' },
    { id: 'mission', lv: 30, n: '오늘의 미션', d: '매일 3개의 작은 목표가 생겨요. (목표 메뉴)' },
    { id: 'event', lv: 35, n: '주간 이벤트', d: '이번 주 주인공 냥이를 구하면 이벤트 한정 옷을 받아요!', el: '#eventPill' },
    { id: 'theme', lv: 40, n: '욕실 테마', d: '가게에서 게임판 색을 바꿀 수 있어요.' },
    { id: 'capsule', lv: 50, n: '행운 캡슐', d: '가게에서 옷 뽑기를 할 수 있어요.' },
  ];
  const on = id => { const f = F.find(q => q.id === id); return !f || D.cleared >= f.lv; };

  // ---------------- one currency: migrate old ones to fish ----------------
  D.unlocked = D.unlocked || {};
  if (!D.v21) {
    let refund = 0; const c = D.capsule || {}, s = D.snacks || {};
    refund += (c.tokens || 0) * 60 + (c.freeTickets || 0) * 300 + (s.churu || 0) * 80 + (s.fishcake || 0) * 200 + (s.cake || 0) * 500 + (D.tAdd || 0) * 150;
    D.coins += refund; if (D.capsule) { D.capsule.tokens = 0; D.capsule.freeTickets = 0; } D.snacks = { churu: 0, fishcake: 0, cake: 0 }; D.tAdd = 0;
    F.forEach(f => { if (D.cleared >= f.lv && ['daily', 'tower', 'chest', 'cats', 'goal', 'store'].includes(f.id)) D.unlocked[f.id] = 1; });
    D.v21 = 1; P.save(); if (refund) setTimeout(() => App.toast(`예전 아이템을 생선 ${refund}마리로 바꿨어요`, 2600), 800);
  }

  // ---------------- home layout ----------------
  const shop = $('#btnShop'); if (shop) shop.classList.add('hidden');            // IAP lives in 광고제거 button & 가게 > 생선 tab
  const bar = $('.homebar');
  if (bar && !$('#btnStore')) {
    const b = document.createElement('button'); b.className = 'mochi hb'; b.id = 'btnStore';
    b.innerHTML = '<svg viewBox="0 0 32 32"><path d="M5 12l2-6h18l2 6z" fill="#FF9CB5"/><path d="M5 12c0 2 2 3 3.7 3S12 14 12 12c0 2 2 3 4 3s4-1 4-3c0 2 1.6 3 3.3 3S27 14 27 12" fill="#FFD6E2" stroke="#E3728F" stroke-width="1.6"/><rect x="7" y="15" width="18" height="12" rx="2" fill="#fff" stroke="#E3728F" stroke-width="1.6"/><rect x="13" y="19" width="6" height="8" rx="1.5" fill="#FFE38A"/></svg>가게';
    bar.insertBefore(b, bar.firstChild); b.onclick = () => { click(); Meta.openStore('acc'); };
  }
  const tb = $('.topbtns');
  const ach = $('#btnAch'); if (ach) { ach.onclick = () => { click(); openGoals('ach'); }; if (!ach.querySelector('.dot')) ach.insertAdjacentHTML('beforeend', '<i class="dot hidden" id="goalDot"></i>'); }
  if (tb && !$('#btnChal')) {
    const c = document.createElement('button'); c.className = 'mochi round sm'; c.id = 'btnChal'; c.setAttribute('aria-label', '오늘의 도전');
    c.innerHTML = '<svg viewBox="0 0 32 32"><rect x="5" y="7" width="22" height="20" rx="4" fill="#fff" stroke="#9B7BE0" stroke-width="2"/><rect x="5" y="7" width="22" height="6" rx="3" fill="#C3A9F5"/><path d="M16 16l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#FFD457"/></svg><i class="dot hidden" id="chalDot"></i>';
    tb.appendChild(c); c.onclick = () => { click(); openChallenge(); };
  }
  const home = $('#home');
  if (home && !$('#eventPill')) { const e = document.createElement('button'); e.className = 'mochi evpill hidden'; e.id = 'eventPill'; home.appendChild(e); e.onclick = () => { click(); openEvent(); }; }

  function refresh() {
    F.forEach(f => { const el = f.btn ? $(f.btn) : f.el ? $(f.el) : null; if (el) el.classList.toggle('hidden', !on(f.id)); });
    const gd = $('#goalDot'); if (gd) gd.classList.toggle('hidden', !((App.achReady && App.achReady()) || (on('mission') && Meta.missionReady && Meta.missionReady())));
    const cd = $('#chalDot'); if (cd) cd.classList.toggle('hidden', !(on('challenge') && (D.chal || {}).last !== dayIdx()));
    if (on('event')) eventPill();
  }
  setInterval(() => { if (!$('#home').classList.contains('hidden')) refresh(); }, 600);

  // ---------------- unlock announcements ----------------
  function pendingUnlocks() { return F.filter(f => on(f.id) && !D.unlocked[f.id]); }
  function announce() {
    const list = pendingUnlocks(); if (!list.length) return Promise.resolve();
    return list.reduce((p, f) => p.then(() => new Promise(res => {
      D.unlocked[f.id] = 1; P.save();
      open(`<div class="sub2">레벨 ${f.lv} 달성</div><h2>새 기능이 열렸어요!</h2><div class="unlockico">${iconFor(f.id)}</div><div class="reward" style="font-size:20px">${f.n}</div><p>${f.d}</p><button class="btn pink" id="ulOk">좋아요!</button>`);
      P.sfx('unlock'); window.Cute && Cute.celebrate($('.card'));
      $('#ulOk').onclick = () => { click(); close(); refresh(); res(); };
    })), Promise.resolve());
  }
  function iconFor(id) {
    const m = { daily: '#btnDaily svg', tower: '#btnTower svg', cats: '#btnCats svg', goal: '#btnAch svg', store: '#btnStore svg', challenge: '#btnChal svg', chest: '#chestBar svg' };
    const el = m[id] && $(m[id]); if (el) return el.outerHTML;
    if (id === 'event') { const e = curEvent(); return `<img src="${CatArt.iconURL(e.cat, 140, 2, 'happy', e.acc)}" width="110">`; }
    return `<img src="${CatArt.iconURL(0, 140, 2, 'happy', id === 'capsule' ? 'halo' : 'beanie')}" width="110">`;
  }
  if (window.App) {
    const sh = App.showHome; App.showHome = (...a) => { const r = sh(...a); setTimeout(() => { announce(); refresh(); }, 350); return r; };
  }

  // ---------------- 목표 = 업적 + 미션 ----------------
  function openGoals(tab) {
    tab = tab === 'mission' && on('mission') ? 'mission' : tab === 'ach' || !on('mission') ? 'ach' : tab;
    if (tab === 'ach') App.openAch(); else Meta.openMissions();
    if (!on('mission')) return;
    const card = $('#card'); const h = card.querySelector('h2');
    const bar = document.createElement('div'); bar.className = 'tabs'; bar.innerHTML = `<button class="tb ${tab === 'ach' ? 'on' : ''}" data-g="ach">업적</button><button class="tb ${tab === 'mission' ? 'on' : ''}" data-g="mission">오늘의 미션${Meta.missionReady() ? ' •' : ''}</button>`;
    h.after(bar); bar.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { click(); openGoals(b.dataset.g); });
  }

  // ---------------- 오늘의 도전 ----------------
  D.chal = D.chal || { last: -1, streak: 0, stamps: 0 };
  function twistOf(day) {
    const b = day % 8, k = day % 4;
    return [{ id: 'breed', n: `${CATN[b]} 데이`, d: `오늘은 모든 냥이가 ${CATN[b]}!`, breed: b },
      { id: 'churu', n: '츄르 잔치', d: '빈 칸마다 츄르가 가득! 생선 많이 줍기' },
      { id: 'heart1', n: '조심조심', d: '하트 1개 · 보상 2배' },
      { id: 'big', n: '넓은 욕실', d: '평소보다 한 단계 큰 판' }][k];
  }
  function chalParam(tw) {
    let n = Math.max(15, Math.min(90, D.cleared)) + (tw.id === 'big' ? 20 : 0);
    while (Game.tierOf(n) !== 'normal') n--;
    return n;
  }
  function openChallenge() {
    const d = dayIdx(), tw = twistOf(d), done = D.chal.last === d;
    const st = D.chal.last === d - 1 || done ? D.chal.streak : 0;
    open(`<div class="sub2">매일 바뀌는 특별한 판</div><h2>오늘의 도전</h2>
      <div class="twist"><img src="${CatArt.iconURL(tw.breed ?? 6, 150, 2, 'happy', Game.outfitOf(tw.breed ?? 6))}"><div><b>${tw.n}</b><small>${tw.d}</small></div></div>
      <div class="stamps">${Array.from({ length: 7 }, (_, i) => `<i class="${i < st ? 'on' : ''}">${i < st ? '' : i + 1}</i>`).join('')}</div>
      <div class="sub2">7일 연속 도장 → 힌트·방석·집기 + 생선 150</div>
      ${done ? '<div class="reward">오늘 도전 완료! 내일 또 만나요</div><button class="btn ghost" id="chClose">닫기</button>'
        : `<div class="reward">${FISH} +${tw.id === 'heart1' ? 80 : 40} · 도장 1개</div><button class="btn pink" id="chGo">도전하기</button><button class="btn ghost" id="chClose">닫기</button>`}`);
    $('#chClose').onclick = () => { click(); close(); };
    const g = $('#chGo'); if (g) g.onclick = () => { click(); close(); startChallenge(); };
  }
  function startChallenge() {
    const d = dayIdx(), tw = twistOf(d), n = chalParam(tw);
    Game.loadStage(n, App.picOf(n), { seed: 900000 + d, challenge: true, after: (s) => {
      if (tw.id === 'breed') s.cats.forEach(k => k.lvl = tw.breed);
      if (tw.id === 'heart1') { s.hearts = 1; s.maxHearts = 1; }
      if (tw.id === 'churu') { let k = 0; for (let r = 0; r < s.rows && k < 9; r++) for (let c = 0; c < s.cols && k < 9; c++) if (s.grid[r][c] == null && !s.obs[r][c]) { s.pick[r][c] = 1 + (k % 3 === 2 ? 1 : 0); k++; } }
      s.twist = tw.id;
    } });
    Game.setPaused(false); App.showGame(); S.state = 'play';
    const t = $('#stTxt'); if (t) t.textContent = '오늘의 도전'; const tg = $('#stTag'); if (tg) { tg.textContent = tw.n; tg.className = 'tier hard'; }
    Game.S.hooks.hud && Game.S.hooks.hud();
  }
  function challengeClear() {
    const d = dayIdx(), tw = twistOf(d), first = D.chal.last !== d;
    const fish = first ? (tw.id === 'heart1' ? 80 : 40) : 0;
    if (first) { D.chal.streak = D.chal.last === d - 1 ? D.chal.streak + 1 : 1; D.chal.last = d; D.chal.stamps++; }
    let gift = '';
    if (first && D.chal.streak % 7 === 0) { D.b.hint++; D.b.shield++; D.b.lift++; D.coins += 150; gift = '7일 도장 완성! 힌트·방석·집기 + 생선 150'; }
    S.rescued.forEach((v, i) => D.bond[i] += v); D.coins += fish; addEvent(); P.save();
    Meta.track && (Meta.track('clear', 1), Meta.track('cats', S.total));
    open(`<h2>도전 성공!</h2><div class="twist"><img src="${CatArt.iconURL(tw.breed ?? 6, 150, 2, 'happy', Game.outfitOf(tw.breed ?? 6))}"><div><b>${tw.n}</b><small>${first ? '오늘의 도장 획득!' : '오늘은 이미 도장을 받았어요'}</small></div></div>
      <div class="stamps">${Array.from({ length: 7 }, (_, i) => `<i class="${i < ((D.chal.streak - 1) % 7) + 1 ? 'on' : ''} ${first && i === (D.chal.streak - 1) % 7 ? 'new' : ''}">${i < ((D.chal.streak - 1) % 7) + 1 ? '' : i + 1}</i>`).join('')}</div>
      ${fish ? `<div class="reward">${FISH.replace('14', '22').replace('10', '15')} +${fish}</div>` : ''}${gift ? `<div class="reward">${gift}</div>` : ''}
      ${fish ? `<button class="btn yellow" id="chDbl"><span class="ad">AD</span>생선 2배</button>` : ''}<button class="btn pink" id="chHome">홈으로</button>`);
    P.sfx('perfect'); setTimeout(() => P.sfx('chest'), 700);
    const db = $('#chDbl'); if (db) db.onclick = () => { click(); P.rewarded('chal2x', ok => { if (ok) { D.coins += fish; P.save(); db.disabled = true; } }); };
    $('#chHome').onclick = () => { click(); close(); S.challenge = false; App.showHome(); };
  }
  function challengeFail() {
    open(`<h2 style="color:#9C8AB8">아쉽다냥…</h2><img src="${CatArt.iconURL(4, 200, 2, 'bump', 'bubble')}" width="120"><p>오늘의 도전은 몇 번이든 다시 할 수 있어요!</p>
      <button class="btn mint" id="cfAd"><span class="ad">AD</span>하트 채우고 계속</button><button class="btn pink" id="cfRe">처음부터 다시</button><button class="btn ghost" id="cfHome">홈으로</button>`);
    P.sfx('fail');
    $('#cfAd').onclick = () => { click(); P.rewarded('chalcont', ok => { if (ok) { close(); Game.continueGame(); if (S.twist === 'heart1') S.hearts = 1; } }); };
    $('#cfRe').onclick = () => { click(); close(); startChallenge(); };
    $('#cfHome').onclick = () => { click(); close(); S.challenge = false; App.showHome(); };
  }

  // ---------------- 주간 이벤트 ----------------
  const EVENTS = [
    { cat: 0, acc: 'santa', n: '치즈의 겨울 축제', accN: '산타 모자' }, { cat: 6, acc: 'sakura', n: '샴의 벚꽃 산책', accN: '벚꽃 핀' },
    { cat: 4, acc: 'sunnies', n: '턱시도의 바캉스', accN: '하트 선글라스' }, { cat: 3, acc: 'pumpkin', n: '삼색이 호박 파티', accN: '호박 모자' },
    { cat: 1, acc: 'santa', n: '구름이의 눈사람 만들기', accN: '산타 모자' }, { cat: 7, acc: 'pumpkin', n: '까망이의 할로윈', accN: '호박 모자' },
    { cat: 5, acc: 'sakura', n: '하늘이의 봄바람', accN: '벚꽃 핀' }, { cat: 2, acc: 'sunnies', n: '고등어의 해변 낮잠', accN: '하트 선글라스' },
  ];
  const EV_GOALS = [[30, '생선 40', () => D.coins += 40], [60, '힌트 · 방석', () => { D.b.hint++; D.b.shield++; }], [100, '', null]];
  ['santa', 'sakura', 'sunnies', 'pumpkin'].forEach(id => { if (!Meta.ACC.find(a => a.id === id)) Meta.ACC.push({ id, n: { santa: '산타 모자', sakura: '벚꽃 핀', sunnies: '하트 선글라스', pumpkin: '호박 모자' }[id], price: 0, r: 3, ev: true }); });
  const curEvent = () => EVENTS[weekIdx() % EVENTS.length];
  function evState() { const w = weekIdx(); if (!D.ev || D.ev.w !== w) { D.ev = { w, got: 0, claimed: [] }; P.save(); } return D.ev; }
  function addEvent() { if (!on('event')) return; const e = curEvent(), st = evState(); st.got += S.rescued[e.cat] || 0; P.save(); }
  function eventPill() {
    const e = curEvent(), st = evState(), el = $('#eventPill'); if (!el) return;
    const ready = EV_GOALS.some(([need], i) => st.got >= need && !st.claimed.includes(i));
    el.innerHTML = `<img src="${pillIcon(e)}"><span class="evbar"><i style="width:${Math.min(100, st.got)}%"></i></span><small>이벤트</small>${ready ? '<i class="dot"></i>' : ''}`; el.title = e.n;
  }
  let pillCache = {}; const pillIcon = e => pillCache[e.cat + e.acc] || (pillCache[e.cat + e.acc] = CatArt.iconURL(e.cat, 64, 2, 'happy', e.acc));
  function openEvent() {
    const e = curEvent(), st = evState(), left = 7 - ((dayIdx() + 3) % 7);
    open(`<div class="sub2">이번 주 이벤트 · ${left}일 남음</div><h2>${e.n}</h2>
      <div class="evhero"><img src="${CatArt.iconURL(e.cat, 220, 2, 'happy', e.acc)}"></div>
      <p>이번 주에는 <b>${CATN[e.cat]}</b>가 자주 나와요! ${CATN[e.cat]}를 100마리 구하면<br>이벤트 한정 <b>${e.accN}</b>을 받아요.</p>
      <div class="mbar big"><i style="width:${Math.min(100, st.got)}%"></i></div><div class="sub2">${CATN[e.cat]} 구출 ${Math.min(100, st.got)} / 100</div>
      <div class="evgoals">${EV_GOALS.map(([need, txt], i) => { const ok = st.got >= need, got = st.claimed.includes(i);
        return `<div class="evg ${got ? 'done' : ok ? 'ready' : ''}" data-ev="${i}"><b>${need}마리</b><small>${i === 2 ? e.accN + ' + 생선 100' : txt}</small><button class="mb">${got ? '완료' : ok ? '받기' : '잠김'}</button></div>`; }).join('')}</div>
      <button class="btn ghost" id="evClose">닫기</button>`);
    $$('[data-ev]').forEach(b => b.onclick = () => { const i = +b.dataset.ev; if (st.got < EV_GOALS[i][0] || st.claimed.includes(i)) return;
      st.claimed.push(i); if (i === 2) { D.owned[e.acc] = true; D.wear[e.cat] = e.acc; D.coins += 100; } else EV_GOALS[i][2](); P.save();
      P.sfx(i === 2 ? 'perfect' : 'chest'); window.Cute && Cute.celebrate(b); if (i === 2) Game.burstConfetti(40); setTimeout(openEvent, 600); });
    $('#evClose').onclick = () => { click(); close(); };
  }
  // featured cat appears more often during the event (cosmetic only)
  const ld = Game.loadStage;
  Game.loadStage = function (n, pic, opt) {
    const r = ld.call(Game, n, pic, opt);
    if (on('event') && !(S.twist === 'breed' && S.challenge)) { const e = curEvent(); S.cats.forEach(k => { if ((k.id * 37 + n) % 4 === 0) { k.lvl = e.cat; const o = Game.outfitOf(e.cat); k.acc = o || k.acc; } }); }
    if (!S.challenge) S.twist = null;
    return r;
  };

  // ---------------- route clear / fail for challenge & count event ----------------
  const prevClear = S.hooks.clear; Game.on('clear', (...a) => { if (S.challenge) { challengeClear(); return; } addEvent(); prevClear && prevClear(...a); });
  const prevFail = S.hooks.fail; Game.on('fail', (...a) => { if (S.challenge) { challengeFail(); return; } prevFail && prevFail(...a); });

  refresh(); setTimeout(announce, 1200);
  window.Flow = { restartChallenge: () => startChallenge(), on, refresh, openGoals, openChallenge, openEvent, announce, FEATURES: F };
})();
