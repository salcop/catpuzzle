/* 냥이 대탈출 - platform: save data, audio mixer, haptics, native bridge (ads / billing) */
(function () {
  'use strict';
  const KEY = 'nyang.save.v1';
  const DEF = { level: 1, cleared: 0, coins: 100, b: { hint: 2, shield: 2, lift: 1 }, streak: 0, noAds: false, starter: false, lastAd: 0,
    daily: { day: 0, last: '' }, seen: { prologue: false, chapters: [], tips: [] }, bgm: true, sfx: true, vib: true, stats: { plays: 0, fails: 0, conts: 0 }, bond: [0, 0, 0, 0, 0, 0, 0, 0], stars: {}, ach: {}, chests: {}, tower: {}, towerSel: 0, wardrobe: [], tAdd: 0, ver: 3, totals: { cats: 0, perfect: 0, hard: 0, combo: 0, fish: 0 } };
  let D;
  try { D = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { D = Object.assign({}, DEF); }
  D.b = Object.assign({}, DEF.b, D.b); D.seen = Object.assign({}, DEF.seen, D.seen); D.daily = Object.assign({}, DEF.daily, D.daily); D.stats = Object.assign({}, DEF.stats, D.stats); if (!Array.isArray(D.bond) || D.bond.length < 8) D.bond = DEF.bond.slice();
  ['stars', 'ach', 'chests', 'tower'].forEach(k => D[k] = D[k] || {}); D.wardrobe = D.wardrobe || []; D.totals = Object.assign({}, DEF.totals, D.totals); D.tAdd = D.tAdd || 0;
  if ((D.ver || 1) < 3) { // v1.3 migration: rebalance inflated economy from older versions
    D.coins = Math.min(D.coins, 800); D.streak = Math.min(D.streak, 2); D.bond = D.bond.map(v => Math.round(v * .45)); D.ver = 3; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } };

  const NAMES = ['tap_go', 'exit', 'bump', 'grumble', 'steps', 'hint', 'lift', 'clear', 'star', 'fail', 'click', 'heart', 'purr', 'coin', 'follow', 'combo', 'nom', 'fever', 'pop', 'confetti', 'warn', 'page', 'piece', 'chapter', 'thanks', 'levelup', 'gift', 'note', 'tok', 'tick', 'chest', 'build',
    'coin_big', 'buy', 'equip', 'unlock', 'whoosh', 'perfect', 'sparkle', 'lvl_tap', 'meow_pet', 'bubble'];
  // variations: name -> count (game picks one at random, never the same twice in a row)
  const VARS = { tap_go: 4, exit: 4, follow: 3, bump: 3, grumble: 3, nom: 2, lift: 2, combo: 3, thanks: 3, meow_pet: 4, star: 3, bubble: 3 };
  const AC = window.AudioContext || window.webkitAudioContext; let ac = null, master, comp, sfxG, voxG, bgmG, BUF = {}, cur = null, curName = null, wanted = null;
  function initAudio() {
    if (ac || !AC) return; ac = new AC();
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = .004; comp.release.value = .18;
    master = ac.createGain(); master.gain.value = .95; comp.connect(master); master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.connect(comp); voxG = ac.createGain(); voxG.gain.value = 1.05; voxG.connect(comp);
    bgmG = ac.createGain(); bgmG.gain.value = .38; bgmG.connect(comp);
    const load = n => fetch('audio/' + n + '.ogg').then(r => r.arrayBuffer()).then(a => new Promise((res, rej) => ac.decodeAudioData(a, res, rej))).then(b => { BUF[n] = b; if (n === wanted) music(wanted, true); }).catch(() => { });
    NAMES.concat(['bgm', 'bgm_home']).forEach(load);
    Object.entries(VARS).forEach(([n, k]) => { for (let i = 1; i <= k; i++) load(n + '_' + i); });
  }
  const lastPlay = {}, lastVar = {}, VOICES = ['tap_go', 'exit', 'follow', 'bump', 'grumble', 'nom', 'lift', 'combo', 'thanks', 'meow_pet']; let voiceN = 0;
  function duck() { if (!bgmG) return; const t = ac.currentTime; bgmG.gain.cancelScheduledValues(t); bgmG.gain.setTargetAtTime(.22, t, .03); bgmG.gain.setTargetAtTime(.38, t + .35, .25); }
  function sfx(n, rate, vol) {
    const now = performance.now(); if (lastPlay[n] && now - lastPlay[n] < (n === 'note' ? 55 : n === 'tick' ? 30 : 80)) return; lastPlay[n] = now;
    const isVox = VOICES.includes(n);
    if (isVox) { if (voiceN >= 2) return; voiceN++; setTimeout(() => voiceN--, 380); }
    if (window.__sfxlog) window.__sfxlog.push([n, rate || 1, vol == null ? 1 : vol, window.Game ? Game.S.time : 0]);
    if (!ac || !D.sfx) return;
    let key = n;
    if (VARS[n]) { let i; do { i = 1 + Math.floor(Math.random() * VARS[n]); } while (VARS[n] > 1 && i === lastVar[n]); lastVar[n] = i; if (BUF[n + '_' + i]) key = n + '_' + i; }
    if (!BUF[key]) return;
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = BUF[key];
    s.playbackRate.value = (rate || 1) * (isVox ? 1 : 1 + (Math.random() - .5) * .03); g.gain.value = vol == null ? 1 : vol;
    let node = s.connect(g);
    if (ac.createStereoPanner && isVox) { const p = ac.createStereoPanner(); p.pan.value = (Math.random() - .5) * .35; node = g.connect(p); node.connect(voxG); duck(); }
    else g.connect(isVox ? voxG : sfxG);
    s.start();
  }
  function music(name, force) {
    wanted = name; if (!ac || (!force && curName === name)) return;
    if (cur) { const old = cur; old._g.gain.setTargetAtTime(0, ac.currentTime, .3); setTimeout(() => { try { old.stop(); } catch (e) { } }, 1200); cur = null; curName = null; }
    if (!D.bgm || !BUF[name]) return;
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = BUF[name]; s.loop = true; g.gain.value = 0; g.gain.setTargetAtTime(1, ac.currentTime, .5); s.connect(g).connect(bgmG); s.start(); s._g = g; cur = s; curName = name;
  }
  function setBgm(on) { D.bgm = on; save(); if (on) music(wanted, true); else if (cur) { try { cur.stop(); } catch (e) { } cur = null; curName = null; } }
  function unlock() { initAudio(); if (ac && ac.state === 'suspended') ac.resume(); }
  document.addEventListener('pointerdown', unlock, { passive: true });
  function appPause() { if (ac && ac.state === 'running') ac.suspend(); }
  function appResume() { if (ac) ac.resume(); }

  const NB = window.AndroidBridge || null, pending = {};
  window.__adResult = (tag, ok) => { const cb = pending[tag]; delete pending[tag]; appResume(); cb && cb(!!ok); };
  window.__purchaseResult = (sku, ok) => { const cb = pending['iap_' + sku]; delete pending['iap_' + sku]; cb && cb(!!ok); };
  window.__restored = skus => { (skus || '').split(',').forEach(s => { if (s === 'no_ads') D.noAds = true; if (s === 'starter_pack') D.starter = true; }); save(); window.App && App.refresh(); };
  function rewarded(tag, cb) {
    pending[tag] = cb; appPause();
    if (NB && NB.showRewarded) NB.showRewarded(tag);
    else { const o = document.createElement('div'); o.className = 'fake-ad'; o.innerHTML = '<div>광고 미리보기<br><small>보상형 · 1초</small></div>'; document.body.appendChild(o); setTimeout(() => { o.remove(); window.__adResult(tag, true); }, 1000); }
  }
  function interstitial() { // genre-standard pacing: after a WIN only, from level 8, >=120s apart, never if noAds
    if (D.noAds || D.level < 8 || Date.now() - D.lastAd < 120000) return;
    D.lastAd = Date.now(); save(); if (NB && NB.showInterstitial) { appPause(); NB.showInterstitial(); }
  }
  window.__interstitialClosed = appResume;
  function purchase(sku, cb) { pending['iap_' + sku] = cb; if (NB && NB.purchase) NB.purchase(sku); else setTimeout(() => window.__purchaseResult(sku, confirm('[미리보기] 구매 완료로 처리할까요? (' + sku + ')')), 50); }
  function vibrate(ms) { if (!D.vib) return; if (NB && NB.vibrate) NB.vibrate(ms | 0); else if (navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }
  function log(ev, v) { if (NB && NB.logEvent) try { NB.logEvent(ev, String(v ?? '')); } catch (e) { } }
  const privacyRequired = () => !!(NB && NB.isPrivacyOptionsRequired && String(NB.isPrivacyOptionsRequired()) === 'true');
  window.Platform = { D, save, sfx, music, setBgm, unlock, appPause, appResume, rewarded, interstitial, purchase, vibrate, log, privacyRequired,
    privacyOptions: () => NB && NB.showPrivacyOptions && NB.showPrivacyOptions(), restore: () => NB && NB.restorePurchases && NB.restorePurchases(),
    openUrl: u => NB && NB.openUrl ? NB.openUrl(u) : window.open(u, '_blank'), native: !!NB };
})();
