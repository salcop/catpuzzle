/* 냥이 대탈출 - story script + cutscene player
   Cast: 치즈(리더) · 구름(겁쟁이 흰냥) · 삼색이(먹보) · 까망(시크) · 턱시도(허세) · 샴(차분) · 집사(목소리만) */
(function () {
  'use strict';
  const CAST = {
    치즈: { lvl: 0, pitch: 1.0, acc: null }, 구름: { lvl: 1, pitch: 1.25, acc: 'bubble' }, 삼색이: { lvl: 3, pitch: 1.12, acc: null },
    까망: { lvl: 7, pitch: .86, acc: null }, 턱시도: { lvl: 4, pitch: .95, acc: 'duck' }, 샴: { lvl: 6, pitch: 1.05, acc: 'towel' }, 하늘: { lvl: 5, pitch: 1.0, acc: null }, 집사: { human: true },
  };
  const PROLOGUE = { bg: 'art/story.jpg', title: '프롤로그 · 목욕은 싫다냥!', lines: [
    ['집사', '얘들아~ 오늘은 목욕하는 날이야! 다들 욕실로 모여~♪'],
    ['구름', '모, 목욕…? 물은 무섭다냥…!', 'bump'],
    ['삼색이', '목욕 끝나면 츄르 준다고 했는데… 그래도 싫다냥.', 'idle'],
    ['치즈', '다들 걱정 마라냥. 이 치즈님에게 탈출 작전이 있다!', 'happy'],
    ['치즈', '우리는 보는 방향으로만 걸을 수 있다냥. 앞이 막혀 있으면… 콩! 하고 부딪힌다.', 'idle'],
    ['까망', '그러니까 바깥쪽 녀석부터 차례대로 빠져나가면 된다는 거군.', 'idle'],
    ['치즈', '바로 그거다냥! 집사가 샴푸 들고 오기 전에… 작전 개시!', 'happy'],
  ] };
  const CHAPTERS = [
    { name: '욕실 대탈출', pic: 'art/pic1.jpg', picName: '뽀송뽀송 목욕 끝',
      intro: [['치즈', '첫 번째 목표는 욕실 문이다냥! 하나씩 차근차근!', 'happy'], ['구름', '바닥이 미끄러워… 조심조심…', 'bump']],
      outro: [['집사', '어머, 다들 어디 가~? …치즈 잡았다!'], ['치즈', '으냥…! 나만 잡혔다냥…', 'bump'], ['치즈', '…그래도 수건은 폭신하고 좋다냥.', 'happy'], ['구름', '치즈 대장의 희생은 잊지 않겠다냥!', 'happy']] },
    { name: '낮잠 대피소', pic: 'art/pic2.jpg', picName: '별밤 냥냥 낮잠',
      intro: [['까망', '집사가 침실은 안 찾아볼 거다. 거기로 숨자.', 'idle'], ['삼색이', '이불 속은 따뜻하겠다냥~', 'happy']],
      outro: [['구름', '이불 속… 너무 포근해… 잠이…', 'sleep'], ['삼색이', 'zZz… 츄르… 냠냠…', 'sleep'], ['까망', '…작전 중에 다들 잠들었군. 뭐, 나도 5분만.', 'blink']] },
    { name: '한밤의 냉장고 파티', pic: 'art/pic3.jpg', picName: '냉장고 습격 대작전',
      intro: [['삼색이', '자다 깼더니 배고프다냥! 부엌에 가면 붕어빵이 있다냥!', 'happy'], ['치즈', '(수건 쓰고 복귀) 대장도 같이 간다냥!', 'happy']],
      outro: [['삼색이', '붕어빵! 우유! 츄르! 천국이다냥~♥', 'happy'], ['샴', '쉿, 집사 깨겠어… 우유 콧수염 묻었어.', 'blink'], ['치즈', '오늘 밤은 성공이다냥!', 'happy']] },
    { name: '정원 나비 사냥', pic: 'art/pic4.jpg', picName: '꽃밭 나비 술래잡기',
      intro: [['턱시도', '햇살 좋은 날엔 정원이지! 나비는 이 몸이 잡는다!', 'happy'], ['구름', '스프링클러… 물이 튀면 어떡해…', 'bump']],
      outro: [['턱시도', '잡았…다! …아니, 코에 앉았다…', 'blink'], ['구름', '물방울에 무지개가 생겼다냥! 물도… 조금은 괜찮을지도?', 'happy'], ['치즈', '구름이가 물을 좋아하게 되다니! 대단하다냥!', 'happy']] },
    { name: '박스 성 건설', pic: 'art/pic5.jpg', picName: '종이상자 냥냥 성',
      intro: [['치즈', '택배가 왔다냥! 상자가 잔뜩!', 'happy'], ['까망', '상자는… 들어가야 하는 법이지.', 'idle']],
      outro: [['치즈', '완성! 이름하여 냥냥 성이다냥!', 'happy'], ['삼색이', '창문마다 고양이가 하나씩~', 'happy'], ['집사', '(멀리서) 얘들아, 그 상자 버려야 하는데…'], ['모두', '안 돼!!!', 'bump']] },
    { name: '지붕 위 불꽃놀이', pic: 'art/pic6.jpg', picName: '보름달 불꽃놀이',
      intro: [['샴', '오늘 밤 마을에 불꽃놀이가 있대.', 'idle'], ['치즈', '지붕 위가 명당이다냥! 오늘도 대탈출이다냥!', 'happy']],
      outro: [['구름', '와아… 하늘에 꽃이 핀다냥…', 'happy'], ['치즈', '탈출만 하다 보니… 이렇게 다 같이 모였다냥.', 'blink'], ['까망', '…내일 목욕날에도 같이 도망치는 거다.', 'happy'], ['치즈', '물론이다냥! 냥이 대탈출은 계속된다냥!', 'happy']] },
    // ---- v2.1 content update (월간 챕터 예시: 아래 형식 그대로 추가하면 됨 · docs/04_콘텐츠_업데이트_가이드.md) ----
    { name: '눈 오는 크리스마스', pic: 'art/pic7.jpg', picName: '냥냥 트리 꾸미기', season: 'winter',
      intro: [['구름', '밖에 하얀 게 떨어진다냥! 차가워…', 'bump'], ['치즈', '크리스마스다냥! 집사 몰래 트리를 꾸미자!', 'happy']],
      outro: [['삼색이', '리본은 내 거다냥~ 데굴데굴~', 'happy'], ['치즈', '산타 모자 어울리냥?', 'happy'], ['집사', '어머, 트리가… 리본투성이네? 그래도 예쁘다~'], ['모두', '메리 냥스마스!', 'happy']] },
    { name: '벚꽃 소풍', pic: 'art/pic8.jpg', picName: '벚꽃 아래 붕어빵 소풍', season: 'spring',
      intro: [['샴', '공원에 벚꽃이 피었대. 소풍 갈까?', 'idle'], ['턱시도', '붕어빵 도시락은 이 몸이 챙겼다!', 'happy']],
      outro: [['까망', '…꽃잎이 코에 붙었다.', 'blink'], ['하늘', '오리들도 같이 먹고 싶대.', 'happy'], ['치즈', '목욕은 싫지만… 봄바람은 좋다냥~', 'happy']] },
  ];
  let el, resolve, idx = 0, script = null, full = '', shown = 0, timer = null;
  function ensure() {
    if (el) return;
    el = document.createElement('div'); el.id = 'story'; el.className = 'hidden';
    el.innerHTML = `<div class="st-bg"></div><div class="st-title"></div><button class="st-skip">건너뛰기 ›</button>
      <div class="st-box"><div class="st-port"><img alt=""></div><div class="st-name"></div><div class="st-text"></div><div class="st-next">▼</div></div>`;
    document.body.appendChild(el);
    el.addEventListener('pointerdown', e => { if (e.target.classList.contains('st-skip')) { end(); return; } advance(); });
  }
  function portrait(who, mood) { const c = CAST[who]; if (!c || c.human) return null; return CatArt.iconURL(c.lvl, 220, 2, mood || 'idle', c.acc); }
  const HUMAN = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#FFE3EA"/><path d="M30 62q20 18 40 0" stroke="#E3728F" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="36" cy="44" r="5" fill="#7A5260"/><circle cx="64" cy="44" r="5" fill="#7A5260"/></svg>');
  function show(i) {
    const [who, text, mood] = script.lines[i];
    const box = el.querySelector('.st-box'); box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
    const p = who === '모두' ? CatArt.iconURL(0, 220, 2, mood || 'bump') : portrait(who, mood);
    const port = el.querySelector('.st-port'); port.classList.toggle('human', !p); port.querySelector('img').src = p || HUMAN;
    el.querySelector('.st-name').textContent = who; el.querySelector('.st-name').className = 'st-name' + (p ? '' : ' human');
    full = text; shown = 0; el.querySelector('.st-text').textContent = ''; el.querySelector('.st-next').style.opacity = 0;
    clearInterval(timer); timer = setInterval(() => { shown++; el.querySelector('.st-text').textContent = full.slice(0, shown); if (shown >= full.length) { clearInterval(timer); el.querySelector('.st-next').style.opacity = 1; } }, 32);
    const c = CAST[who]; if (window.Platform) Platform.sfx(c && !c.human ? (mood === 'bump' ? 'bump' : mood === 'sleep' ? 'purr' : 'tap_go') : 'page', c && c.pitch || 1, .7);
  }
  function advance() {
    if (!script) return;
    if (shown < full.length) { clearInterval(timer); shown = full.length; el.querySelector('.st-text').textContent = full; el.querySelector('.st-next').style.opacity = 1; return; }
    idx++; if (idx >= script.lines.length) end(); else show(idx);
  }
  function end() { clearInterval(timer); script = null; el.classList.add('fade'); setTimeout(() => { el.classList.add('hidden'); el.classList.remove('fade'); const r = resolve; resolve = null; r && r(); }, 350); }
  function play(s) {
    ensure(); script = s; idx = 0; full = ''; shown = 0;
    el.querySelector('.st-bg').style.backgroundImage = `url(${s.bg})`; el.querySelector('.st-title').textContent = s.title || '';
    el.querySelector('.st-text').textContent = ''; el.querySelector('.st-name').textContent = '';
    el.classList.remove('hidden'); if (window.Platform) Platform.sfx('page');
    setTimeout(() => script && show(0), 450);
    return new Promise(r => resolve = r);
  }
  const isOpen = () => el && !el.classList.contains('hidden');
  window.Story = { CAST, PROLOGUE, CHAPTERS, play, isOpen,
    prologue: () => play(PROLOGUE),
    chapterIntro: c => { const C = CHAPTERS[c % CHAPTERS.length]; return play({ bg: C.pic, title: `챕터 ${c + 1} · ${C.name}`, lines: C.intro }); },
    chapterOutro: c => { const C = CHAPTERS[c % CHAPTERS.length]; return play({ bg: C.pic, title: `챕터 ${c + 1} 완료 · '${C.picName}'`, lines: C.outro }); } };
})();
