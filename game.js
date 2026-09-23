(() => {
  'use strict';

  const { isVowel, buildWord, partial } = window.Hangul;
  const STAGES = window.STAGES;

  // ---------- 상수 ----------
  const W = 480, H = 560;
  const LANES = 6, LANE_W = W / LANES;
  const TILE = 50;
  const TRAY_Y = H - 52; // 받침대 윗면
  const CHAR_H = 84; // 위에서 글자를 떨어뜨리는 해달 캐릭터 높이
  const CHAR_TOP = 18; // 폴짝 뛰어도(최대 16) 위가 잘리지 않을 여백
  const PENCIL_H = 24; // 받침대(연필) 두께
  const DROP_Y = 80; // 블록이 나오는 높이 (해달의 노트북 앞)
  const MAX_HEARTS = 5;
  const COLOR = { cons: '#3b6fd8', vowel: '#f08a3c', good: '#2a9d5c', bad: '#d64545', ink: '#3a2e22' };
  const ROLE_LABEL = { cho: '첫소리', jung: '가운뎃소리', jong: '끝소리' };

  const BASIC_C = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const BASIC_V = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ'];

  // 헷갈리기 쉬운 짝 — 방해 블록을 여기서 고른다
  const CONFUSE = {
    'ㄱ': ['ㅋ', 'ㄲ', 'ㄴ'], 'ㄲ': ['ㄱ', 'ㅋ'], 'ㄴ': ['ㄷ', 'ㄹ', 'ㄱ'], 'ㄷ': ['ㅌ', 'ㄸ', 'ㄴ'],
    'ㄸ': ['ㄷ', 'ㅌ'], 'ㄹ': ['ㄷ', 'ㅌ', 'ㄴ'], 'ㅁ': ['ㅂ', 'ㅇ'], 'ㅂ': ['ㅍ', 'ㅃ', 'ㅁ'],
    'ㅃ': ['ㅂ', 'ㅍ'], 'ㅅ': ['ㅈ', 'ㅆ', 'ㅊ'], 'ㅆ': ['ㅅ', 'ㅈ'], 'ㅇ': ['ㅎ', 'ㅁ'],
    'ㅈ': ['ㅊ', 'ㅉ', 'ㅅ'], 'ㅉ': ['ㅈ', 'ㅊ'], 'ㅊ': ['ㅈ', 'ㅎ', 'ㅅ'], 'ㅋ': ['ㄱ', 'ㄲ'],
    'ㅌ': ['ㄷ', 'ㄹ'], 'ㅍ': ['ㅂ', 'ㅁ'], 'ㅎ': ['ㅇ', 'ㅊ'],
    'ㅏ': ['ㅓ', 'ㅑ'], 'ㅑ': ['ㅏ', 'ㅕ'], 'ㅓ': ['ㅏ', 'ㅕ'], 'ㅕ': ['ㅓ', 'ㅑ'],
    'ㅗ': ['ㅜ', 'ㅛ'], 'ㅛ': ['ㅗ', 'ㅠ'], 'ㅜ': ['ㅗ', 'ㅠ'], 'ㅠ': ['ㅜ', 'ㅛ'],
    'ㅡ': ['ㅣ', 'ㅜ'], 'ㅣ': ['ㅡ', 'ㅏ'], 'ㅐ': ['ㅔ', 'ㅏ'], 'ㅔ': ['ㅐ', 'ㅓ'],
  };

  // 가획의 원리: 기본자에 획을 더해 소리가 세진다
  const GAHWEK = [['ㄱ', 'ㅋ'], ['ㄴ', 'ㄷ', 'ㅌ'], ['ㅁ', 'ㅂ', 'ㅍ'], ['ㅅ', 'ㅈ', 'ㅊ'], ['ㅇ', 'ㅎ']];
  const DOUBLE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
  const VOWEL_HINT = {
    'ㅏㅓ': '짧은 획이 ㅣ 오른쪽이면 ㅏ, 왼쪽이면 ㅓ 예요.',
    'ㅗㅜ': '짧은 획이 ㅡ 위에 있으면 ㅗ, 아래에 있으면 ㅜ 예요.',
    'ㅏㅑ': '짧은 획이 하나면 ㅏ, 둘이면 ㅑ 예요.',
    'ㅓㅕ': '짧은 획이 하나면 ㅓ, 둘이면 ㅕ 예요.',
    'ㅗㅛ': '짧은 획이 하나면 ㅗ, 둘이면 ㅛ 예요.',
    'ㅜㅠ': '짧은 획이 하나면 ㅜ, 둘이면 ㅠ 예요.',
    'ㅡㅣ': 'ㅡ 는 평평한 땅, ㅣ 는 서 있는 사람을 본떴어요.',
    'ㅐㅔ': 'ㅐ 는 ㅏ + ㅣ, ㅔ 는 ㅓ + ㅣ 예요.',
  };

  // ---------- 도우미 ----------
  const $ = (id) => document.getElementById(id);
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // 자음 이름(기역·니은…)은 모두 받침으로 끝나고 모음 이름(아·야…)은 받침이 없다
  const eunNeun = (jamo) => (isVowel(jamo) ? '는' : '은');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경은 무시 */ } },
  };

  // ---------- 소리 ----------
  let audioCtx = null;
  let muted = store.get('hg-muted') === '1';

  function tone(freq, dur, type = 'sine', when = 0, vol = 0.12) {
    if (muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime + when;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch { /* 오디오 미지원 */ }
  }
  const sfx = {
    good() { tone(660, 0.12, 'triangle'); tone(880, 0.15, 'triangle', 0.07); },
    bad() { tone(170, 0.25, 'sawtooth', 0, 0.06); },
    word() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.09)); },
  };

  // 완성된 글자를 한국어 음성으로 읽어 준다
  function speak(text) {
    if (muted || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = 0.85;
      speechSynthesis.speak(u);
    } catch { /* 음성 미지원 */ }
  }

  // ---------- 캔버스 ----------
  const canvas = $('board');
  const ctx = canvas.getContext('2d');
  const wrap = $('board-wrap');
  const box = $('board-box');
  // 남은 공간 안에서 비율(480:560)을 지키며 가장 크게. 좌표계는 늘 W×H 로 두고 배율만 바꾼다
  function setupCanvas() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.width, (r.height * W) / H));
    const h = (w * H) / W;
    box.style.width = `${w}px`;
    box.style.height = `${h}px`;
    document.documentElement.style.setProperty('--board-h', `${h}px`);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const k = canvas.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
  }
  setupCanvas();
  if ('ResizeObserver' in window) new ResizeObserver(setupCanvas).observe(wrap);
  else window.addEventListener('resize', setupCanvas);

  // ---------- 상태 ----------
  const game = {
    state: 'title', // title | play | pause | celebrate | stageclear | over
    stageIdx: 0,
    loop: 0, // 마지막 단계를 다시 돌 때마다 빨라진다
    queue: [],
    wordIdx: 0,
    word: null,
    sylIdx: 0,
    stepIdx: 0,
    score: 0,
    best: Number(store.get('hg-best')) || 0,
    hearts: MAX_HEARTS,
    combo: 0,
    made: [],
    stageMade: [],
    tiles: [],
    particles: [],
    floaters: [],
    spawnTimer: 0,
    sinceNeeded: 0,
    lastLane: -1,
    shake: 0,
    celebrate: 0,
    msgTimer: 0,
  };
  const player = { lane: 2, x: 2.5 * LANE_W };
  // 해달: 떨어뜨릴 칸으로 먼저 걸어가고, 도착하면 블록을 떨어뜨린다
  const dropper = { lane: 2, x: 2.5 * LANE_W, pending: false, toss: 0, face: 1 };
  const charImg = new Image();
  let charReady = false;
  charImg.onload = () => { charReady = true; };
  charImg.src = 'assets/char-haedal.png';

  const stage = () => STAGES[game.stageIdx];
  const need = () => game.word.syllables[game.sylIdx].steps[game.stepIdx];
  const fallSpeed = () => 75 + game.stageIdx * 18 + game.loop * 22 + game.wordIdx * 4;
  const spawnInterval = () => Math.max(0.5, 1.15 - game.stageIdx * 0.12 - game.loop * 0.08);

  // ---------- 진행 ----------
  function startGame() {
    Object.assign(game, { stageIdx: 0, loop: 0, score: 0, hearts: MAX_HEARTS, combo: 0, made: [] });
    renderMade(false);
    startStage();
  }

  // 완성한 단어 보관함. 새로 만든 것이 맨 앞에 오고 도장이 찍힌다.
  // 이번 단계에서 아직 못 만든 개수만큼 빈 도장 자리를 뒤에 붙여 목표가 보이게 한다
  function renderMade(withNew) {
    $('made-count').textContent = game.made.length;
    const left = Math.max(0, window.WORDS_PER_STAGE - game.stageMade.length);
    const slots = '<div class="made-slot">?</div>'.repeat(left);
    const items = game.made.slice().reverse().map((w, i) =>
      `<div class="made-item ${withNew && i === 0 ? 'new' : ''}">` +
      `<span class="e">${w.emoji}</span><b>${w.text}</b><span class="seal">완성</span></div>`,
    ).join('');
    const list = $('made-list');
    list.innerHTML = items + slots;
    list.scrollTo({ left: 0, top: 0 });
  }

  function startStage() {
    game.queue = shuffle(stage().words).slice(0, window.WORDS_PER_STAGE);
    game.wordIdx = 0;
    game.stageMade = [];
    renderMade(false);
    loadWord();
    setState('play');
  }

  function loadWord() {
    const [text, emoji] = game.queue[game.wordIdx];
    game.word = buildWord(text, emoji);
    game.sylIdx = 0;
    game.stepIdx = 0;
    game.tiles = [];
    game.sinceNeeded = 0;
    game.spawnTimer = 0.4;
    dropper.pending = false;
    game.msgTimer = 0;
    renderHUD();
  }

  function advance() {
    const syl = game.word.syllables[game.sylIdx];
    game.stepIdx++;
    if (game.stepIdx >= syl.steps.length) {
      if (game.word.syllables.length > 1) speak(syl.char);
      game.sylIdx++;
      game.stepIdx = 0;
      if (game.sylIdx >= game.word.syllables.length) {
        wordComplete();
        return;
      }
      showMsg(`"${syl.char}" 완성! 다음 글자로 가요.`, 'good');
    }
    renderHUD();
  }

  function wordComplete() {
    const w = game.word;
    const bonus = 40 * w.syllables.length;
    game.score += bonus;
    game.made.push(w);
    game.stageMade.push(w);
    renderMade(true);
    game.tiles = [];
    game.celebrate = 1.8;
    sfx.word();
    speak(w.text);
    for (let i = 0; i < 40; i++) burst(W / 2, H / 2 - 40, i % 2 ? COLOR.cons : COLOR.vowel, 1);
    floater(`+${bonus}`, W / 2, H / 2 + 50, COLOR.good);
    const lastSyl = w.syllables[w.syllables.length - 1];
    const eulReul = lastSyl.steps.length > 2 ? '을' : '를';
    showMsg(`뚝딱! ${w.emoji} "${w.text}"${eulReul} 만들었어요!`, 'good');
    setState('celebrate');
    renderHUD();
  }

  function nextWord() {
    game.wordIdx++;
    if (game.wordIdx >= game.queue.length) {
      stageClear();
      return;
    }
    loadWord();
    setState('play');
  }

  function stageClear() {
    const st = stage();
    game.hearts = Math.min(MAX_HEARTS, game.hearts + 1);
    const last = game.stageIdx === STAGES.length - 1;
    $('stage-clear-title').textContent = `${st.name} 완료!`;
    $('stage-clear-desc').textContent = last
      ? '모든 단계를 끝냈어요! 이제 더 빠르게 도전해 봐요. (❤️ +1)'
      : `다음: ${STAGES[game.stageIdx + 1].name} · ${STAGES[game.stageIdx + 1].title} (❤️ +1)`;
    $('stage-made').innerHTML = game.stageMade.map((w) => `<span>${w.emoji} ${w.text}</span>`).join('');
    $('btn-next').textContent = last ? '더 빠르게!' : '다음 단계';
    setState('stageclear');
    renderHUD();
  }

  function nextStage() {
    if (game.stageIdx < STAGES.length - 1) game.stageIdx++;
    else game.loop++;
    startStage();
  }

  function gameOver() {
    const isBest = game.score > game.best;
    if (isBest) {
      game.best = game.score;
      store.set('hg-best', String(game.best));
    }
    $('final-score').textContent = game.score;
    $('new-best').classList.toggle('hidden', !isBest);
    $('over-made').innerHTML = game.made.length
      ? game.made.map((w) => `<span>${w.emoji} ${w.text}</span>`).join('')
      : '<span>아직 없어요. 다시 도전!</span>';
    setState('over');
    renderHUD();
  }

  function setState(s) {
    game.state = s;
    $('ov-title').classList.toggle('hidden', s !== 'title');
    $('ov-pause').classList.toggle('hidden', s !== 'pause');
    $('ov-stage').classList.toggle('hidden', s !== 'stageclear');
    $('ov-over').classList.toggle('hidden', s !== 'over');
    $('btn-pause').textContent = s === 'pause' ? '▶' : '⏸';
  }

  function togglePause() {
    if (game.state === 'play') setState('pause');
    else if (game.state === 'pause') setState('play');
  }

  // ---------- 블록 생성 ----------
  function pickDistractor(n) {
    // 단어 안의 다른 자모 — "순서"를 헷갈리게 한다
    const others = [];
    game.word.syllables.forEach((s) => s.steps.forEach((st) => { if (st.jamo !== n) others.push(st.jamo); }));
    const r = Math.random();
    if (others.length && r < 0.2) return rand(others);
    const conf = CONFUSE[n] || [];
    if (conf.length && r < 0.65) return rand(conf);
    const sameType = Math.random() < 0.7;
    const pool = (isVowel(n) === sameType ? BASIC_V : BASIC_C).filter((j) => j !== n);
    return rand(pool);
  }

  const crowded = (l) => game.tiles.some((t) => t.lane === l && t.y < DROP_Y + TILE * 1.8);

  // 떨어뜨릴 칸만 정해 해달을 보낸다. 블록은 도착했을 때 drop() 이 만든다
  function spawn() {
    const lanes = [];
    for (let l = 0; l < LANES; l++) if (l !== game.lastLane && !crowded(l)) lanes.push(l);
    if (!lanes.length) return false;
    const lane = rand(lanes);
    game.lastLane = lane;
    dropper.lane = lane;
    dropper.pending = true;
    return true;
  }

  // 무엇을 떨어뜨릴지는 떨어뜨리는 순간의 "필요한 자모" 기준으로 고른다
  function drop() {
    dropper.pending = false;
    const lane = dropper.lane;
    if (crowded(lane)) return;
    const n = need().jamo;
    const onScreen = game.tiles.some((t) => t.jamo === n);
    let jamo;
    if ((!onScreen && game.sinceNeeded >= 2) || Math.random() < 0.3) {
      jamo = n;
      game.sinceNeeded = 0;
    } else {
      jamo = pickDistractor(n);
      game.sinceNeeded++;
    }
    dropper.toss = 0.3;
    game.tiles.push({ lane, y: DROP_Y, jamo, vowel: isVowel(jamo), spin: Math.random() * Math.PI * 2 });
  }

  // ---------- 받기 판정 ----------
  function onCatch(t) {
    const n = need();
    const px = (t.lane + 0.5) * LANE_W;
    if (t.jamo === n.jamo) {
      game.combo++;
      const pts = 10 + Math.min(game.combo, 10) * 2;
      game.score += pts;
      floater(`+${pts}`, px, TRAY_Y - 40, COLOR.good);
      for (let i = 0; i < 14; i++) burst(px, TRAY_Y - 10, t.vowel ? COLOR.vowel : COLOR.cons);
      sfx.good();
      advance();
    } else {
      game.combo = 0;
      game.hearts--;
      game.shake = 0.3;
      floater('✕', px, TRAY_Y - 40, COLOR.bad);
      sfx.bad();
      showMsg(wrongMessage(t.jamo, n), 'bad', 3.2);
      const panel = document.querySelector('.panel');
      panel.classList.remove('shake');
      void panel.offsetWidth;
      panel.classList.add('shake');
      if (game.hearts <= 0) gameOver();
      else renderHUD();
    }
  }

  function wrongMessage(got, n) {
    const show = stage().showNext;
    const role = ROLE_LABEL[n.role];

    // 단어 안에 있지만 아직 차례가 아닌 자모
    const later = [];
    const syls = game.word.syllables;
    for (let s = game.sylIdx; s < syls.length; s++) {
      syls[s].steps.forEach((st, k) => {
        if (s > game.sylIdx || k > game.stepIdx) later.push(st.jamo);
      });
    }
    let msg;
    if (later.includes(got)) {
      msg = `${got}${eunNeun(got)} 조금 뒤에 필요해요! 지금은 ${role} 차례예요.`;
    } else if (isVowel(got) !== isVowel(n.jamo)) {
      msg = isVowel(n.jamo)
        ? `지금은 ${role}, 모음(주황) 차례예요.`
        : `지금은 ${role}, 자음(파랑) 차례예요.`;
    } else {
      msg = show ? `${got} 말고 ${n.jamo} 차례예요.` : `${got}${eunNeun(got)} 지금 필요 없어요.`;
    }
    const hint = shapeHint(got, n.jamo);
    return hint ? `${msg} ${hint}` : msg;
  }

  // 모양이 비슷한 두 자모의 차이를 제자 원리로 설명한다
  function shapeHint(a, b) {
    for (const chain of GAHWEK) {
      const i = chain.indexOf(a), j = chain.indexOf(b);
      if (i >= 0 && j >= 0) {
        const [lo, hi] = i < j ? [a, b] : [b, a];
        return `(${hi}${eunNeun(hi)} ${lo}에 획을 더한 글자예요)`;
      }
    }
    if (DOUBLE[a] === b || DOUBLE[b] === a) {
      const [dbl, one] = DOUBLE[a] === b ? [a, b] : [b, a];
      return `(${dbl}${eunNeun(dbl)} ${one}을 두 번 쓴 된소리예요)`;
    }
    const v = VOWEL_HINT[a + b] || VOWEL_HINT[b + a];
    return v ? `(${v})` : '';
  }

  // ---------- 효과 ----------
  function burst(x, y, color, power = 0.6) {
    const a = Math.random() * Math.PI * 2;
    const s = (80 + Math.random() * 220) * power;
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.7 + Math.random() * 0.5, color });
  }
  function floater(text, x, y, color) {
    game.floaters.push({ text, x, y, color, life: 1 });
  }

  function showMsg(text, kind, dur = 2.2) {
    const tip = $('tip');
    tip.textContent = text;
    tip.className = `tip ${kind}`;
    game.msgTimer = dur;
  }

  function contextTip() {
    if (!game.word) return '';
    const n = need();
    if (n.role === 'cho' && n.jamo === 'ㅇ' && stage().showNext) {
      return '첫소리 ㅇ 은 소리가 나지 않아요. 자리만 채워 주는 글자예요!';
    }
    if (n.role === 'cho') return '먼저 첫소리, 자음(파란 블록)을 받아요.';
    if (n.role === 'jung') return '이제 가운뎃소리, 모음(주황 블록)을 받아요.';
    return '마지막으로 끝소리(받침)! 자음이 글자 아래에 붙어요.';
  }

  // ---------- 화면 갱신 (DOM) ----------
  // 한 줄에 안 들어가면(세 글자 단어, 받침 3칸 등) 줄 전체를 들어갈 만큼 줄인다
  function fitRow(el) {
    el.style.transform = '';
    const kids = el.children;
    if (!kids.length) return;
    const used = kids[kids.length - 1].getBoundingClientRect().right - kids[0].getBoundingClientRect().left;
    const scale = Math.min(1, (el.clientWidth - 4) / used);
    if (scale < 1) el.style.transform = `scale(${scale})`;
  }

  function renderHUD() {
    $('stage').textContent = game.loop ? `${stage().name}+${game.loop}` : stage().name;
    $('score').textContent = game.score;
    $('best').textContent = Math.max(game.best, game.score);
    $('hearts').textContent = '❤️'.repeat(Math.max(0, game.hearts)) + '🤍'.repeat(MAX_HEARTS - Math.max(0, game.hearts));
    $('btn-mute').textContent = muted ? '🔇' : '🔊';

    const w = game.word;
    if (!w) return;
    const celebrating = game.state === 'celebrate' || game.sylIdx >= w.syllables.length;
    $('target-emoji').textContent = w.emoji;
    $('target-word').innerHTML = w.syllables.map((s, i) => {
      const done = celebrating || i < game.sylIdx;
      const cur = !celebrating && i === game.sylIdx;
      const now = done ? s.char : cur ? partial(s, game.stepIdx) : '';
      // 조립 중인 모양(ㅊ, 라)은 목표 글자(차, 랑)와 자리가 달라 겹치면 어긋난다 → 목표는 구석으로
      const building = cur && now && now !== s.char;
      return `<div class="syl ${done ? 'done' : ''} ${cur ? 'current' : ''} ${building ? 'building' : ''}">` +
        `<span class="ghost">${s.char}</span><span class="now">${now}</span></div>`;
    }).join('');

    // 조립식: ㄱ + ㅏ + ㅇ = 강
    const si = celebrating ? w.syllables.length - 1 : game.sylIdx;
    const syl = w.syllables[si];
    const doneSteps = celebrating ? syl.steps.length : game.stepIdx;
    const parts = syl.steps.map((st, k) => {
      const filled = k < doneSteps;
      const cur = !celebrating && k === doneSteps;
      const label = filled || stage().showNext ? st.jamo : '?';
      return `<div class="part ${isVowel(st.jamo) ? 'v' : 'c'} ${filled ? 'filled' : ''} ${cur ? 'current' : ''}">` +
        `<b>${label}</b><small>${ROLE_LABEL[st.role]}</small></div>`;
    }).join('<span class="op">+</span>');
    const result = partial(syl, doneSteps) || '&nbsp;';
    $('formula').innerHTML = `${parts}<span class="op">=</span><div class="part result"><b>${result}</b><small>글자</small></div>`;

    fitRow(document.querySelector('.target'));
    fitRow($('formula'));

    if (game.msgTimer <= 0) {
      $('tip').textContent = contextTip();
      $('tip').className = 'tip';
    }
  }

  // ---------- 루프 ----------
  function update(dt) {
    player.x += ((player.lane + 0.5) * LANE_W - player.x) * Math.min(1, dt * 18);
    if (game.state !== 'pause') {
      const dx = (dropper.lane + 0.5) * LANE_W - dropper.x;
      const step = 900 * dt; // 한 칸(80) 을 0.1초 안쪽에 간다
      if (Math.abs(dx) > 0.5) dropper.face = Math.sign(dx);
      dropper.x += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
      dropper.toss = Math.max(0, dropper.toss - dt);
    }

    for (const p of game.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.life -= dt;
    }
    game.particles = game.particles.filter((p) => p.life > 0);
    for (const f of game.floaters) { f.y -= 50 * dt; f.life -= dt; }
    game.floaters = game.floaters.filter((f) => f.life > 0);
    game.shake = Math.max(0, game.shake - dt);

    if (game.msgTimer > 0) {
      game.msgTimer -= dt;
      if (game.msgTimer <= 0) renderHUD();
    }

    if (game.state === 'celebrate') {
      game.celebrate -= dt;
      if (game.celebrate <= 0) nextWord();
      return;
    }
    if (game.state !== 'play') return;

    if (dropper.pending) {
      if (Math.abs(dropper.x - (dropper.lane + 0.5) * LANE_W) < 2) drop();
    } else {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0 && spawn()) game.spawnTimer = spawnInterval();
    }

    const speed = fallSpeed();
    for (const t of game.tiles) {
      t.y += speed * dt;
      t.spin += dt;
      const bottom = t.y + TILE / 2;
      if (!t.dead && t.lane === player.lane && bottom >= TRAY_Y - 4 && t.y < TRAY_Y + 8) {
        t.dead = true;
        onCatch(t);
        if (game.state !== 'play') return; // 단어 완성·게임 끝으로 판이 바뀌었다
      } else if (t.y - TILE / 2 > H) {
        t.dead = true;
      }
    }
    game.tiles = game.tiles.filter((t) => !t.dead);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 아직 받침대에 닿지 않은 "필요한 블록" 중 가장 아래(가장 먼저 도착할) 것
  function guideTarget(n) {
    let best = null;
    for (const t of game.tiles) {
      if (t.jamo !== n.jamo || t.y + TILE / 2 >= TRAY_Y - 4) continue;
      if (!best || t.y > best.y) best = t;
    }
    return best;
  }

  function chevron(x, y, dir, size) {
    ctx.beginPath();
    if (dir === 0) {
      ctx.moveTo(x - size, y - size / 2);
      ctx.lineTo(x, y + size / 2);
      ctx.lineTo(x + size, y - size / 2);
    } else {
      ctx.moveTo(x - (dir * size) / 2, y - size);
      ctx.lineTo(x + (dir * size) / 2, y);
      ctx.lineTo(x - (dir * size) / 2, y + size);
    }
    ctx.stroke();
  }

  function drawGuide(t, time) {
    const lx = t.lane * LANE_W;
    const pulse = 0.5 + 0.5 * Math.sin(time / 220);

    // 블록에서 바닥까지 그 칸을 비춘다
    const g = ctx.createLinearGradient(0, t.y, 0, TRAY_Y + 40);
    g.addColorStop(0, 'rgba(255, 210, 63, 0)');
    g.addColorStop(1, `rgba(255, 210, 63, ${0.18 + pulse * 0.1})`);
    ctx.fillStyle = g;
    ctx.fillRect(lx + 2, t.y, LANE_W - 4, TRAY_Y + 40 - t.y);

    const dist = t.lane - player.lane;
    const dir = Math.sign(dist);
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dir === 0) {
      // 이미 맞는 칸: 받침대 위에서 아래로 까딱이는 화살표
      ctx.strokeStyle = `rgba(42, 157, 92, ${0.45 + pulse * 0.4})`;
      chevron(player.x, TRAY_Y - 22 + pulse * 5, 0, 9);
    } else {
      // 가야 할 쪽으로 화살표 (칸 수만큼, 최대 3개), 그쪽으로 흐르듯 움직인다
      const count = Math.min(Math.abs(dist), 3);
      const drift = ((time / 600) % 1) * 6 * dir;
      ctx.strokeStyle = `rgba(184, 65, 44, ${0.4 + pulse * 0.4})`;
      const edge = player.x + dir * (LANE_W / 2 + 4);
      for (let i = 0; i < count; i++) {
        chevron(edge + dir * (8 + i * 14) + drift, TRAY_Y + PENCIL_H / 2, dir, 8);
      }
    }
    ctx.restore();
  }

  function drawDropper(time) {
    const moving = Math.abs((dropper.lane + 0.5) * LANE_W - dropper.x) > 1;
    const party = game.state === 'celebrate';
    let bob = Math.sin(time / 300) * 2;
    if (moving) bob = -Math.abs(Math.sin(time / 60)) * 4; // 종종걸음
    if (party) bob = -Math.abs(Math.sin(time / 130)) * 16; // 단어 완성하면 폴짝폴짝
    // 떨어뜨리는 순간 살짝 움츠렸다 편다
    const k = dropper.toss > 0 ? Math.sin((dropper.toss / 0.3) * Math.PI) : 0;
    const sx = 1 + k * 0.08, sy = 1 - k * 0.1;

    ctx.save();
    ctx.translate(dropper.x, CHAR_TOP + CHAR_H + bob);
    ctx.scale(sx * -dropper.face, sy); // 그림은 왼쪽을 보고 있다 → 가는 쪽을 보게 뒤집는다
    if (charReady) {
      const w = (CHAR_H * charImg.width) / charImg.height;
      ctx.drawImage(charImg, -w / 2, -CHAR_H, w, CHAR_H);
    } else {
      ctx.font = `${CHAR_H * 0.8}px sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText('🦦', 0, 0);
    }
    ctx.restore();
  }

  // 왼쪽부터 지우개 · 쇠테 · 몸통 · 깎은 나무 · 심
  function drawPencil(cx, y, label) {
    const L = LANE_W - 2, PH = PENCIL_H;
    const x0 = cx - L / 2;
    const ER = 10, FE = 8, TIP = 16, LEAD = 6;
    const bodyX = x0 + ER + FE, bodyW = L - ER - FE - TIP;
    const tipX = bodyX + bodyW;

    // 그림자
    ctx.fillStyle = 'rgba(90, 60, 30, .15)';
    ctx.beginPath();
    ctx.ellipse(cx, y + PH + 7, L / 2 - 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 지우개
    ctx.fillStyle = '#f2a0b3';
    roundRect(x0, y, ER + 4, PH, 5);
    ctx.fill();
    // 쇠테
    ctx.fillStyle = '#c3c8cf';
    ctx.fillRect(x0 + ER, y, FE, PH);
    ctx.fillStyle = '#9aa1ab';
    ctx.fillRect(x0 + ER + 2, y, 1.5, PH);
    ctx.fillRect(x0 + ER + FE - 3.5, y, 1.5, PH);
    // 몸통 (위는 밝게, 아래는 어둡게 — 육각 연필 면)
    ctx.fillStyle = '#f7c948';
    ctx.fillRect(bodyX, y, bodyW, PH);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(bodyX, y, bodyW, PH * 0.3);
    ctx.fillStyle = '#e3a92b';
    ctx.fillRect(bodyX, y + PH * 0.72, bodyW, PH * 0.28);
    // 깎은 나무
    ctx.fillStyle = '#efcf9c';
    ctx.beginPath();
    ctx.moveTo(tipX, y);
    ctx.lineTo(tipX + TIP, y + PH / 2);
    ctx.lineTo(tipX, y + PH);
    ctx.closePath();
    ctx.fill();
    // 심
    const k = LEAD / TIP;
    ctx.fillStyle = COLOR.ink;
    ctx.beginPath();
    ctx.moveTo(tipX + TIP - LEAD, y + (PH / 2) * (1 - k));
    ctx.lineTo(tipX + TIP, y + PH / 2);
    ctx.lineTo(tipX + TIP - LEAD, y + PH - (PH / 2) * (1 - k));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.fillStyle = COLOR.ink;
      ctx.font = "bold 17px 'Malgun Gothic','Apple SD Gothic Neo',sans-serif";
      ctx.fillText(label, bodyX + bodyW / 2, y + PH / 2 + 1);
    }
  }

  function draw(time) {
    ctx.save();
    if (game.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * game.shake / 0.3, 0);

    // 배경: 한지 느낌
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fffaf0');
    bg.addColorStop(1, '#f1e4c8');
    ctx.fillStyle = bg;
    ctx.fillRect(-10, 0, W + 20, H);
    ctx.strokeStyle = 'rgba(160,130,90,.12)';
    ctx.lineWidth = 1;
    for (let l = 1; l < LANES; l++) {
      ctx.beginPath();
      ctx.moveTo(l * LANE_W, 0);
      ctx.lineTo(l * LANE_W, H);
      ctx.stroke();
    }

    const n = game.word && game.state === 'play' ? need() : null;

    // 방향 힌트: 받아야 할 블록이 있는 칸을 은은하게 비추고, 받침대 옆에 갈 방향을 표시한다
    const target = n && stage().guide ? guideTarget(n) : null;
    if (target) drawGuide(target, time);

    // 떨어지는 자모 블록
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of game.tiles) {
      const x = (t.lane + 0.5) * LANE_W;
      const glow = n && stage().glow && t.jamo === n.jamo;
      ctx.save();
      ctx.translate(x, t.y);
      ctx.rotate(Math.sin(t.spin * 2) * 0.06);
      if (glow) {
        ctx.shadowColor = '#ffd23f';
        ctx.shadowBlur = 18 + Math.sin(time / 120) * 6;
      } else {
        ctx.shadowColor = 'rgba(0,0,0,.18)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
      }
      ctx.fillStyle = t.vowel ? COLOR.vowel : COLOR.cons;
      roundRect(-TILE / 2, -TILE / 2, TILE, TILE, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      if (glow) {
        ctx.strokeStyle = '#ffd23f';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.font = "bold 30px 'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
      ctx.fillText(t.jamo, 0, 2);
      ctx.restore();
    }

    drawDropper(time);

    // 받침대: 가로로 누운 연필
    drawPencil(player.x, TRAY_Y, n ? (stage().showNext ? n.jamo : '?') : '');

    // 효과
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
    for (const f of game.floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = "bold 22px 'Malgun Gothic',sans-serif";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // 단어 완성 축하
    if (game.state === 'celebrate' && game.word) {
      const k = Math.min(1, (1.8 - game.celebrate) * 4);
      const s = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3));
      ctx.save();
      ctx.translate(W / 2, H / 2 - 40);
      ctx.scale(s, s);
      ctx.font = '64px sans-serif';
      ctx.fillText(game.word.emoji, 0, -60);
      ctx.fillStyle = COLOR.ink;
      ctx.font = "bold 72px 'Malgun Gothic','Apple SD Gothic Neo',sans-serif";
      ctx.fillText(game.word.text, 0, 30);
      ctx.restore();
    }

    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw(now);
    requestAnimationFrame(frame);
  }

  // ---------- 입력 ----------
  function move(d) {
    if (game.state !== 'play' && game.state !== 'celebrate') return;
    player.lane = Math.max(0, Math.min(LANES - 1, player.lane + d));
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { move(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { move(1); e.preventDefault(); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
    else if (e.key === 'Enter' || e.key === ' ') {
      if (game.state === 'title' || game.state === 'over') startGame();
      else if (game.state === 'stageclear') nextStage();
      else if (game.state === 'pause') togglePause();
      e.preventDefault();
    }
  });

  // 누른 채 끌면 그 칸으로 받침대가 따라온다
  function pointerLane(e) {
    if (game.state !== 'play' && game.state !== 'celebrate') return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    player.lane = Math.max(0, Math.min(LANES - 1, Math.floor(x / LANE_W)));
  }
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); pointerLane(e); });
  canvas.addEventListener('pointermove', (e) => { if (e.buttons) pointerLane(e); });

  const hold = (btn, d) => {
    let timer = null;
    const stop = () => { clearInterval(timer); timer = null; };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      move(d);
      stop();
      timer = setInterval(() => move(d), 160);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  };
  hold($('btn-left'), -1);
  hold($('btn-right'), 1);

  $('btn-start').addEventListener('click', startGame);
  $('btn-retry').addEventListener('click', startGame);
  $('btn-next').addEventListener('click', nextStage);
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-pause').addEventListener('click', togglePause);
  $('btn-mute').addEventListener('click', () => {
    muted = !muted;
    store.set('hg-muted', muted ? '1' : '0');
    if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
    renderHUD();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'play') setState('pause');
  });

  // 첫 화면에도 예시 단어를 보여 준다
  game.word = buildWord('강', '🏞️');
  game.stepIdx = 0;
  renderHUD();
  $('tip').textContent = 'ㄱ + ㅏ + ㅇ 을 차례로 받으면 "강" 이 돼요!';
  renderMade(false);
  window.addEventListener('resize', () => {
    fitRow(document.querySelector('.target'));
    fitRow($('formula'));
  });
  requestAnimationFrame(frame);

  // index.html?debug 로 열면 콘솔에서 상태를 볼 수 있다 (자동 테스트용)
  if (/[?&]debug\b/.test(location.search)) window.__hg = { game, player, need };
})();
