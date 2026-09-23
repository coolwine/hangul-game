// 한글 음절 조합·분해 유틸리티
// 유니코드 한글 음절 = 0xAC00 + (초성 × 21 + 중성) × 28 + 종성
(function (root) {
  'use strict';

  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const BASE = 0xac00;

  function isSyllable(ch) {
    const c = ch.charCodeAt(0);
    return c >= BASE && c <= 0xd7a3;
  }

  function isVowel(jamo) {
    return JUNG.includes(jamo);
  }

  function decompose(ch) {
    if (!isSyllable(ch)) throw new Error(`한글 음절이 아닙니다: ${ch}`);
    const off = ch.charCodeAt(0) - BASE;
    return {
      cho: CHO[Math.floor(off / 588)],
      jung: JUNG[Math.floor((off % 588) / 28)],
      jong: JONG[off % 28],
    };
  }

  function compose(cho, jung, jong = '') {
    const i = CHO.indexOf(cho), j = JUNG.indexOf(jung), k = JONG.indexOf(jong);
    if (i < 0 || j < 0 || k < 0) throw new Error(`조합할 수 없습니다: ${cho}${jung}${jong}`);
    return String.fromCharCode(BASE + (i * 21 + j) * 28 + k);
  }

  // 단어를 "받아야 할 자모 순서"로 펼친다.
  // 겹받침(ㄳ 등)은 블록 하나로 받기 어색하므로 단어 목록에서 쓰지 않는다.
  function buildWord(text, emoji) {
    const syllables = [...text].map((ch) => {
      const { cho, jung, jong } = decompose(ch);
      const steps = [{ jamo: cho, role: 'cho' }, { jamo: jung, role: 'jung' }];
      if (jong) steps.push({ jamo: jong, role: 'jong' });
      return { char: ch, steps };
    });
    return { text, emoji, syllables };
  }

  // 받은 자모 개수만큼 조립된 모양 (ㄱ → 가 → 강)
  function partial(syl, done) {
    const s = syl.steps;
    if (done <= 0) return '';
    if (done === 1) return s[0].jamo;
    return compose(s[0].jamo, s[1].jamo, done >= 3 ? s[2].jamo : '');
  }

  const api = { CHO, JUNG, JONG, isSyllable, isVowel, decompose, compose, buildWord, partial };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Hangul = api;
})(this);
