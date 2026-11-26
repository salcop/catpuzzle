/* 냥이 대탈출 - 몽글몽글 연출 레이어 (v1.4)
   - 화면 어디를 눌러도 발바닥·하트·별이 퐁 피어남
   - 홈 화면: 떠다니는 비눗방울·하트, 캣타워/욕조 냥이 탭 → 말풍선 + 울음 + 하트
   - 로고 탭하면 말랑 점프, 버튼 누르면 젤리처럼 출렁
   - 캣타워 구매/보상 받기 등 좋은 일에는 DOM 꽃가루                                   */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const P = window.Platform, D = P && P.D;
  const layer = document.createElement('div'); layer.id = 'cuteLayer'; document.body.appendChild(layer);
  const COLORS = ['#FF9CB5', '#FFD457', '#9FE0C8', '#8FC4F0', '#C9A8F0', '#FFB38A'];
  const SVG = {
    paw: c => `<svg viewBox="0 0 20 20"><ellipse cx="10" cy="13" rx="5" ry="4.2" fill="${c}"/><circle cx="4.6" cy="8" r="2" fill="${c}"/><circle cx="8" cy="5" r="2" fill="${c}"/><circle cx="12" cy="5" r="2" fill="${c}"/><circle cx="15.4" cy="8" r="2" fill="${c}"/></svg>`,
    heart: c => `<svg viewBox="0 0 20 20"><path d="M10 17C3.5 12.5 2 9.5 2 7a4 4 0 0 1 8-1.6A4 4 0 0 1 18 7c0 2.5-1.5 5.5-8 10z" fill="${c}"/></svg>`,
    star: c => `<svg viewBox="0 0 20 20"><path d="M10 1.5l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.5l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7z" fill="${c}"/></svg>`,
    bubble: () => `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5" fill="rgba(255,255,255,.85)" stroke="#BFE7F4" stroke-width="1.5"/><circle cx="7" cy="7" r="2.2" fill="#fff"/></svg>`,
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function sprinkle(x, y, n, kinds, spread) {
    for (let i = 0; i < n; i++) {
      const e = document.createElement('i'), k = pick(kinds), s = 12 + Math.random() * 12, a = Math.random() * Math.PI * 2, d = (spread || 36) * (.5 + Math.random() * .7);
      e.className = 'cfx'; e.innerHTML = SVG[k](pick(COLORS));
      e.style.cssText = `left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 18}px;--r:${(Math.random() - .5) * 90}deg;animation-delay:${i * 18}ms`;
      layer.appendChild(e); setTimeout(() => e.remove(), 1000 + i * 18);
    }
  }
  // 1) 어디를 눌러도 발바닥 퐁 (게임 판 위는 게임 자체 효과가 있으므로 작게)
  document.addEventListener('pointerdown', e => {
    const onBoard = e.target && e.target.id === 'game';
    sprinkle(e.clientX, e.clientY, onBoard ? 1 : 3, onBoard ? ['paw'] : ['paw', 'heart', 'star'], onBoard ? 18 : 34);
    const b = e.target.closest && e.target.closest('button, .mochi, .lvlbtn');
    if (b) { b.classList.remove('jelly'); void b.offsetWidth; b.classList.add('jelly'); }
  }, { passive: true, capture: true });

  // 2) 홈 배경에 떠다니는 비눗방울·하트
  const home = $('#home');
  if (home) {
    const amb = document.createElement('div'); amb.className = 'ambient'; home.prepend(amb);
    for (let i = 0; i < 14; i++) {
      const e = document.createElement('i'), k = i % 3 === 0 ? 'heart' : 'bubble', s = 10 + Math.random() * 20;
      e.innerHTML = SVG[k](pick(['#FFD3DF', '#FFE6B8', '#D9F2E6', '#DCEBFF'])); e.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${9 + Math.random() * 9}s;animation-delay:${-Math.random() * 18}s;opacity:${k === 'heart' ? .55 : .8}`;
      amb.appendChild(e);
    }
  }
  // 3) 로고 탭 → 말랑 점프 + 냥
  const logo = $('.logo');
  if (logo) logo.addEventListener('click', () => { logo.classList.remove('boing'); void logo.offsetWidth; logo.classList.add('boing'); P && P.sfx('tap_go', 1.1 + Math.random() * .2, .8); });

  // 4) 홈 캣타워 / 욕조 냥이 쓰다듬기
  const LINES = ['냥~♪', '쓰담쓰담 좋아!', '골골골…', '오늘도 놀자냥!', '간식 줘냥!', '헤헤', '심심하다냥', '집사 최고!', '꾹꾹이~', '졸려…'];
  const hc = $('#homeCat');
  if (hc) {
    const bub = document.createElement('div'); bub.className = 'homebub hidden'; hc.parentNode.insertBefore(bub, hc.nextSibling);
    let t0 = 0, pets = 0;
    hc.addEventListener('pointerdown', e => {
      const r = hc.getBoundingClientRect(), now = performance.now(); if (now - t0 < 250) return; t0 = now; pets++;
      const line = pets % 7 === 0 ? '쓰다듬어줘서 고마워! 🐟+1' : pick(LINES);
      if (pets % 7 === 0 && D) { D.coins += 1; P.save(); document.querySelectorAll('.coinTxt').forEach(c => c.textContent = D.coins.toLocaleString()); }
      bub.textContent = line; bub.style.left = (e.clientX - r.left + hc.offsetLeft) + 'px'; bub.style.top = (e.clientY - r.top + hc.offsetTop - 34) + 'px';
      bub.classList.remove('hidden', 'pop'); void bub.offsetWidth; bub.classList.add('pop');
      clearTimeout(bub._t); bub._t = setTimeout(() => bub.classList.add('hidden'), 1300);
      sprinkle(e.clientX, e.clientY - 10, 5, ['heart', 'heart', 'paw'], 40);
      if (P) { P.sfx(line.includes('골골') ? 'purr' : 'meow_pet', .95 + Math.random() * .2, .8); P.vibrate(10); }
    });
  }
  // 5) 좋은 일 축하 (캣타워 구매·보상 수령 등): 모달 카드에서 터지는 DOM 꽃가루
  function celebrate(el) {
    const r = (el || document.body).getBoundingClientRect();
    for (let i = 0; i < 26; i++) setTimeout(() => sprinkle(r.left + Math.random() * r.width, r.top + Math.random() * r.height * .5, 1, ['heart', 'star', 'paw'], 70), i * 22);
  }
  // hook: whenever a 'build' / 'coin' / 'levelup' / 'piece' sound plays, sprinkle around the open card
  if (P && P.sfx) {
    const orig = P.sfx;
    P.sfx = function (n, ...a) { if (['build', 'levelup', 'chapter', 'gift'].includes(n)) { const c = $('#modal:not(.hidden) .card'); celebrate(c); } return orig.call(this, n, ...a); };
    if (window.Game) Game.on('sfx', P.sfx);
  }
  window.Cute = { sprinkle, celebrate };
})();
