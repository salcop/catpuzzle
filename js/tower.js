/* 냥이 대탈출 - 캣타워 (fish sink + achievement). Procedural, same pastel style as cats. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  // each part has levels 0(none)..max. cost[i] = price to reach level i+1
  const PARTS = [
    { id: 'base', name: '받침대', desc: '캣타워의 기초', max: 3, cost: [150, 400, 900], perk: '클리어 생선 +1/단계' },
    { id: 'post', name: '스크래처 기둥', desc: '높이 올라갈수록 멋져요', max: 4, cost: [250, 500, 900, 1500], perk: '타워 층 추가' },
    { id: 'bed', name: '꼭대기 침대', desc: '구름 방석 → 왕관 침대', max: 3, cost: [400, 900, 1800], perk: '레벨 시작 방석 확률 +10%/단계' },
    { id: 'house', name: '숨숨집', desc: '냥이들의 비밀 아지트', max: 3, cost: [500, 1100, 2000], perk: '호감도 +10%/단계' },
    { id: 'toy', name: '장난감', desc: '깃털·실뭉치·물고기 인형', max: 3, cost: [200, 450, 800], perk: '츄르 게이지 +10%/단계' },
    { id: 'deco', name: '장식', desc: '꽃·전구·무지개', max: 3, cost: [300, 700, 1300], perk: '홈 화면 반짝이' },
  ];
  function E(x, cx, cy, rx, ry, f) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); if (f) { x.fillStyle = f; x.fill(); } }
  function rr(x, X, Y, w, h, r, f, s, lw) { x.beginPath(); x.roundRect(X, Y, w, h, r); if (f) { x.fillStyle = f; x.fill(); } if (s) { x.strokeStyle = s; x.lineWidth = lw || 3; x.stroke(); } }
  function post(x, cx, top, bot, w, lvl) {
    const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, '#F1D3A9'); g.addColorStop(.5, '#FBE7C8'); g.addColorStop(1, '#E8C493');
    rr(x, cx - w / 2, top, w, bot - top, 6, g, '#D3A774', 2.5);
    x.strokeStyle = 'rgba(190,140,90,.45)'; x.lineWidth = 2; for (let y = top + 6; y < bot - 4; y += 7) { x.beginPath(); x.moveTo(cx - w / 2 + 2, y); x.lineTo(cx + w / 2 - 2, y + 3); x.stroke(); }
  }
  function shelf(x, cx, y, w, col, edge) { rr(x, cx - w / 2, y + 4, w, 14, 9, 'rgba(160,100,110,.15)'); rr(x, cx - w / 2, y, w, 14, 9, col, edge, 2.5); rr(x, cx - w / 2 + 6, y + 2, w * .4, 4, 2, 'rgba(255,255,255,.7)'); }
  const PAL = [['#FFD6E2', '#F2A9BD'], ['#D7EEFF', '#9CCBEB'], ['#E5DBFF', '#B9A4EE'], ['#FFF0C2', '#F0C96A']];
  /** draw tower into ctx area (w x h), t = time, L = {part:level}, cats: [lvl...] sitting on it */
  function draw(x, w, h, L, t, cats) {
    t = t || 0; L = L || {}; cats = cats || [];
    const cx = w / 2, ground = h - 18, floors = (L.post || 0) + 1, fh = Math.min(70, (h - 120) / Math.max(floors, 2.5));
    // rug
    E(x, cx, ground + 4, w * .42, 14, '#FFE3EA'); x.strokeStyle = '#FFC2D1'; x.setLineDash([3, 6]); x.lineWidth = 2.5; x.beginPath(); x.ellipse(cx, ground + 4, w * .38, 10, 0, 0, TAU); x.stroke(); x.setLineDash([]);
    if (!L.base) { // empty plot
      x.fillStyle = '#E3B9C6'; x.font = '900 14px "Noto Sans CJK KR",sans-serif'; x.textAlign = 'center'; x.fillText('받침대를 지어주세요', cx, ground - 30);
      for (let i = 0; i < 3; i++) { x.globalAlpha = .4 + .3 * Math.sin(t * 3 + i); CatArt.heart(x, cx - 30 + i * 30, ground - 60 + Math.sin(t * 2 + i) * 4, 8, '#FFC2D1'); } x.globalAlpha = 1; return [];
    }
    const pb = PAL[Math.min(L.base - 1, 3)];
    const baseW = 120 + L.base * 22; rr(x, cx - baseW / 2, ground - 26, baseW, 26, 12, pb[0], pb[1], 3);
    rr(x, cx - baseW / 2 + 8, ground - 22, baseW * .35, 5, 3, 'rgba(255,255,255,.7)');
    for (let i = 0; i < L.base; i++) { x.fillStyle = pb[1]; x.beginPath(); x.ellipse(cx - baseW / 2 + 22 + i * 22, ground - 11, 4, 3.4, 0, 0, TAU); x.fill(); for (const [dx, dy] of [[-4, -4], [0, -6], [4, -4]]) { x.beginPath(); x.arc(cx - baseW / 2 + 22 + i * 22 + dx, ground - 11 + dy, 1.6, 0, TAU); x.fill(); } }
    const seats = [];
    // posts & shelves zig-zag
    let y = ground - 26;
    for (let f = 0; f < floors - 1 + (L.post ? 1 : 0); f++) {
      const side = f % 2 ? 1 : -1, px = cx + side * 26, top = y - fh;
      post(x, px, top, y, 18, L.post);
      const sw = 92 - f * 4, sx = cx - side * 18; shelf(x, sx, top - 10, sw, PAL[f % 4][0], PAL[f % 4][1]);
      seats.push([sx - side * 14, top - 10]);
      y = top - 10;
    }
    // house
    if (L.house) {
      const hx = cx + 52, hy = ground - 26, hw = 54 + L.house * 6, hh = 44 + L.house * 4, col = ['#FFE7B8', '#FFD6E2', '#D9F0E3'][L.house - 1];
      rr(x, hx - hw / 2, hy - hh, hw, hh, 12, col, '#E0B28A', 2.5);
      x.fillStyle = ['#F6B58E', '#F49AB2', '#9FD6B6'][L.house - 1]; x.beginPath(); x.moveTo(hx - hw / 2 - 6, hy - hh + 4); x.quadraticCurveTo(hx, hy - hh - 26 - L.house * 3, hx + hw / 2 + 6, hy - hh + 4); x.closePath(); x.fill();
      E(x, hx, hy - hh * .42, hw * .22, hh * .3, '#6E4E5B'); E(x, hx - 3, hy - hh * .5, 3, 3, '#FFE38A'); E(x, hx + 5, hy - hh * .5, 3, 3, '#FFE38A');
      if (L.house >= 2) { x.fillStyle = '#FF9CB5'; CatArt.heart(x, hx, hy - hh - 6, 6, '#FF7F95'); }
      if (L.house >= 3) for (let i = 0; i < 4; i++) { x.globalAlpha = .6 + .4 * Math.sin(t * 4 + i); x.fillStyle = '#FFE38A'; x.beginPath(); x.arc(hx - hw / 2 + 8 + i * (hw - 16) / 3, hy - hh + 2, 3, 0, TAU); x.fill(); } x.globalAlpha = 1;
    }
    // top bed
    if (L.bed) {
      const by = y, bw = 70 + L.bed * 8;
      const col = ['#E9F6FF', '#FFE7F0', '#FFF4CC'][L.bed - 1], ed = ['#A9D8F2', '#F4B6C6', '#F0C96A'][L.bed - 1];
      E(x, cx, by - 4, bw / 2, 16, col); x.lineWidth = 3; x.strokeStyle = ed; x.stroke();
      E(x, cx, by - 10, bw / 2 - 8, 9, '#FFFFFF');
      if (L.bed === 1) for (const [dx, r] of [[-26, 10], [-10, 13], [10, 12], [26, 9]]) E(x, cx + dx, by - 18, r, r * .7, 'rgba(255,255,255,.95)');
      if (L.bed >= 3) { x.save(); x.translate(cx, by - 48 + Math.sin(t * 2) * 2); const w2 = 18; x.beginPath(); x.moveTo(-w2, 0); x.lineTo(-w2, -12); x.lineTo(-w2 / 2, -5); x.lineTo(0, -16); x.lineTo(w2 / 2, -5); x.lineTo(w2, -12); x.lineTo(w2, 0); x.closePath(); x.fillStyle = '#FFD84A'; x.fill(); x.strokeStyle = '#D79A12'; x.lineWidth = 2; x.stroke(); x.restore(); }
      seats.push([cx, by - 14]);
    }
    // toys
    if (L.toy) {
      const tx = cx - 70, ty = ground - 34 - (L.post ? fh * .3 : 0);
      x.strokeStyle = '#C9A8D9'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(tx, ty - 40); x.quadraticCurveTo(tx + Math.sin(t * 2) * 6, ty - 20, tx + Math.sin(t * 2.4) * 8, ty); x.stroke();
      const sw = Math.sin(t * 2.4) * 8;
      if (L.toy >= 1) { x.fillStyle = '#FF9CB5'; for (let i = 0; i < 3; i++) { x.save(); x.translate(tx + sw, ty); x.rotate(-.6 + i * .6); E(x, 0, 8, 3.5, 10, ['#FF9CB5', '#9FD6F0', '#FFE38A'][i]); x.restore(); } }
      if (L.toy >= 2) { E(x, cx - 50, ground - 8, 9, 9, '#C9A8F0'); x.strokeStyle = '#A88AD6'; x.lineWidth = 1.5; x.beginPath(); x.arc(cx - 50, ground - 8, 6, 0, 4); x.stroke(); }
      if (L.toy >= 3) { x.save(); x.translate(cx + 96, ground - 8); x.fillStyle = '#8FD0EA'; x.beginPath(); x.moveTo(-12, 0); x.quadraticCurveTo(-2, -9, 8, 0); x.quadraticCurveTo(-2, 9, -12, 0); x.fill(); x.beginPath(); x.moveTo(8, 0); x.lineTo(14, -6); x.lineTo(14, 6); x.fill(); x.restore(); }
    }
    // deco
    if (L.deco) {
      if (L.deco >= 1) for (const s of [-1, 1]) { const fx = cx + s * (baseW / 2 + 12); x.strokeStyle = '#9FD6B6'; x.lineWidth = 3; x.beginPath(); x.moveTo(fx, ground); x.lineTo(fx, ground - 24); x.stroke(); for (let p = 0; p < 5; p++) { const a = p * TAU / 5 + t * .3; E(x, fx + Math.cos(a) * 6, ground - 28 + Math.sin(a) * 6, 4.5, 4.5, '#FFB3C7'); } E(x, fx, ground - 28, 3.5, 3.5, '#FFE38A'); }
      if (L.deco >= 2) { const n = 9; for (let i = 0; i < n; i++) { const a = i / (n - 1), lx = cx - 100 + a * 200, ly = 40 + Math.sin(a * Math.PI) * 26; x.globalAlpha = .55 + .45 * Math.sin(t * 3 + i); E(x, lx, ly, 4, 4, ['#FFE38A', '#FFB3C7', '#B9E6C9', '#C9B8EE'][i % 4]); } x.globalAlpha = 1; x.strokeStyle = '#E8C9D2'; x.lineWidth = 1.2; x.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20; x.lineTo(cx - 100 + a * 200, 40 + Math.sin(a * Math.PI) * 26); } x.stroke(); }
      if (L.deco >= 3) { x.globalAlpha = .35; ['#FFB3C7', '#FFE38A', '#B9E6C9', '#A9D8F2', '#C9B8EE'].forEach((c, i) => { x.strokeStyle = c; x.lineWidth = 5; x.beginPath(); x.arc(cx, ground + 20, 150 - i * 6, Math.PI * 1.08, Math.PI * 1.92); x.stroke(); }); x.globalAlpha = 1; }
    }
    // cats sitting on seats (+ one on base)
    seats.unshift([cx - 30, ground - 26]);
    cats.slice(0, seats.length).forEach((lvl, i) => { const [sx, sy] = seats[i]; x.save(); x.translate(sx, sy - 2 + Math.sin(t * 2 + i) * 1.5); CatArt.drawCat(x, lvl.l, 48, 2, { mood: (t * 1.2 + i) % 4 < .15 ? 'blink' : 'idle', t: t + i, acc: lvl.acc }); x.restore(); });
    return seats;
  }
  function score(L) { return PARTS.reduce((a, p) => a + (L[p.id] || 0), 0); }
  function maxScore() { return PARTS.reduce((a, p) => a + p.max, 0); }
  const RANKS = [[0, '빈 마당'], [1, '아담한 쉼터'], [4, '포근한 캣타워'], [8, '멋진 캣타워'], [13, '냥이 궁전'], [19, '전설의 캣캐슬']];
  const rank = L => { const s = score(L); let r = RANKS[0][1]; RANKS.forEach(([v, n]) => { if (s >= v) r = n; }); return r; };
  window.Tower = { PARTS, draw, score, maxScore, rank };
})();
