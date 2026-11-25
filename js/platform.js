/* 냥이 대탈출 - platform: save data, audio mixer, haptics, native bridge (ads / billing) */
(function () {
  'use strict';
  const KEY = 'nyang.save.v1';
  const DEF = { level: 1, cleared: 0, coins: 300, b: { hint: 2, shield: 2, lift: 1 }, streak: 0, noAds: false, starter: false, lastAd: 0,
    daily: { day: 0, last: '' }, seen: { prologue: false, chapters: [], tips: [] }, bgm: true, sfx: true, vib: true, stats: { plays: 0, fails: 0, conts: 0 }, bond: [0, 0, 0, 0, 0, 0, 0, 0] };
  let D;
  try { D = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { D = Object.assign({}, DEF); }
  D.b = Object.assign({}, DEF.b, D.b); D.seen = Object.assign({}, DEF.seen, D.seen); D.daily = Object.assign({}, DEF.daily, D.daily); D.stats = Object.assign({}, DEF.stats, D.stats); if (!Array.isArray(D.bond) || D.bond.length < 8) D.bond = DEF.bond.slice();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } };

  const NAMES = ['tap_go', 'exit', 'bump', 'grumble', 'steps', 'hint', 'lift', 'clear', 'star', 'fail', 'click', 'heart', 'purr', 'coin', 'follow', 'combo', 'nom', 'fever', 'pop', 'confetti', 'warn', 'page', 'piece', 'chapter', 'thanks', 'levelup', 'gift'];
  const AC = window.AudioContext || window.webkitAudioContext; let ac = null, master, sfxG, bgmG, BUF = {}, cur = null, curName = null, wanted = null;
  function initAudio() {
    if (ac || !AC) return; ac = new AC(); master = ac.createGain(); master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.connect(master); bgmG = ac.createGain(); bgmG.gain.value = .42; bgmG.connect(master);
    const load = n => fetch('audio/' + n + '.ogg').then(r => r.arrayBuffer()).then(a => new Promise((res, rej) => ac.decodeAudioData(a, res, rej))).then(b => { BUF[n] = b; if (n === wanted) music(wanted, true); }).catch(() => { });
    NAMES.concat(['bgm', 'bgm_home']).forEach(load);
  }
  function sfx(n, rate, vol) { if (window.__sfxlog) window.__sfxlog.push([n, rate || 1, vol == null ? 1 : vol, window.Game ? Game.S.time : 0]); if (!ac || !D.sfx || !BUF[n]) return; const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = BUF[n]; s.playbackRate.value = rate || 1; g.gain.value = vol == null ? 1 : vol; s.connect(g).connect(sfxG); s.start(); }
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
