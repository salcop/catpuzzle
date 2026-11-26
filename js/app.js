/* 냥이 대탈출 - app flow / screens */
(function () {
  'use strict';
  const VERSION = '2.0.0';
  // TODO(출시 전): 개인정보처리방침을 GitHub Pages 등에 올리고 주소 교체
  const PRIVACY_URL = 'https://YOUR-ID.github.io/nyang-escape/privacy.html';
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s), S = Game.S, P = Platform, D = P.D;
  const PRICE = { hint: 120, shield: 160, lift: 240, time: 200 }, CONT_COSTS = [600, 1000, 1500], BOOSTER_UNLOCK = 3; let contN = 0;
  // ---------- 냥이 호감도 (bond) ----------
  const BOND_LV = [0, 15, 60, 150, 300, 500];
  const OUTFIT = { 2: 'ribbon', 3: 'scarf', 4: 'flower', 5: 'crown' };
  const OUTFIT_NAME = { ribbon: '리본', scarf: '목도리', flower: '꽃화관', crown: '왕관' };
  const LV_REWARD = { 2: ['힌트 +1', () => D.b.hint++], 3: ['방석 +1', () => D.b.shield++], 4: ['집어올리기 +1', () => D.b.lift++], 5: ['부스터 세트', () => { D.b.hint++; D.b.shield++; D.b.lift++; }], 6: ['생선 300', () => D.coins += 300] };
  const PROFILE = [
    { n: '치즈', p: '탈출 작전 대장. 매번 잡히지만 늘 씩씩해요.', t: ['고마워! 역시 믿을 만하다냥!', '대장으로서 감사 인사한다냥!', '덕분에 오늘도 뽀송하다냥~'] },
    { n: '구름', p: '겁 많은 하얀 냥이. 물이 제일 무서워요.', t: ['흐아앙… 무서웠어… 고마워…', '구해줘서 고마워냥! 이거 받아…', '이제 하나도 안 무서워!'] },
    { n: '고등어', p: '느긋한 고등어 무늬. 낮잠이 취미예요.', t: ['음냐… 덕분에 낮잠 자러 간다냥.', '고맙다냥~ 느긋하게 감사 인사~', '최고의 친구다냥!'] },
    { n: '삼색이', p: '먹보 삼색이. 간식 냄새를 제일 먼저 맡아요.', t: ['고마워! 내 간식 나눠줄게!', '탈출 기념 붕어빵 파티다냥!', '츄르 하나 줄게… 반만…'] },
    { n: '턱시도', p: '허세 가득 턱시도. 오리 인형이 보물이에요.', t: ['흥, 혼자서도 나갈 수 있었지만… 고맙다.', '이 몸을 구하다니 제법이군!', '오리 인형도 고맙대!'] },
    { n: '하늘', p: '조용한 하늘색 냥이. 창밖 구경을 좋아해요.', t: ['…고마워. 하늘 보러 갈래.', '조용히 감사하는 중이다냥.', '오늘 하늘이 예쁘다냥. 고마워.'] },
    { n: '샴', p: '차분한 언니 샴. 수건을 두르고 다녀요.', t: ['고마워. 다들 챙겨줘서.', '수고했어, 차 한잔 할래?', '역시 든든하네. 고마워♥'] },
    { n: '까망', p: '시크한 전략가 까망. 사실 정이 많아요.', t: ['…고맙다. 신세 졌군.', '나쁘지 않은 솜씨다.', '…다음에도 부탁한다.'] },
  ];
  const josa = (w, x, y) => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c % 28 ? x : y); };
  const levelOf = c => { let l = 1; BOND_LV.forEach((v, i) => { if (D.bond[c] >= v) l = i + 1; }); return l; };
  const outfitOf = c => { const l = levelOf(c); let o = null; for (let i = 2; i <= l; i++) if (OUTFIT[i]) o = OUTFIT[i]; return o; };
  Game.outfitOf = outfitOf;
  // ---------- stars · titles · chests · achievements ----------
  const totalStars = () => Object.values(D.stars).reduce((s, v) => s + v, 0);
  const TITLES = [[0, '견습 집사'], [30, '새내기 집사'], [80, '든든한 집사'], [150, '베테랑 집사'], [250, '고양이 박사'], [400, '전설의 집사']];
  const titleOf = s => { let t = TITLES[0][1]; TITLES.forEach(([v, n]) => { if (s >= v) t = n; }); return t; };
  const STAR_FISH = { normal: [0, 5, 10, 20], rest: [0, 5, 8, 15], hard: [0, 10, 25, 45], super: [0, 25, 55, 100] };
  const CHEST = [[10, '힌트 1 · 생선 30', () => { D.b.hint++; D.coins += 30; }], [20, '방석 1 · 시계 1', () => { D.b.shield++; D.tAdd++; }], [30, '부스터 세트 · 생선 100', () => { D.b.hint++; D.b.shield++; D.b.lift++; D.coins += 100; }]];
  const chapStars = c => { let s = 0; for (let i = c * 10 + 1; i <= c * 10 + 10; i++) s += D.stars[i] || 0; return s; };
  const ACH = [
    ['first', '첫 탈출', '레벨 1 클리어', () => D.cleared >= 1, 20], ['l10', '욕실 졸업', '레벨 10 클리어', () => D.cleared >= 10, 50], ['l30', '탈출 전문가', '레벨 30 클리어', () => D.cleared >= 30, 100], ['l60', '탈출의 달인', '레벨 60 클리어', () => D.cleared >= 60, 200],
    ['p1', '첫 퍼펙트', '별 3개 받기', () => D.totals.perfect >= 1, 20], ['p10', '완벽주의 냥', '별 3개 10번', () => D.totals.perfect >= 10, 80], ['p30', '퍼펙트 집사', '별 3개 30번', () => D.totals.perfect >= 30, 200],
    ['s50', '별 모으기', '별 50개', () => totalStars() >= 50, 60], ['s150', '별이 반짝', '별 150개', () => totalStars() >= 150, 150],
    ['c100', '구조대', '냥이 100마리 구출', () => D.totals.cats >= 100, 30], ['c500', '구조 대장', '냥이 500마리 구출', () => D.totals.cats >= 500, 100], ['c2000', '냥이의 영웅', '냥이 2000마리 구출', () => D.totals.cats >= 2000, 300],
    ['h5', '용감한 집사', '어려운 레벨 5개 클리어', () => D.totals.hard >= 5, 60], ['h20', '강철 집사', '어려운 레벨 20개 클리어', () => D.totals.hard >= 20, 200],
    ['k10', '냥콤보 x10', '콤보 10 달성', () => D.totals.combo >= 10, 40], ['k20', '냥콤보 x20', '콤보 20 달성', () => D.totals.combo >= 20, 100],
    ['t1', '첫 집짓기', '캣타워 1단계', () => Tower.score(D.tower) >= 1, 20], ['t10', '건축가 냥', '캣타워 10단계', () => Tower.score(D.tower) >= 10, 150], ['tmax', '캣캐슬 완성', '캣타워 최대', () => Tower.score(D.tower) >= Tower.maxScore(), 500],
    ['b5', '절친', '한 냥이 호감도 Lv5', () => D.bond.some((_, i) => levelOf(i) >= 5), 150],
  ];
  const achReady = () => ACH.filter(([id, , , ok]) => ok() && !D.ach[id]).length;
  const perk = id => (D.tower[id] || 0);
  const CH = Story.CHAPTERS, chapOf = l => Math.floor((l - 1) / 10);
  const imgs = CH.map(c => { const i = new Image(); i.src = c.pic; return i; });
  const picOf = l => imgs[chapOf(l) % imgs.length];
  const FISH = '<svg viewBox="0 0 30 20" width="22" height="15"><path d="M3 10c5-8 15-8 20 0-5 8-15 8-20 0z" fill="#8FD0EA" stroke="#5DB3D6" stroke-width="1.5"/><path d="M23 10l5-5v10z" fill="#8FD0EA" stroke="#5DB3D6" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="8.5" r="1.6" fill="#5A3E4A"/></svg>';
  const FISH_S = FISH.replace('width="22" height="15"', 'width="14" height="10"');
  const HEART = on => `<svg viewBox="0 0 30 30"><path d="M15 26C6 19.5 3 15 3 10.5A6 6 0 0 1 15 8a6 6 0 0 1 12 2.5C27 15 24 19.5 15 26z" fill="${on ? '#FF9CB5' : '#F3E4E8'}" stroke="${on ? '#E3728F' : '#E6D2D8'}" stroke-width="1.8"/>${on ? '<ellipse cx="15" cy="17" rx="3.4" ry="2.8" fill="#fff" opacity=".9"/><circle cx="11.3" cy="13" r="1.5" fill="#fff"/><circle cx="15" cy="11.6" r="1.5" fill="#fff"/><circle cx="18.7" cy="13" r="1.5" fill="#fff"/>' : ''}</svg>`;
  const SHIELD = '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="25" rx="16" ry="9" fill="#BFE3FA" stroke="#8CC4EA" stroke-width="2.5"/><ellipse cx="20" cy="21" rx="15" ry="8" fill="#DDF0FD" stroke="#8CC4EA" stroke-width="2.5"/></svg>';
  const TIERNAME = { normal: '보통', rest: '쉬어가기', hard: '어려움', super: '매우 어려움' };
  $$('.fishico').forEach(e => e.innerHTML = FISH);
  const click = () => P.sfx('click');
  function toast(m, ms) { const t = $('#toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), ms || 1800); }
  function coinsUI() { $$('.coinTxt').forEach(e => e.textContent = D.coins.toLocaleString()); }
  function openModal(h) { $('#card').innerHTML = h; $('#modal').classList.remove('hidden'); }
  function closeModal() { $('#modal').classList.add('hidden'); }
  const modalOpen = () => !$('#modal').classList.contains('hidden');

  // ---------- HUD ----------
  let lastCombo = 0;
  Game.on('sfx', P.sfx); Game.on('vibrate', P.vibrate);
  Game.on('hud', () => {
    $('#hearts').innerHTML = Array.from({ length: S.maxHearts }, (_, i) => HEART(i < S.hearts)).join('') + (S.shield > 0 ? SHIELD : '');
    $('#bar').style.width = (S.out / S.total * 100) + '%'; $('#plbl').textContent = '탈출 ' + S.out + ' / ' + S.total; $('#gfill').style.width = (S.gauge * 100) + '%';
    const c = $('#combo'); if (S.combo >= 2) { c.classList.remove('hidden'); $('#cn').textContent = 'x' + S.combo; if (S.combo !== lastCombo) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } } else c.classList.add('hidden'); lastCombo = S.combo;
    boosterUI();
  });
  Game.on('timer', () => { const t = $('#timer'); if (!S.timeMax) { t.classList.add('hidden'); return; } t.classList.remove('hidden'); const s = Math.ceil(S.timeLeft); t.querySelector('b').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); t.querySelector('i').style.width = (S.timeLeft / S.timeMax * 100) + '%'; t.classList.toggle('low', S.timeLeft <= 10); });
  Game.on('gauge', () => $('#gfill').style.width = (S.gauge * 100) + '%');
  Game.on('fever', on => $('#gauge').classList.toggle('fever', on));
  Game.on('coinPick', v => { D.coins += v === 2 ? 3 : 1; D.totals.fish += v === 2 ? 3 : 1; P.save(); coinsUI(); });
  Game.on('stage', I => { setTimeout(() => S.hooks.timer && S.hooks.timer(), 0); $('#stTxt').textContent = '레벨 ' + S.stage; $('#stTag').textContent = TIERNAME[I.kind]; $('#stTag').className = 'tier ' + I.kind; $('#banner').className = I.kind; });
  function boosterUI() {
    $$('.item').forEach(b => {
      const k = b.dataset.b, n = k === 'time' ? D.tAdd : D.b[k], bd = b.querySelector('.badge'), locked = S.stage < BOOSTER_UNLOCK || (k === 'time' && !S.timeMax);
      b.classList.toggle('lock', locked);
      if (locked) { bd.className = 'badge c'; bd.textContent = 'Lv' + BOOSTER_UNLOCK; }
      else if (n > 0) { bd.className = 'badge n'; bd.textContent = n; } else { bd.className = 'badge c'; bd.innerHTML = FISH_S + PRICE[k]; }
      b.classList.toggle('on', k === 'shield' && S.shield > 0);
    });
  }
  $$('.item').forEach(b => b.onclick = () => {
    if (S.state !== 'play') return; const k = b.dataset.b; click();
    if (S.stage < BOOSTER_UNLOCK) { toast(`부스터는 레벨 ${BOOSTER_UNLOCK}부터 쓸 수 있어요`); return; }
    S.usedBooster = true; const use = () => k === 'hint' ? Game.useHint() : k === 'shield' ? Game.useShield() : k === 'time' ? Game.addTime(15) : Game.liftBest();
    if (k === 'time' && !S.timeMax) { toast('타이머가 있는 레벨(8~)에서 쓸 수 있어요'); return; }
    if (k === 'time' && D.tAdd > 0) { if (use()) { D.tAdd--; P.save(); } boosterUI(); return; }
    if (D.b[k] > 0) { if (use()) { D.b[k]--; P.save(); P.log('booster', k); } }
    else if (D.coins >= PRICE[k]) { if (use()) { D.coins -= PRICE[k]; P.save(); coinsUI(); P.log('booster_buy', k); } }
    else openShop(true);
    boosterUI();
  });

  // ---------- screens ----------
  const GAME_UI = ['#hud', '#hearts', '#gaugeRow', '#progress', '#items'];
  function showGame() { $('#home').classList.add('hidden'); GAME_UI.forEach(s => $(s).classList.remove('hidden')); P.music('bgm'); }
  function showHome() { closeModal(); S.state = 'idle'; Game.setPaused(true); $('#home').classList.remove('hidden'); GAME_UI.concat(['#combo']).forEach(s => $(s).classList.add('hidden')); P.music('bgm_home'); homeUI(); }

  // ---------- new-mechanic tips ----------
  const TIPS = {
    3: { t: '츄르 & 생선', d: '빈 칸의 츄르·생선 위로 냥이가 지나가면 냠냠! 생선을 모으고 츄르 게이지가 차요. 부스터도 이제 쓸 수 있어요!', churu: true },
    5: { t: '츄르 타임!', d: '연속으로 탈출시키면 냥콤보! 츄르 게이지가 가득 차면 6초 동안 부딪혀도 하트가 안 줄어요.', cat: [0, 'happy'] },
    8: { t: '움직이지 않는 친구들', d: '고무오리와 대야는 비켜주지 않아요. 그 방향을 보는 냥이는 다른 길이 없다면 집어올리기!', obs: true },
    10: { t: '어려운 레벨 등장', d: '보라색 레벨은 보상이 2배 이상! 막히면 방석·힌트를 아끼지 마세요.', cat: [7, 'bump'] },
    15: { t: '졸린 냥이', d: 'zZz… 자고 있는 냥이는 첫 탭에 깨어나기만 해요. 한 번 더 탭하면 출발!', cat: [5, 'sleep'] },
    20: { t: '매우 어려운 레벨!', d: '20레벨마다 커다란 판이 등장해요. 보상은 생선 100!', cat: [4, 'bump', 'crown'] },
  };
  function showTip(n) {
    const T = TIPS[n]; if (!T || D.seen.tips.includes(n)) return Promise.resolve();
    D.seen.tips.push(n); P.save();
    return new Promise(res => {
      openModal(`<div style="font-size:12px;font-weight:900;color:#A27786">새로운 규칙</div><h2>${T.t}</h2><canvas class="tipart" width="240" height="200"></canvas><p>${T.d}</p><button class="btn pink" id="tipOk">알겠다냥!</button>`);
      const x = $('.tipart').getContext('2d'); x.scale(2, 2);
      if (T.churu) { x.save(); x.translate(60, 54); x.rotate(-.5); x.fillStyle = '#FF9CB5'; x.strokeStyle = '#E3728F'; x.lineWidth = 3; x.beginPath(); x.roundRect(-10, -26, 20, 48, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.fillRect(-10, -6, 20, 9); x.restore(); }
      else if (T.obs) { x.save(); x.translate(40, 56); x.fillStyle = '#FFE066'; x.strokeStyle = '#E5B530'; x.lineWidth = 2.4; x.beginPath(); x.ellipse(-2, 8, 22, 15, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.arc(9, -10, 13, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#FF9F43'; x.beginPath(); x.ellipse(22, -8, 8, 4, 0, 0, 7); x.fill(); x.restore(); x.save(); x.translate(92, 64); CatArt.drawCat(x, 3, 60, 3, { mood: 'bump' }); x.restore(); }
      else { x.save(); x.translate(60, 62); CatArt.drawCat(x, T.cat[0], 70, 2, { mood: T.cat[1], acc: T.cat[2], t: 1 }); x.restore(); }
      P.sfx('pop'); $('#tipOk').onclick = () => { click(); closeModal(); res(); };
    });
  }

  // ---------- level flow ----------
  let replay = 0;
  async function startLevel() {
    const n = replay || D.level; replay = 0; const _n = n, c = chapOf(n);
    if (!D.seen.prologue) { P.music('bgm_home'); await Story.prologue(); D.seen.prologue = true; P.save(); }
    if ((n - 1) % 10 === 0 && !D.seen.chapters.includes(c)) { P.music('bgm_home'); await Story.chapterIntro(c); D.seen.chapters.push(c); P.save(); }
    Game.loadStage(n, picOf(n)); Game.setPaused(false);
    contN = 0; if (D.streak > 0 && D.streak % 5 === 0) S.shield = Math.max(S.shield, 1);
    if (perk('bed') && Math.random() < perk('bed') * .1) { S.shield = Math.max(S.shield, 1); }
    if (perk('toy')) S.gauge = Math.min(.5, perk('toy') * .1);
    showGame(); boosterUI(); coinsUI(); D.stats.plays++; P.save(); P.log('level_start', n);
    S.state = 'intro';
    await showTip(n);
    if (S.kind === 'hard' || S.kind === 'super') await hardSplash();
    S.state = 'play'; Game.S.hooks.hud();
    if (n === 1) tutorial();
  }
  function hardSplash() {
    return new Promise(res => {
      const sp = $('#splash'); sp.className = S.kind === 'super' ? 'super' : ''; $('#splashT').textContent = TIERNAME[S.kind] + (S.kind === 'super' ? '!!' : '!');
      $('#splashS').textContent = `보상 생선 ${S.reward} · 신중하게!`; $('#splashCat').src = CatArt.iconURL(7, 220, 2, 'bump', S.kind === 'super' ? 'crown' : null); P.sfx('warn');
      const done = () => { if (sp.classList.contains('hidden')) return; sp.classList.add('hidden'); res(); };
      sp.onclick = done; setTimeout(done, 1800);
    });
  }
  // guided first level: highlight a free cat + bouncing finger, 3 times
  let tutStep = 0;
  function tutorial() {
    tutStep = 0; S.tutorial = true;
    const guide = () => {
      if (S.state !== 'play') return;
      const f = Game.freeCats().filter(k => !k.sleepy); if (!f.length) return;
      f.sort((a, b) => (b.r - a.r) || (a.c - b.c)); const k = f[0];
      S.hint = k.id; S.finger = { x: k.c * 56 + 28, y: k.r * 56 + 20 };
      Game.say(k, tutStep === 0 ? '나를 눌러줘냥!' : tutStep === 1 ? '발바닥 방향으로 가요~' : '마지막 연습!', 'heart', 2.5);
    };
    Game.on('tapped', () => {
      if (!S.tutorial) return; S.finger = null; tutStep++;
      if (tutStep >= 3) { S.tutorial = false; S.hint = null; setTimeout(() => { if (S.state === 'play') toast('잘했어요! 이제 혼자 해볼까냥? 앞이 막힌 냥이는 콩! 부딪혀요', 2600); }, 700); return; }
      setTimeout(guide, 900);
    });
    setTimeout(guide, 600);
  }

  // ---------- results ----------
  function piecesHTML(chapter, newIdx) { const done = Math.max(0, Math.min(10, D.cleared - chapter * 10)); return Array.from({ length: 10 }, (_, i) => `<i class="${i < done ? (i === newIdx ? 'got new' : 'got') : ''}">${i < done ? '' : i + 1}</i>`).join(''); }
  Game.on('clear', () => {
    $('#toast').classList.add('hidden');
    const n = S.stage, c = chapOf(n), newIdx = (n - 1) % 10, chapterDone = n % 10 === 0;
    const firstClear = n > D.cleared; D.cleared = Math.max(D.cleared, n); if (firstClear) D.level = n + 1; D.streak++; const gift = D.streak % 5 === 0;
    // ★ rating: clear / no mistakes / time margin (>=40%) or (no timer) used no booster/continue
    const starTime = S.timeMax ? S.timeLeft / S.timeMax >= .4 : (S.mistakes === 0 && contN === 0);
    const stars = 1 + (S.mistakes === 0 ? 1 : 0) + (starTime && contN === 0 ? 1 : 0); window.App && (App.lastStars = stars);
    const prev = D.stars[n] || 0, gained = Math.max(0, stars - prev); D.stars[n] = Math.max(prev, stars);
    const reward = Math.round((firstClear ? STAR_FISH[S.kind][stars] : Math.max(0, STAR_FISH[S.kind][stars] - STAR_FISH[S.kind][prev])) + perk('base'));
    D.totals.cats += S.total; if (stars === 3) D.totals.perfect++; if (S.kind === 'hard' || S.kind === 'super') D.totals.hard++; D.totals.combo = Math.max(D.totals.combo, S.bestCombo);
    const ups = [], before = D.bond.map((_, i) => levelOf(i)), bondMul = (1 + perk('house') * .1) * (stars === 3 ? 1.3 : 1);
    S.rescued.forEach((v, i) => D.bond[i] += Math.round(v * bondMul));
    D.bond.forEach((_, i) => { for (let l = before[i] + 1; l <= levelOf(i); l++) ups.push([i, l]); });
    const rep = S.rescued.indexOf(Math.max(...S.rescued));
    D.coins += reward; if (gift) D.b.shield++; P.save(); coinsUI(); P.log('level_clear', n);
    const title0 = titleOf(totalStars() - gained), title1 = titleOf(totalStars()); pendingTitle = title0 !== title1 ? title1 : null;
    pendingUps = ups;
    const C = CH[c % CH.length], PR = PROFILE[rep], line = PR.t[Math.floor(Math.random() * PR.t.length)];
    const bondRow = S.rescued.map((v, i) => [i, v]).filter(e => e[1] > 0).sort((x, y) => y[1] - x[1]).map(([i, v]) => {
      const l = levelOf(i), lo = BOND_LV[l - 1], hi = BOND_LV[l] ?? lo, pct = hi > lo ? Math.min(100, (D.bond[i] - lo) / (hi - lo) * 100) : 100;
      return `<div class="bd"><img src="${CatArt.iconURL(i, 72, 2, 'happy', outfitOf(i))}"><b>+${v}</b><div class="bbar"><i style="width:${pct}%"></i></div><small>Lv${l}</small></div>`; }).join('');
    openModal(`<div class="thx"><img class="thxcat" src="${CatArt.iconURL(rep, 220, 2, 'happy', outfitOf(rep))}"><div class="thxbub"><b>${PR.n}</b>${line}</div></div>
      <h2 style="margin-top:2px">${stars === 3 ? 'PERFECT!' : '탈출 성공!'}</h2>
      <div class="stars3">${[1, 2, 3].map(i => `<span class="st ${i <= stars ? 'on' : ''}" style="animation-delay:${.25 + i * .28}s">★</span>`).join('')}</div>
      <div class="starwhy"><span class="${'on'}">탈출</span><span class="${S.mistakes === 0 ? 'on' : ''}">실수 없이</span><span class="${starTime && contN === 0 ? 'on' : ''}">${S.timeMax ? '시간 여유' : '이어하기 없이'}</span></div>
      <div class="bondrow">${bondRow}</div>
      <div class="resrow"><div class="picframe sm"><img src="${C.pic}"><div class="pieces">${piecesHTML(c, newIdx)}</div></div>
        <div style="text-align:left"><div style="font-weight:900;font-size:12.5px;color:#A27786">'${C.picName}'<br>조각 ${newIdx + 1}/10 획득!</div>
        <div class="reward" style="font-size:16px">${FISH} +${reward}</div><div style="font-size:11px;color:#A27786;font-weight:900">${firstClear ? '별 ' + stars + '개 보상' : prev >= stars ? '이미 받은 별' : '새 별 보상'}${perk('base') ? ' · 캣타워 +' + perk('base') : ''}</div></div></div>
      <div style="font-size:12.5px;font-weight:900;color:#A27786">최대 냥콤보 x${S.bestCombo} · 연승 ${D.streak}${gift ? ' · <span style="color:#FF7F95">방석 선물!</span>' : ''} · ${titleOf(totalStars())}</div>
      ${reward > 0 ? `<button class="btn yellow" id="dbl"><span class="ad">AD</span>생선 2배 (+${reward})</button>` : `<button class="btn yellow" id="dbl" style="display:none"></button>`}<button class="btn pink" id="nxt">${chapterDone ? '그림 완성 보러가기' : '다음 레벨'}</button>`);
    [1, 2, 3].forEach(i => { if (i <= stars) setTimeout(() => { P.sfx('star', 1 + i * .12); P.vibrate(15); }, 250 + i * 280); }); setTimeout(() => P.sfx('thanks', Game.VOICE[rep]), 1300); if (stars === 3) setTimeout(() => { P.sfx('perfect'); Game.burstConfetti(60); }, 1150);
    $('#dbl').onclick = () => { click(); P.rewarded('double', ok => { if (ok) { D.coins += reward; P.save(); coinsUI(); P.sfx('coin'); $('#dbl').disabled = true; } }); };
    $('#nxt').onclick = async () => {
      click(); closeModal(); await showLevelUps(); await showTitle();
      if (chapterDone) { await chapterComplete(c); showHome(); return; }
      P.interstitial(); startLevel();
    };
  });
  let pendingUps = [], pendingTitle = null;
  async function showTitle() {
    if (!pendingTitle) return; const t = pendingTitle; pendingTitle = null;
    await new Promise(res => { openModal(`<div style="font-size:13px;font-weight:900;color:#A27786">별 ${totalStars()}개 달성!</div><h2>새 칭호</h2><div class="titlebadge">${t}</div><img src="${CatArt.iconURL(0, 220, 2, 'happy', 'crown')}" width="130"><button class="btn pink" id="tOk">자랑스러워요!</button>`);
      P.sfx('levelup'); Game.burstConfetti(50); $('#tOk').onclick = () => { click(); closeModal(); res(); }; });
  }
  async function showLevelUps() {
    for (const [i, l] of pendingUps) {
      await new Promise(res => {
        const o = OUTFIT[l], R = LV_REWARD[l]; if (R) R[1](); P.save(); coinsUI();
        openModal(`<div style="font-size:13px;font-weight:900;color:#A27786">${josa(PROFILE[i].n, '과', '와')} 더 친해졌어요!</div><h2>호감도 Lv${l}!</h2>
          <div class="lvup"><img src="${CatArt.iconURL(i, 260, 2, 'happy', outfitOf(i))}"></div>
          ${o ? `<div class="reward">새 옷 · ${OUTFIT_NAME[o]}</div><div style="font-size:12px;color:#A27786;font-weight:900">이제 게임 속 ${josa(PROFILE[i].n, '이', '가')} ${josa(OUTFIT_NAME[o], '을', '를')} 하고 나와요</div>` : ''}
          ${R ? `<div class="reward">${R[0]}</div>` : ''}<button class="btn pink" id="luOk">좋아요!</button>`);
        P.sfx('levelup'); Game.burstConfetti(40);
        $('#luOk').onclick = () => { click(); closeModal(); res(); };
      });
    }
    pendingUps = [];
  }
  function openCats() {
    openModal(`<h2>냥이 친구들</h2><div style="font-size:12px;color:#A27786;font-weight:900;margin:2px 0 8px">탈출시킬수록 친해지고 새 옷을 입어요</div>
      <div class="catgrid">${PROFILE.map((p, i) => { const l = levelOf(i), lo = BOND_LV[l - 1], hi = BOND_LV[l]; const pct = hi ? (D.bond[i] - lo) / (hi - lo) * 100 : 100;
        return `<div class="cc" data-c="${i}"><img src="${CatArt.iconURL(i, 110, 2, 'idle', outfitOf(i))}"><div class="cn">${p.n}</div><div class="hearts">${'♥'.repeat(l)}<span>${'♥'.repeat(6 - l)}</span></div><div class="bbar"><i style="width:${pct}%"></i></div><small>${hi ? D.bond[i] + ' / ' + hi : 'MAX'}</small></div>`; }).join('')}</div>
      <button class="btn ghost" id="catClose">닫기</button>`);
    $$('[data-c]').forEach(e => e.onclick = () => { click(); catDetail(+e.dataset.c); });
    $('#catClose').onclick = () => { click(); closeModal(); };
  }
  function catDetail(i) {
    const p = PROFILE[i], l = levelOf(i);
    openModal(`<div class="lvup"><img src="${CatArt.iconURL(i, 260, 2, 'happy', outfitOf(i))}"></div><h2>${p.n} <span style="font-size:16px;color:#A27786">Lv${l}</span></h2><p>${p.p}</p>
      <div style="font-size:12px;font-weight:900;color:#A27786">구출한 횟수 ${D.bond[i]}회</div>
      <div class="outfits">${[2, 3, 4, 5].map(lv => { const o = OUTFIT[lv], got = l >= lv; return `<div class="of ${got ? '' : 'lock'}"><img src="${CatArt.iconURL(i, 90, 2, 'idle', o)}"><small>${got ? OUTFIT_NAME[o] : 'Lv' + lv + ' (' + BOND_LV[lv - 1] + '마리)'}</small></div>`; }).join('')}</div>
      <p style="font-size:14px;color:#E3728F;font-weight:900">"${p.t[Math.min(l - 1, p.t.length - 1)]}"</p>
      <button class="btn pink" id="cdBack">목록으로</button>`);
    P.sfx('tap_go', Game.VOICE[i]); $('#cdBack').onclick = () => { click(); openCats(); };
  }
  // ---------- 캣타워 ----------
  let towerRAF = 0;
  function openTower() {
    const P2 = Tower.PARTS;
    openModal(`<h2>우리 캣타워</h2><div style="font-size:13px;font-weight:900;color:#A27786">${Tower.rank(D.tower)} · ${Tower.score(D.tower)}/${Tower.maxScore()}단계</div>
      <canvas id="tw" class="towercv" width="300" height="260"></canvas>
      <div class="parts">${P2.map(p => { const lv = D.tower[p.id] || 0, max = lv >= p.max, cost = p.cost[lv];
        return `<div class="part"><div class="pn">${p.name} <span>${'●'.repeat(lv)}<u>${'●'.repeat(p.max - lv)}</u></span></div><div class="pd">${p.perk}</div>
        <button class="pb ${max ? 'max' : D.coins >= cost ? '' : 'poor'}" data-p="${p.id}">${max ? '완성' : FISH_S + cost.toLocaleString()}</button></div>`; }).join('')}</div>
      <button class="btn ghost" id="twClose">닫기</button>`);
    const cv = $('#tw'), dp = Math.min(devicePixelRatio || 1, 3); cv.width = 300 * dp; cv.height = 260 * dp; const x = cv.getContext('2d'); x.scale(dp, dp);
    cancelAnimationFrame(towerRAF); const loop = n => { if (!$('#tw')) return; x.clearRect(0, 0, 300, 260); Tower.draw(x, 300, 260, D.tower, n / 1000, [0, 3, 4, 6, 1, 7].map(l => ({ l, acc: outfitOf(l) }))); towerRAF = requestAnimationFrame(loop); }; towerRAF = requestAnimationFrame(loop);
    $$('[data-p]').forEach(b => b.onclick = () => {
      const p = P2.find(q => q.id === b.dataset.p), lv = D.tower[p.id] || 0; if (lv >= p.max) return;
      if (p.id !== 'base' && !D.tower.base) { toast('받침대부터 지어주세요!'); return; }
      const cost = p.cost[lv]; if (D.coins < cost) { toast('생선이 부족해요. 별 3개로 더 모아봐요!'); P.sfx('heart'); return; }
      D.coins -= cost; D.tower[p.id] = lv + 1; P.save(); coinsUI(); P.sfx('build'); P.vibrate(30);
      toast(`${p.name} ${lv + 1}단계 완성!`); openTower();
    });
    $('#twClose').onclick = () => { click(); cancelAnimationFrame(towerRAF); closeModal(); homeUI(); };
  }
  function openAch() {
    openModal(`<h2>업적</h2><div style="font-size:13px;font-weight:900;color:#A27786">${ACH.filter(a => D.ach[a[0]]).length} / ${ACH.length} 달성 · ${titleOf(totalStars())}</div>
      <div class="achlist">${ACH.map(([id, n, d, ok, r]) => { const done = D.ach[id], ready = !done && ok();
        return `<div class="ach ${done ? 'done' : ready ? 'ready' : ''}"><div class="am">${done ? '<svg viewBox="0 0 32 32" width="24" height="24"><path d="M10 3h4l3 9h-4zM22 3h-4l-3 9h4z" fill="#9FC9F0"/><circle cx="16" cy="20" r="9" fill="#FFD457" stroke="#E0A812" stroke-width="2"/><path d="M16 15l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff"/></svg>' : ready ? '<svg viewBox="0 0 32 32" width="24" height="24"><rect x="6" y="14" width="20" height="13" rx="3" fill="#FF9CB5"/><rect x="4" y="10" width="24" height="6" rx="2" fill="#FFB6C9"/><rect x="14" y="10" width="4" height="17" fill="#FFE38A"/><path d="M16 10c-5-6-9-1-4 0M16 10c5-6 9-1 4 0" stroke="#FFE38A" stroke-width="2.4" fill="none"/></svg>' : '<svg viewBox="0 0 32 32" width="22" height="22"><rect x="8" y="14" width="16" height="13" rx="3" fill="#E6D2D8"/><path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke="#D3BCC4" stroke-width="2.6" fill="none"/></svg>'}</div><div><b>${n}</b><small>${d}</small></div><button data-a="${id}" class="ab">${done ? '완료' : ready ? FISH_S + r : FISH_S + r}</button></div>`; }).join('')}</div>
      <div style="font-size:11.5px;color:#A27786;font-weight:900;margin-top:8px">칭호: ${TITLES.map(t => t[1] + ' ★' + t[0]).join(' · ')}</div>
      <button class="btn ghost" id="achClose">닫기</button>`);
    $$('[data-a]').forEach(b => b.onclick = () => { const A2 = ACH.find(q => q[0] === b.dataset.a); if (D.ach[A2[0]] || !A2[3]()) return; D.ach[A2[0]] = 1; D.coins += A2[4]; P.save(); coinsUI(); P.sfx('chest'); Game.burstConfetti(30); toast(`${A2[1]} 달성! 생선 +${A2[4]}`); openAch(); });
    $('#achClose').onclick = () => { click(); closeModal(); homeUI(); };
  }
  function openChest() {
    const c = chapOf(D.level), cs = chapStars(c);
    openModal(`<h2>별 보물상자</h2><div style="font-size:13px;font-weight:900;color:#A27786">챕터 ${c + 1} 별 ${cs} / 30 · 지난 레벨을 다시 해서 별을 모아요</div>
      <div class="chests">${CHEST.map(([need, txt], i) => { const k = c + '_' + i, got = D.chests[k], ready = !got && cs >= need;
        return `<div class="chestbox ${got ? 'got' : ready ? 'ready' : ''}" data-ch="${i}"><div class="cb">${got ? '<svg viewBox="0 0 32 32" width="28" height="28"><rect x="6" y="15" width="20" height="12" rx="3" fill="#B9E6C9"/><path d="M4 12l24-5 1 5-24 5z" fill="#9FD6B6"/><circle cx="10" cy="6" r="1.6" fill="#FFD457"/><circle cx="22" cy="4" r="1.4" fill="#FF9CB5"/><circle cx="26" cy="10" r="1.2" fill="#FFD457"/></svg>' : '<svg viewBox="0 0 32 32" width="28" height="28"><rect x="6" y="14" width="20" height="13" rx="3" fill="#FF9CB5"/><rect x="4" y="10" width="24" height="6" rx="2" fill="#FFB6C9"/><rect x="14" y="10" width="4" height="17" fill="#FFE38A"/><path d="M16 10c-5-6-9-1-4 0M16 10c5-6 9-1 4 0" stroke="#FFE38A" stroke-width="2.4" fill="none"/></svg>'}</div><b>★${need}</b><small>${txt}</small></div>`; }).join('')}</div>
      <button class="btn ghost" id="chClose">닫기</button>`);
    $$('[data-ch]').forEach(e => e.onclick = () => { const i = +e.dataset.ch, k = c + '_' + i; if (D.chests[k] || cs < CHEST[i][0]) return; D.chests[k] = 1; CHEST[i][2](); P.save(); coinsUI(); P.sfx('chest'); Game.burstConfetti(50); toast('보물상자 열림! ' + CHEST[i][1]); openChest(); });
    $('#chClose').onclick = () => { click(); closeModal(); homeUI(); };
  }
  async function chapterComplete(c) {
    const C = CH[c % CH.length];
    await new Promise(res => {
      openModal(`<div style="font-size:13px;font-weight:900;color:#A27786">챕터 ${c + 1} 완료</div><h2>그림 완성!</h2><div class="picframe" style="width:220px"><img src="${C.pic}"></div><div style="font-weight:900;font-size:17px">'${C.picName}'</div><div class="reward">${FISH} +100 · 힌트 +1 · 방석 +1</div><button class="btn pink" id="cc">이야기 보기</button>`);
      D.coins += 100; D.b.hint++; D.b.shield++; P.save(); coinsUI(); P.sfx('chapter'); Game.burstConfetti(60);
      $('#cc').onclick = () => { click(); closeModal(); res(); };
    });
    P.music('bgm_home'); await Story.chapterOutro(c);
  }
  Game.on('fail', (why) => {
    D.stats.fails++; P.save(); P.log('level_fail', S.stage); const CONT_COIN = CONT_COSTS[Math.min(contN, 2)];
    openModal(`<h2 style="color:#9C8AB8">${why === 'time' ? '집사가 왔다냥!' : '꽉 막혔다냥…'}</h2><img src="${CatArt.iconURL(4, 200, 2, 'bump', 'bubble')}" width="130"><div style="font-weight:900;margin:2px 0 6px">냥이 <span style="color:#FF7F95">${S.total - S.out}마리</span>만 더 나가면 돼요!</div>
      <div style="font-size:12px;color:#A27786;font-weight:900">${why === 'time' ? '시간 +15초로 이어하기' : '하트 +3으로 이어하기'} · 이어하면 별 1개 감소</div>
      <button class="btn mint" id="cAd"><span class="ad">AD</span>광고 보고 이어하기</button><button class="btn yellow" id="cCoin">${FISH} ${CONT_COIN}으로 이어하기</button><button class="btn ghost" id="giveup">포기하기 (연승 초기화)</button>`);
    $('#cAd').onclick = () => { click(); P.rewarded('continue', ok => { if (ok) { closeModal(); D.stats.conts++; contN++; P.save(); Game.continueGame(why); } }); };
    $('#cCoin').onclick = () => { click(); if (D.coins < CONT_COIN) { openShop(true); return; } D.coins -= CONT_COIN; contN++; P.save(); coinsUI(); closeModal(); Game.continueGame(why); };
    $('#giveup').onclick = () => { click(); D.streak = 0; P.save(); showHome(); };
  });

  // ---------- shop ----------
  const SKU = { no_ads: { price: '₩5,500', give: () => { D.noAds = true; D.coins += 1500; } }, starter_pack: { price: '₩3,300', give: () => { D.starter = true; D.coins += 2000; D.b.hint += 3; D.b.shield += 3; D.b.lift += 2; } },
    fish_3000: { price: '₩5,500', give: () => D.coins += 3000 }, fish_10000: { price: '₩14,000', give: () => D.coins += 10000 } };
  function buy(sku) { P.purchase(sku, ok => { if (!ok) return; SKU[sku].give(); P.save(); coinsUI(); P.sfx('coin'); toast('구매 완료! 고마워요 냥♥'); openShop(); homeUI(); }); }
  function openShop(lack) {
    const wasPlaying = S.state === 'play'; if (wasPlaying) Game.setPaused(true);
    const failed = S.state === 'fail';
    openModal(`<h2>상점</h2>${lack ? '<div style="font-weight:900;font-size:13px;color:#FF7F95;margin-top:4px">생선이 부족해요!</div>' : ''}
      <div class="shopitem"><div class="ic">${FISH}</div><div><div class="nm">무료 생선</div><div class="ds">광고 보고 생선 100</div></div><button class="pr" id="freeFish">AD 받기</button></div>
      <div class="shopitem best"><span class="tagbest">인기</span><div class="ic"><svg viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="3" fill="#FFB547"/><path d="M3 3l14 14" stroke="#FF6F8A" stroke-width="2.4" stroke-linecap="round"/></svg></div><div><div class="nm">광고 제거</div><div class="ds">레벨 사이 광고 영구 제거 + 생선 1,500</div></div><button class="pr ${D.noAds ? 'done' : ''}" data-sku="no_ads">${D.noAds ? '보유 중' : SKU.no_ads.price}</button></div>
      ${D.starter ? '' : `<div class="shopitem"><span class="tagbest" style="background:#FFB6C9;color:#fff">1회 한정</span><div class="ic"><img src="${CatArt.iconURL(0, 80, 2, 'happy', 'towel')}" width="40"></div><div><div class="nm">새내기 냥 꾸러미</div><div class="ds">생선 2,000 · 힌트3 · 방석3 · 집기2</div></div><button class="pr" data-sku="starter_pack">${SKU.starter_pack.price}</button></div>`}
      <div class="shopitem"><div class="ic">${FISH}</div><div><div class="nm">생선 한 바구니</div><div class="ds">생선 3,000</div></div><button class="pr" data-sku="fish_3000">${SKU.fish_3000.price}</button></div>
      <div class="shopitem"><div class="ic">${FISH}</div><div><div class="nm">생선 한 수레</div><div class="ds">생선 10,000 (+25% 보너스)</div></div><button class="pr" data-sku="fish_10000">${SKU.fish_10000.price}</button></div>
      <button class="btn ghost" id="shopClose">닫기</button>`);
    $('#freeFish').onclick = () => { click(); P.rewarded('freecoin', ok => { if (ok) { D.coins += 100; P.save(); coinsUI(); P.sfx('coin'); toast('생선 +100'); } }); };
    $$('[data-sku]').forEach(b => b.onclick = () => { click(); if (b.classList.contains('done')) return; buy(b.dataset.sku); });
    $('#shopClose').onclick = () => { click(); closeModal(); if (wasPlaying) Game.setPaused(false); if (failed) Game.S.hooks.fail(); };
  }

  // ---------- album ----------
  function openAlbum() {
    openModal(`<h2>냥 앨범</h2><div style="font-size:12px;color:#A27786;font-weight:900;margin:2px 0 8px">완성한 그림을 누르면 이야기를 다시 볼 수 있어요</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${CH.map((C, i) => { const done = Math.max(0, Math.min(10, D.cleared - i * 10)), open = D.cleared >= i * 10;
        return `<div data-ch="${i}" style="opacity:${open ? 1 : .55}"><div class="picframe" style="width:100%;margin:0">${open ? `<img src="${C.pic}">` : `<div style="aspect-ratio:2/3;background:#FFE6EE;display:grid;place-items:center;font-size:30px;color:#F4B6C6">?</div>`}<div class="pieces">${open ? Array.from({ length: 10 }, (_, j) => `<i class="${j < done ? 'got' : ''}"></i>`).join('') : ''}</div></div><div style="font-size:12px;font-weight:900;margin-top:4px">${open ? C.picName : '챕터 ' + (i + 1)}</div><div style="font-size:11px;color:#A27786">${done}/10</div></div>`; }).join('')}</div>
      <div style="font-size:12px;color:#A27786;margin-top:10px">업데이트로 새 챕터가 계속 추가돼요</div><button class="btn ghost" id="alClose">닫기</button>`);
    $$('[data-ch]').forEach(e => e.onclick = async () => { const i = +e.dataset.ch; if (D.cleared < (i + 1) * 10) { toast('그림을 완성하면 이야기가 열려요'); return; } click(); closeModal(); await Story.chapterOutro(i); P.music('bgm_home'); });
    $('#alClose').onclick = () => { click(); closeModal(); };
  }

  // ---------- daily (7-day cycle) ----------
  const DAYS = [{ t: '생선 20', g: () => D.coins += 20 }, { t: '힌트 1', g: () => D.b.hint++ }, { t: '생선 30', g: () => D.coins += 30 }, { t: '방석 1', g: () => D.b.shield++ },
    { t: '시계 1', g: () => D.tAdd++ }, { t: '집기 1', g: () => D.b.lift++ }, { t: '생선 100 + 부스터 세트', g: () => { D.coins += 100; D.b.hint++; D.b.shield++; D.b.lift++; } }];
  const today = () => new Date().toISOString().slice(0, 10);
  const dailyReady = () => D.daily.last !== today();
  function openDaily() {
    const ready = dailyReady(), idx = D.daily.day % 7;
    openModal(`<h2>출석 선물</h2><div style="font-size:12px;font-weight:900;color:#A27786">7일 연속 출석하면 큰 선물!</div>
      <div class="days">${DAYS.map((d, i) => `<div class="day ${i < idx ? 'got' : ''} ${i === idx && ready ? 'today' : ''} ${i === 6 ? 'big' : ''}"><b>${i + 1}일</b>${i < idx ? '받음' : d.t}</div>`).join('')}</div>
      ${ready ? `<button class="btn yellow" id="dAd"><span class="ad">AD</span>2배로 받기</button><button class="btn pink" id="dGet">받기</button>` : `<p>내일 또 와요! 냥~</p><button class="btn ghost" id="dClose">닫기</button>`}`);
    const give = mult => { for (let m = 0; m < mult; m++) DAYS[idx].g(); D.daily.day++; D.daily.last = today(); P.save(); coinsUI(); P.sfx('coin'); toast(`${DAYS[idx].t}${mult > 1 ? ' x2' : ''} 받았어요!`); closeModal(); homeUI(); };
    if (ready) { $('#dGet').onclick = () => { click(); give(1); }; $('#dAd').onclick = () => { click(); P.rewarded('daily', ok => ok && give(2)); }; }
    else $('#dClose').onclick = () => { click(); closeModal(); };
  }

  // ---------- settings / pause ----------
  function openSettings() {
    openModal(`<h2>설정</h2>
      <div class="setrow"><span>배경음악</span><button class="tog ${D.bgm ? 'on' : ''}" id="tBgm"></button></div>
      <div class="setrow"><span>효과음</span><button class="tog ${D.sfx ? 'on' : ''}" id="tSfx"></button></div>
      <div class="setrow"><span>진동</span><button class="tog ${D.vib ? 'on' : ''}" id="tVib"></button></div>
      <div class="links">${P.privacyRequired() ? '<button id="lPriv">개인정보 설정</button>' : ''}<button id="lRestore">구매 복원</button><button id="lPolicy">개인정보처리방침</button><button id="lStory">프롤로그 다시 보기</button></div>
      <button class="btn ghost" id="setClose">닫기</button><div class="ver">v${VERSION}</div>`);
    $('#tBgm').onclick = e => { P.setBgm(!D.bgm); e.target.classList.toggle('on', D.bgm); };
    $('#tSfx').onclick = e => { D.sfx = !D.sfx; P.save(); e.target.classList.toggle('on', D.sfx); click(); };
    $('#tVib').onclick = e => { D.vib = !D.vib; P.save(); e.target.classList.toggle('on', D.vib); P.vibrate(30); };
    const lp = $('#lPriv'); if (lp) lp.onclick = () => P.privacyOptions();
    $('#lRestore').onclick = () => { P.restore(); toast('구매 내역을 확인하고 있어요'); };
    $('#lPolicy').onclick = () => P.openUrl(PRIVACY_URL);
    $('#lStory').onclick = async () => { closeModal(); await Story.prologue(); P.music('bgm_home'); };
    $('#setClose').onclick = () => { click(); closeModal(); };
  }
  function openPause() {
    if (S.state !== 'play') return; Game.setPaused(true);
    openModal(`<h2>잠깐 쉬기</h2><img src="${CatArt.iconURL(1, 180, 2, 'sleep', 'towel')}" width="100">
      <div class="setrow"><span>배경음악</span><button class="tog ${D.bgm ? 'on' : ''}" id="pBgm"></button></div>
      <div class="setrow"><span>효과음</span><button class="tog ${D.sfx ? 'on' : ''}" id="pSfx"></button></div>
      <button class="btn pink" id="pRes">계속하기</button><button class="btn yellow" id="pRe">다시 하기</button><button class="btn ghost" id="pHome">홈으로</button>`);
    $('#pBgm').onclick = e => { P.setBgm(!D.bgm); e.target.classList.toggle('on', D.bgm); };
    $('#pSfx').onclick = e => { D.sfx = !D.sfx; P.save(); e.target.classList.toggle('on', D.sfx); };
    $('#pRes').onclick = () => { click(); closeModal(); Game.setPaused(false); };
    $('#pRe').onclick = () => { click(); closeModal(); startLevel(); };
    $('#pHome').onclick = () => { click(); showHome(); };
  }

  // ---------- home ----------
  const hc = $('#homeCat'), hdp = Math.min(devicePixelRatio || 1, 3); hc.width = 260 * hdp; hc.height = 190 * hdp; const hx = hc.getContext('2d'); hx.scale(hdp, hdp);
  function drawHome(t) { if (Tower.score(D.tower) > 0) { hx.clearRect(0, 0, 260, 190); hx.save(); hx.scale(260 / 300, 190 / 260); Tower.draw(hx, 300, 260, D.tower, t, [0, 3, 4, 6, 1, 7].map(l => ({ l, acc: outfitOf(l) }))); hx.restore(); return; }
    hx.clearRect(0, 0, 260, 190);
    for (let i = 0; i < 6; i++) { const ph = (t * .25 + i / 6) % 1; hx.globalAlpha = Math.sin(ph * Math.PI); hx.fillStyle = '#fff'; hx.strokeStyle = '#CDEFF8'; hx.lineWidth = 2; hx.beginPath(); hx.arc(30 + i * 40 + Math.sin(t + i) * 8, 110 - ph * 100, 5 + i % 3 * 4, 0, 7); hx.fill(); hx.stroke(); } hx.globalAlpha = 1;
    hx.fillStyle = '#BDEBF6'; hx.beginPath(); hx.ellipse(130, 118, 108, 20, 0, 0, 7); hx.fill();
    [[0, 62, 1], [3, 112, 0], [4, 162, 2], [6, 212, 3]].forEach(([l, x, k]) => { const up = Math.max(0, Math.sin(t * 1.6 + k * 1.3)) * 12; hx.save(); hx.translate(x, 116 - up); CatArt.drawCat(hx, l, 62, 2, { mood: (t * 1.3 + k) % 4 < .15 ? 'blink' : up > 9 ? 'happy' : 'idle', t, acc: outfitOf(l) || (k === 1 ? 'bubble' : k === 3 ? 'towel' : null) }); hx.restore(); });
    for (let i = 0; i < 12; i++) { hx.fillStyle = '#fff'; hx.strokeStyle = '#CDEFF8'; hx.lineWidth = 2; hx.beginPath(); hx.arc(30 + i * 18.2, 121 + Math.sin(i * 1.7 + t * 2) * 3, 10 + (i % 3) * 3, 0, 7); hx.fill(); hx.stroke(); }
    const g = hx.createLinearGradient(0, 124, 0, 184); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#FFE3EA'); hx.fillStyle = g; hx.strokeStyle = '#F4B6C6'; hx.lineWidth = 4;
    hx.beginPath(); hx.moveTo(16, 126); hx.lineTo(244, 126); hx.quadraticCurveTo(242, 180, 196, 182); hx.lineTo(64, 182); hx.quadraticCurveTo(18, 180, 16, 126); hx.closePath(); hx.fill(); hx.stroke();
    hx.fillStyle = '#FFC2D1'; for (let i = 0; i < 5; i++) { hx.beginPath(); hx.arc(80 + i * 25, 156, 3.5, 0, 7); hx.fill(); }
  }
  (function hl(n) { if (!$('#home').classList.contains('hidden')) drawHome(n / 1000); requestAnimationFrame(hl); })(0);
  function homeUI() {
    coinsUI(); const l = D.level, k = Game.tierOf(l), c = chapOf(l), C = CH[c % CH.length];
    $('#btnPlay').className = 'lvlbtn ' + (k === 'hard' || k === 'super' ? k : '');
    $('#btnPlay').innerHTML = `레벨 ${l}<small>${k === 'hard' ? '어려운 레벨 · 보상 ' + Game.TIER_REWARD.hard : k === 'super' ? '매우 어려운 레벨 · 보상 ' + Game.TIER_REWARD.super : l === 1 ? '탈출 작전 시작!' : '탭해서 시작'}</small>`;
    $('#homePic').src = C.pic; $('#chapTxt').textContent = `챕터 ${c + 1} · ${C.name}`; $('#picName').textContent = C.picName;
    const done = Math.max(0, Math.min(10, D.cleared - c * 10)); $('#pbar').style.width = done * 10 + '%'; $('#pieceTxt').textContent = `그림 조각 ${done} / 10`; $('#homePieces').innerHTML = piecesHTML(c, -1);
    $('#road').innerHTML = Array.from({ length: 7 }, (_, i) => { const n = l - 3 + i; if (n < 1) return ''; const t = Game.tierOf(n), st = D.stars[n] || 0; return `<span data-lv="${n}" class="${n === l ? 'cur' : n < l ? 'done' : t === 'hard' ? 'h' : t === 'super' ? 's' : ''}">${n}${n < l ? `<em>${'★'.repeat(st)}<u>${'★'.repeat(3 - st)}</u></em>` : ''}</span>`; }).join('');
    $$('#road [data-lv]').forEach(e => e.onclick = () => { const n = +e.dataset.lv; if (n >= D.level) return; click(); replay = n; startLevel(); });
    $('#streak').innerHTML = `<b>${titleOf(totalStars())}</b> · ★ ${totalStars()} · 연승 ${D.streak}`;
    const cs = chapStars(c); $('#chest').innerHTML = CHEST.map(([need], i) => `<span class="${D.chests[c + '_' + i] ? 'got' : cs >= need ? 'ready' : ''}">${need}</span>`).join('') + `<i style="width:${Math.min(100, cs / 30 * 100)}%"></i>`; $('#chestTxt').textContent = `챕터 별 ${cs}/30`;
    $('#achDot').classList.toggle('hidden', !achReady()); $('#towerDot').classList.toggle('hidden', !Tower.PARTS.some(p => (D.tower[p.id] || 0) < p.max && D.coins >= p.cost[D.tower[p.id] || 0]));
    $('#dailyDot').classList.toggle('hidden', !dailyReady()); $('#btnNoAds').classList.toggle('hidden', D.noAds);
  }
  $('#btnPlay').onclick = () => { click(); P.unlock(); startLevel(); };
  $('#btnPause').onclick = () => { click(); openPause(); };
  $('#btnShop').onclick = () => { click(); openShop(); }; $('#btnNoAds').onclick = () => { click(); openShop(); };
  $('#btnAlbum').onclick = () => { click(); openAlbum(); }; $('#albumCard').onclick = () => { click(); openAlbum(); };
  $('#btnDaily').onclick = () => { click(); openDaily(); }; $('#btnTower').onclick = () => { click(); openTower(); }; $('#btnAch').onclick = () => { click(); openAch(); }; $('#chestBar').onclick = () => { click(); openChest(); }; $('#btnCats').onclick = () => { click(); openCats(); }; $('#btnSet').onclick = () => { click(); openSettings(); };

  // ---------- Android lifecycle ----------
  let lastBack = 0;
  window.onAndroidBack = () => {
    if (Story.isOpen()) return true;
    if (modalOpen()) { if (S.state !== 'clear' && S.state !== 'fail') { closeModal(); if (S.state === 'play') Game.setPaused(false); } return true; }
    if (S.state === 'play') { openPause(); return true; }
    if (Date.now() - lastBack < 2000) return false; lastBack = Date.now(); toast('한 번 더 누르면 종료돼요'); return true;
  };
  window.onAppPause = () => { P.appPause(); if (S.state === 'play' && !modalOpen()) openPause(); };
  window.onAppResume = () => P.appResume();
  document.addEventListener('visibilitychange', () => document.hidden ? window.onAppPause() : window.onAppResume());

  Game.setPaused(true); homeUI(); P.music('bgm_home');
  window.App = { openTower, openAch, openChest, totalStars, openCats, catDetail, levelOf, refresh: homeUI, startLevel, showHome, openShop, openAlbum, openDaily, openSettings, chapterComplete, toast };
})();
