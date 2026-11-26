/* 냥이 대탈출 - chibi cat art (4 views, 5 moods, accessories). All original, procedural vector. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const CATS = [
    { name: '치즈', body: '#FFCF8A', belly: '#FFF4E2', pat: 'stripes', stripe: '#F3A85A', eye: '#4A3A35' },
    { name: '구름', body: '#FFFFFF', belly: '#FFFFFF', pat: 'none', eye: '#6C9BE0', line: '#D9CBC6' },
    { name: '고등어', body: '#C9C2B8', belly: '#F4EFE8', pat: 'stripes', stripe: '#958C82', eye: '#4A3A35' },
    { name: '삼색이', body: '#FFFDF8', belly: '#FFFDF8', pat: 'calico', eye: '#4A3A35' },
    { name: '턱시도', body: '#57505F', belly: '#FFFFFF', pat: 'tux', eye: '#A6D86B' },
    { name: '하늘', body: '#AEBBD2', belly: '#C9D3E4', pat: 'none', eye: '#86D07E' },
    { name: '샴', body: '#F8EEDF', belly: '#FFF8EE', pat: 'mask', eye: '#5DAEF0' },
    { name: '까망', body: '#4A4553', belly: '#4A4553', pat: 'none', eye: '#F5CF4A' },
  ];
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = c => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)); r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  const dark = C => C.body === '#57505F' || C.body === '#4A4553';
  const lineOf = C => C.line || shade(C.body, -.32);
  function E(x, cx, cy, rx, ry, fill, rot) { x.beginPath(); x.ellipse(cx, cy, Math.max(rx, .01), Math.max(ry, .01), rot || 0, 0, TAU); if (fill) { x.fillStyle = fill; x.fill(); } }
  function heart(x, cx, cy, s, col) { x.save(); x.translate(cx, cy); x.beginPath(); x.moveTo(0, s * .35); x.bezierCurveTo(-s * 1.1, -s * .4, -s * .4, -s * 1.1, 0, -s * .45); x.bezierCurveTo(s * .4, -s * 1.1, s * 1.1, -s * .4, 0, s * .35); x.fillStyle = col; x.fill(); x.restore(); }
  function ears(x, C, r, lw, back) {
    for (const s of [-1, 1]) {
      x.save(); x.scale(s, 1);
      const col = C.pat === 'mask' ? '#B39077' : C.pat === 'calico' ? (s < 0 ? '#F6B068' : '#5A5260') : C.body;
      x.beginPath(); x.moveTo(r * .28, -r * .62); x.quadraticCurveTo(r * .42, -r * 1.12, r * .66, -r * 1.08); x.quadraticCurveTo(r * .86, -r * .9, r * .9, -r * .38); x.closePath();
      x.fillStyle = col; x.fill(); x.lineWidth = lw; x.strokeStyle = lineOf(C); x.lineJoin = 'round'; x.stroke();
      if (!back) { x.beginPath(); x.moveTo(r * .42, -r * .66); x.quadraticCurveTo(r * .52, -r * .98, r * .64, -r * .96); x.quadraticCurveTo(r * .76, -r * .82, r * .78, -r * .52); x.closePath(); x.fillStyle = dark(C) ? '#8E6B7E' : '#FFC6D3'; x.fill(); }
      x.restore();
    }
  }
  function headShape(x, r) { x.beginPath(); x.ellipse(0, 0, r, r * .84, 0, 0, TAU); }
  function headFill(x, C, r, lw, back) {
    const g = x.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r * 1.1);
    g.addColorStop(0, shade(C.body, .25)); g.addColorStop(.7, C.body); g.addColorStop(1, shade(C.body, -.06));
    headShape(x, r); x.fillStyle = g; x.fill();
    x.save(); headShape(x, r - lw * .4); x.clip();
    if (C.pat === 'calico') { E(x, -r * .62, -r * .5, r * .5, r * .4, '#F6B068', .4); E(x, r * .7, -r * .45, r * .42, r * .36, '#5A5260', -.3); }
    if (C.pat === 'mask' && !back) E(x, 0, r * .28, r * .48, r * .38, 'rgba(160,120,95,.55)');
    if (C.pat === 'mask' && back) E(x, 0, -r * .1, r * .9, r * .7, 'rgba(160,120,95,.25)');
    if (C.pat === 'tux' && !back) { x.beginPath(); x.moveTo(-r * .55, r); x.quadraticCurveTo(-r * .35, r * .05, 0, r * .12); x.quadraticCurveTo(r * .35, r * .05, r * .55, r); x.closePath(); x.fillStyle = '#FFFFFF'; x.fill(); }
    if (C.pat === 'stripes') { x.strokeStyle = C.stripe; x.lineCap = 'round'; x.lineWidth = r * .1; for (const k of [-1, 0, 1]) { x.beginPath(); x.moveTo(k * r * .18, -r * .86); x.lineTo(k * r * .14, -r * (back ? .3 : .56)); x.stroke(); } if (back) for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * r * .95, -r * .1); x.lineTo(s * r * .6, -r * .05); x.stroke(); } }
    x.restore();
    headShape(x, r); x.lineWidth = lw; x.strokeStyle = lineOf(C); x.stroke();
    E(x, -r * .42, -r * .5, r * .16, r * .09, 'rgba(255,255,255,.55)', -.5);
  }
  function face(x, C, r, mood, off) {
    const dk = dark(C), ink = dk ? '#FBEFE6' : '#4A3A35', ox = off * r * .24;
    const ey = r * .08, ex = r * .36, es = r * .17;
    for (const s of [-1, 1]) {
      const far = off !== 0 && Math.sign(off) !== s, sc = far ? .85 : 1, cx = ox + s * ex * (far ? .86 : 1) + off * r * .04 * s;
      x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = ink; x.lineWidth = Math.max(1.3, r * .075);
      if (mood === 'blink' || mood === 'sleep') { x.beginPath(); x.arc(cx, ey - es * .1, es * .8 * sc, .12 * Math.PI, .88 * Math.PI); x.stroke(); continue; }
      if (mood === 'happy') { x.beginPath(); x.arc(cx, ey + es * .5, es * .75 * sc, 1.12 * Math.PI, 1.88 * Math.PI); x.stroke(); continue; }
      if (mood === 'bump') { x.beginPath(); const w = es * .7 * sc; x.moveTo(cx - w * s, ey - w); x.lineTo(cx + w * .6 * s, ey); x.lineTo(cx - w * s, ey + w); x.stroke(); continue; }
      E(x, cx, ey, es * .86 * sc, es * sc, ink);
      if (C.eye && C.eye !== '#4A3A35') { E(x, cx, ey + es * .25 * sc, es * .7 * sc, es * .62 * sc, C.eye); E(x, cx, ey + es * .15 * sc, es * .45 * sc, es * .55 * sc, dk ? '#1E1A22' : ink); }
      E(x, cx - es * .3 * sc + off * es * .2, ey - es * .38 * sc, es * .34 * sc, es * .34 * sc, '#FFFFFF');
      E(x, cx + es * .3 * sc + off * es * .2, ey + es * .36 * sc, es * .15 * sc, es * .15 * sc, 'rgba(255,255,255,.9)');
    }
    for (const s of [-1, 1]) { const far = off !== 0 && Math.sign(off) !== s; E(x, ox + s * r * (far ? .5 : .6), r * .34, r * .15 * (far ? .8 : 1), r * .09, dk ? 'rgba(255,150,180,.45)' : 'rgba(255,130,150,.5)'); }
    const nx = ox + off * r * .06, ny = r * .27;
    x.beginPath(); x.moveTo(nx - r * .06, ny - r * .02); x.lineTo(nx + r * .06, ny - r * .02); x.lineTo(nx, ny + r * .045); x.closePath(); x.fillStyle = '#FF9AA8'; x.fill();
    x.strokeStyle = ink; x.lineWidth = Math.max(1, r * .05); x.lineCap = 'round';
    if (mood === 'happy') { x.beginPath(); x.moveTo(nx - r * .1, ny + r * .08); x.quadraticCurveTo(nx, ny + r * .26, nx + r * .1, ny + r * .08); x.closePath(); x.fillStyle = '#FF7F95'; x.fill(); x.stroke(); }
    else if (mood === 'bump') { E(x, nx, ny + r * .14, r * .055, r * .07, null); x.fillStyle = '#FF7F95'; x.fill(); x.stroke(); }
    else { const w = r * .075, yy = ny + r * .06; x.beginPath(); x.arc(nx - w, yy, w, .1 * Math.PI, .9 * Math.PI); x.moveTo(nx + w * 2, yy); x.arc(nx + w, yy, w, .1 * Math.PI, .9 * Math.PI); x.stroke(); }
  }
  function tail(x, C, r, lw, dir, t) {
    const wag = Math.sin(t * 5) * .25; let path;
    x.save(); x.lineCap = 'round';
    if (dir === 2) path = [[r * .55, r * 1.35], [r * 1.15, r * 1.3], [r * 1.25, r * .75 + wag * r]];
    else if (dir === 0) path = [[r * .2, r * 1.3], [r * .95, r * 1.35], [r * .9 + wag * r * .4, r * .7]];
    else { const d = dir === 1 ? -1 : 1; path = [[d * r * .75, r * 1.2], [d * r * 1.35, r * 1.0], [d * r * 1.25 + wag * r * d * .5, r * .35]]; }
    x.beginPath(); x.moveTo(...path[0]); x.quadraticCurveTo(...path[1], ...path[2]);
    x.lineWidth = r * .3; x.strokeStyle = lineOf(C); x.stroke(); x.lineWidth = r * .3 - lw * 2; x.strokeStyle = C.pat === 'calico' ? '#F6B068' : C.pat === 'mask' ? '#B39077' : C.body; x.stroke();
    x.restore();
  }
  function bodyPart(x, C, r, lw, dir, walk) {
    const st = Math.sin(walk * 16), bx = dir === 1 ? -r * .22 : dir === 3 ? r * .22 : 0;
    const g = x.createLinearGradient(0, r * .6, 0, r * 1.5); g.addColorStop(0, shade(C.body, .12)); g.addColorStop(1, shade(C.body, -.05));
    E(x, bx, r * 1.05, r * (dir % 2 ? .82 : .66), r * .48, null); x.fillStyle = g; x.fill(); x.lineWidth = lw; x.strokeStyle = lineOf(C); x.stroke();
    if (C.pat === 'tux' || (dir === 2 && !dark(C))) { x.save(); E(x, bx, r * 1.05, r * .64, r * .46, null); x.clip(); E(x, bx + (dir === 1 ? r * .3 : dir === 3 ? -r * .3 : 0), r * 1.2, r * .32, r * .3, C.pat === 'tux' ? '#FFFFFF' : C.belly); x.restore(); }
    if (C.pat === 'calico' && dir !== 2) { x.save(); E(x, bx, r * 1.05, r * .64, r * .46, null); x.clip(); E(x, bx - r * .3, r * .95, r * .28, r * .22, '#F6B068'); E(x, bx + r * .35, r * 1.12, r * .22, r * .18, '#5A5260'); x.restore(); }
    const pc = C.pat === 'tux' ? '#FFFFFF' : shade(C.body, .1);
    const paws = dir === 2 ? [[-r * .24, r * 1.42, 0], [r * .24, r * 1.42, 0]] : dir === 0 ? [[-r * .3, r * 1.45, 1], [r * .3, r * 1.45, -1]] :
      (() => { const d = dir === 1 ? 1 : -1; return [[d * r * .38, r * 1.42, 1], [d * r * .08, r * 1.45, -1], [-d * r * .5, r * 1.42, -1]]; })();
    for (const [px, py, ph] of paws) { E(x, px + (walk ? ph * st * r * .1 : 0), py - (walk && ph * st > 0 ? r * .06 : 0), r * .15, r * .11, pc); x.lineWidth = lw * .8; x.strokeStyle = lineOf(C); x.stroke(); if (dir === 0) E(x, px, py + r * .02, r * .05, r * .04, '#FFB3C2'); }
  }
  function drawCat(x, lvl, size, dir, opt) {
    opt = opt || {}; const C = CATS[lvl % CATS.length], r = size * .3, lw = Math.max(1.2, r * .085), mood = opt.mood || 'idle', t = opt.t || 0;
    x.save(); x.translate(0, -r * .38);
    E(x, 0, r * 1.5, r * .8, r * .16, 'rgba(90,120,140,.18)');
    const back = dir === 0, off = dir === 1 ? 1 : dir === 3 ? -1 : 0;
    if (!back) tail(x, C, r, lw, dir, t);
    bodyPart(x, C, r, lw, dir, opt.walk || 0);
    if (back) tail(x, C, r, lw, dir, t);
    if (opt.acc === 'scarf') { x.save(); x.fillStyle = '#FF9CB5'; x.strokeStyle = '#E3728F'; x.lineWidth = lw * .7;
      x.beginPath(); x.ellipse(0, r * .72, r * .62, r * .2, 0, 0, TAU); x.fill(); x.stroke();
      if (!back) { x.beginPath(); x.roundRect(r * .12, r * .74, r * .2, r * .45, r * .06); x.fill(); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = r * .05; for (const k of [-.35, 0, .35]) { x.beginPath(); x.moveTo(k * r, r * .6); x.lineTo(k * r, r * .84); x.stroke(); } x.restore(); }
    const bob = opt.walk ? -Math.abs(Math.sin(opt.walk * 16)) * r * .12 : Math.sin(t * 2.2) * r * .025;
    x.translate(off * r * .12, bob);
    ears(x, C, r, lw, back); headFill(x, C, r, lw, back);
    if (!back) face(x, C, r, mood, off);
    else { x.strokeStyle = lineOf(C); x.lineWidth = lw * .8; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * .08, r * .6); x.quadraticCurveTo(0, r * .5, r * .08, r * .6); x.stroke(); }
    if (opt.acc === 'bubble') for (const [bx, by, br] of [[-r * .25, -r * .92, r * .2], [r * .05, -r * 1.02, r * .25], [r * .3, -r * .9, r * .17]]) { E(x, bx, by, br, br, 'rgba(255,255,255,.95)'); x.lineWidth = Math.max(1, r * .04); x.strokeStyle = '#B9E3F0'; x.stroke(); E(x, bx - br * .35, by - br * .35, br * .22, br * .22, '#D7F2FA'); }
    if (opt.acc === 'towel') { x.save(); x.beginPath(); x.ellipse(0, -r * .62, r * .78, r * .32, 0, Math.PI, TAU); x.lineTo(r * .78, -r * .55); x.quadraticCurveTo(0, -r * .4, -r * .78, -r * .55); x.closePath(); x.fillStyle = '#FFC7D6'; x.fill(); x.lineWidth = lw * .8; x.strokeStyle = '#E79AB0'; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = r * .05; for (const k of [-.4, 0, .4]) { x.beginPath(); x.moveTo(k * r, -r * .9); x.lineTo(k * r, -r * .55); x.stroke(); } x.restore(); }
    if (opt.acc === 'duck') { x.save(); x.translate(r * .35, -r * .95); E(x, 0, 0, r * .2, r * .16, '#FFE066'); E(x, r * .12, -r * .14, r * .12, r * .11, '#FFE066'); E(x, r * .23, -r * .13, r * .07, r * .035, '#FF9F43'); E(x, r * .14, -r * .17, r * .022, r * .022, '#4A3A35'); x.restore(); }
    if (opt.acc === 'ribbon') { x.save(); x.translate(r * .58, -r * .72); x.rotate(.35); x.fillStyle = '#FF7FA3'; x.strokeStyle = '#D9567C'; x.lineWidth = lw * .6;
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * r * .32, -r * .22, s * r * .3, r * .02); x.quadraticCurveTo(s * r * .32, r * .2, 0, 0); x.fill(); x.stroke(); }
      E(x, 0, 0, r * .08, r * .08, '#FFB3C7'); x.stroke(); x.restore(); }
    if (opt.acc === 'flower') { x.save(); const cols = ['#FFB3C7', '#FFE38A', '#B9E6C9', '#C9B8EE', '#FFB3C7'];
      for (let i = 0; i < 5; i++) { const a = Math.PI * (1.15 + i * .175), fx = Math.cos(a) * r * .78, fy = Math.sin(a) * r * .66 - r * .05;
        for (let p = 0; p < 5; p++) { const pa = p * TAU / 5; E(x, fx + Math.cos(pa) * r * .09, fy + Math.sin(pa) * r * .09, r * .08, r * .08, cols[i]); } E(x, fx, fy, r * .06, r * .06, '#FFF6C9'); }
      x.restore(); }
    if (opt.acc === 'crown') { x.save(); x.translate(0, -r * .82); const w = r * .38, h = r * .3; x.beginPath(); x.moveTo(-w, 0); x.lineTo(-w, -h * .6); x.lineTo(-w * .45, -h * .2); x.lineTo(0, -h); x.lineTo(w * .45, -h * .2); x.lineTo(w, -h * .6); x.lineTo(w, 0); x.closePath(); x.fillStyle = '#FFD84A'; x.fill(); x.lineWidth = lw * .7; x.strokeStyle = '#D79A12'; x.lineJoin = 'round'; x.stroke(); E(x, 0, -h * .35, r * .05, r * .05, '#FF7F95'); x.restore(); }
    // ---- v2.0 shop accessories ----
    if (opt.acc === 'beanie') { x.save(); x.translate(0, -r * .55); x.fillStyle = '#9FD6F0'; x.strokeStyle = '#6FB5D8'; x.lineWidth = lw * .7;
      x.beginPath(); x.ellipse(0, 0, r * .78, r * .5, 0, Math.PI, TAU); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(-r * .8, -r * .06, r * 1.6, r * .2, r * .1); x.fill(); x.stroke();
      E(x, 0, -r * .52, r * .14, r * .14, '#FFFFFF'); x.stroke(); x.restore(); }
    if (opt.acc === 'glasses') { x.save(); x.strokeStyle = '#7A5260'; x.lineWidth = lw * .8; x.fillStyle = 'rgba(200,230,255,.35)';
      for (const s of [-1, 1]) { x.beginPath(); x.arc(s * r * .36 + off * r * .24, r * .08, r * .2, 0, TAU); x.fill(); x.stroke(); }
      x.beginPath(); x.moveTo(-r * .16 + off * r * .24, r * .06); x.quadraticCurveTo(off * r * .24, r * .0, r * .16 + off * r * .24, r * .06); x.stroke(); x.restore(); }
    if (opt.acc === 'pjhood') { x.save(); x.fillStyle = '#FFE8A3'; x.strokeStyle = '#E8C464'; x.lineWidth = lw * .7;
      x.beginPath(); x.ellipse(0, -r * .35, r * 1.02, r * .62, 0, Math.PI * 1.02, Math.PI * 1.98); x.quadraticCurveTo(0, -r * .62, -r * 1.0, -r * .4); x.fill(); x.stroke();
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * r * .3, -r * .9); x.lineTo(s * r * .52, -r * 1.25); x.lineTo(s * r * .72, -r * .78); x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = '#FFFFFF'; for (const [sx, sy] of [[-.5, -.66], [.2, -.82], [.55, -.62]]) { x.beginPath(); x.arc(sx * r, sy * r, r * .05, 0, TAU); x.fill(); } x.restore(); }
    if (opt.acc === 'strawhat') { x.save(); x.translate(0, -r * .62); x.fillStyle = '#F6D98B'; x.strokeStyle = '#D7B45C'; x.lineWidth = lw * .7;
      x.beginPath(); x.ellipse(0, r * .08, r * 1.0, r * .2, 0, 0, TAU); x.fill(); x.stroke();
      x.beginPath(); x.ellipse(0, 0, r * .5, r * .32, 0, Math.PI, TAU); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#FF9CB5'; x.fillRect(-r * .5, -r * .08, r, r * .1); E(x, r * .52, -r * .04, r * .1, r * .1, '#FFD6E2'); x.restore(); }
    if (opt.acc === 'bow') { x.save(); x.translate(0, r * .62); x.fillStyle = '#B9A4EE'; x.strokeStyle = '#8F78D6'; x.lineWidth = lw * .6;
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(0, 0); x.lineTo(s * r * .26, -r * .14); x.lineTo(s * r * .26, r * .14); x.closePath(); x.fill(); x.stroke(); }
      E(x, 0, 0, r * .07, r * .07, '#D6C8FF'); x.restore(); }
    if (opt.acc === 'halo') { x.save(); x.strokeStyle = '#FFD457'; x.lineWidth = r * .09; x.shadowColor = 'rgba(255,212,87,.8)'; x.shadowBlur = r * .3;
      x.beginPath(); x.ellipse(0, -r * 1.12 + Math.sin(t * 3) * r * .04, r * .45, r * .12, 0, 0, TAU); x.stroke(); x.restore(); }
    if (opt.acc === 'sprout') { x.save(); x.translate(r * .05, -r * .82); x.strokeStyle = '#6CC481'; x.lineWidth = r * .07; x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(r * .05, -r * .2, 0, -r * .32); x.stroke(); x.fillStyle = '#9FE0A8';
      x.beginPath(); x.ellipse(-r * .15, -r * .34, r * .16, r * .08, -.5 + Math.sin(t * 2) * .1, 0, TAU); x.fill(); x.beginPath(); x.ellipse(r * .15, -r * .36, r * .16, r * .08, .5 - Math.sin(t * 2) * .1, 0, TAU); x.fill(); x.restore(); }
    if (mood === 'bump') { x.fillStyle = '#8FD3F5'; for (const s of [-1, 1]) { x.beginPath(); const tx = s * r * .62, ty = r * .05; x.moveTo(tx, ty); x.quadraticCurveTo(tx + s * r * .1, ty + r * .2, tx, ty + r * .22); x.quadraticCurveTo(tx - s * r * .1, ty + r * .2, tx, ty); x.fill(); } }
    if (mood === 'sleep') { x.fillStyle = '#8FA8E8'; x.font = `900 ${r * .45}px "Noto Sans CJK KR",sans-serif`; x.textAlign = 'center'; const z = (t * .8) % 1; x.globalAlpha = 1 - z; x.fillText('z', r * .7 + z * r * .3, -r * .7 - z * r * .5); x.globalAlpha = 1; }
    if (mood === 'happy' && opt.walk) heart(x, -r * .9, -r * .6 + Math.sin(t * 9) * r * .1, r * .2, '#FF8FB1');
    x.restore();
  }
  function iconURL(lvl, px, dir, mood, acc) { const c = document.createElement('canvas'); c.width = c.height = px; const x = c.getContext('2d'); x.translate(px / 2, px / 2 + px * .02); drawCat(x, lvl, px * .95, dir ?? 2, { mood: mood || 'idle', acc }); return c.toDataURL(); }
  window.CatArt = { CATS, drawCat, iconURL, shade, heart };
})();
