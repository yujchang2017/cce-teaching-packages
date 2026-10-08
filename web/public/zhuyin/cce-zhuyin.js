/**
 * CCE 低年級學習單：注音＋朗讀
 * - 注音：切換為「源泉注音圓體」（OFL 1.1，已縮減字集），破音字由頁面內的 IVS 選擇子指定讀音
 * - 朗讀：點文字就唸出來（用裝置內建語音，本站不收集任何資料）；答題回饋自動唸
 * 字型授權：OFL-BpmfGenSenRounded.txt、NOTICE-bpmfvs.txt（同資料夾）；標音工具見 scripts/zhuyin/
 * 設定記在這台裝置；網址可加 ?zhuyin=0/1、?tts=0/1 由老師預設
 */
(function () {
  if (window.__cceZhuyinLoaded) return;
  window.__cceZhuyinLoaded = true;

  var ZY_KEY = 'cce_zhuyin_v1', TTS_KEY = 'cce_tts_v1';
  var base = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  function load(key, dflt) {
    try { var v = localStorage.getItem(key); return v === null ? dflt : v === '1'; } catch (e) { return dflt; }
  }
  function save(key, on) { try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) {} }

  var zhuyinOn = load(ZY_KEY, true);
  var ttsOn = load(TTS_KEY, false);
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('zhuyin') === '0' || q.get('zhuyin') === '1') { zhuyinOn = q.get('zhuyin') === '1'; save(ZY_KEY, zhuyinOn); }
    if (q.get('tts') === '0' || q.get('tts') === '1') { ttsOn = q.get('tts') === '1'; save(TTS_KEY, ttsOn); }
  } catch (e) {}

  var css = '' +
    '@font-face{font-family:"CCE Zhuyin";src:url(' + base + 'cce-zhuyin-R.woff2) format("woff2");font-weight:100 500;font-display:swap}' +
    '@font-face{font-family:"CCE Zhuyin";src:url(' + base + 'cce-zhuyin-B.woff2) format("woff2");font-weight:600 900;font-display:swap}' +
    // 注音字型的注音約只有字高的三成，開注音時整頁字級再放大（112.5% → 128%）
    '@media (min-width:640px){html.cce-zy{font-size:128%}}' +
    // 版次標籤是給老師看的，不加注音
    'html.cce-zy .worksheet-version{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif}' +
    'html.cce-zy body{font-family:"CCE Zhuyin","Noto Sans TC","Microsoft JhengHei",sans-serif;line-height:1.7}' +
    'html.cce-zy body button,html.cce-zy body input,html.cce-zy body select{font-family:inherit}' +
    '.cce-zy-bar{display:flex;justify-content:flex-end;gap:.5rem;width:100%;max-width:68rem;margin:8px auto 0;padding:0 16px;box-sizing:border-box;font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif}' +
    '.cce-zy-bar button{font:700 16px/1.2 "Noto Sans TC","Microsoft JhengHei",sans-serif;border:3px solid #fbbf24;background:#fff;color:#92400e;border-radius:9999px;padding:6px 14px;white-space:nowrap;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.12);min-height:44px}' +
    '.cce-zy-bar button[aria-pressed="true"]{background:#fbbf24;color:#78350f}' +
    '.cce-zy-speaking{outline:4px solid #60a5fa !important;outline-offset:3px;border-radius:.75rem}' +
    '.cce-zy-toast{position:fixed;left:50%;bottom:1.5rem;transform:translateX(-50%);background:#1f2937;color:#fff;padding:.7rem 1.2rem;border-radius:1rem;font:600 1rem "Noto Sans TC",sans-serif;z-index:99999;max-width:90vw;text-align:center}' +
    'html.cce-tts body{cursor:pointer}';
  var st = document.createElement('style'); st.id = 'cce-zhuyin-style'; st.textContent = css;
  document.head.appendChild(st);

  function applyZhuyin() { document.documentElement.classList.toggle('cce-zy', zhuyinOn); }
  function applyTts() { document.documentElement.classList.toggle('cce-tts', ttsOn); if (!ttsOn) stop(); }
  applyZhuyin(); applyTts();

  /* ---------- 朗讀 ---------- */
  var synth = window.speechSynthesis, voice = null;
  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices();
    var score = function (v) {
      var l = (v.lang || '').toLowerCase().replace('_', '-');
      return l === 'zh-tw' ? 3 : l.indexOf('zh-hant') === 0 ? 3 : l === 'cmn-hant-tw' ? 3 : l.indexOf('zh') === 0 || l.indexOf('cmn') === 0 ? 1 : 0;
    };
    voice = vs.filter(function (v) { return score(v) > 0; }).sort(function (a, b) { return score(b) - score(a); })[0] || null;
  }
  if (synth) { pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); }

  function clean(s) {
    return (s || '')
      .replace(/[\u{E0100}-\u{E01EF}︀-️]/gu, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[←→✅✨⭐]/g, '')
      .replace(/\s+/g, ' ').trim();
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'cce-zy-toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500);
  }
  var lastEl = null;
  function stop() { if (synth) synth.cancel(); if (lastEl) lastEl.classList.remove('cce-zy-speaking'); lastEl = null; }
  function speak(text, el) {
    text = clean(text);
    if (!text || !ttsOn) return;
    if (!synth) { toast('這台裝置的瀏覽器不支援朗讀'); return; }
    if (!voice) pickVoice();
    if (!voice) { toast('這台裝置沒有中文語音，請在系統設定安裝「中文（台灣）」語音'); }
    stop();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : 'zh-TW';
    if (voice) u.voice = voice;
    u.rate = 0.85; u.pitch = 1.05;
    if (el) { lastEl = el; el.classList.add('cce-zy-speaking'); u.onend = u.onerror = function () { el.classList.remove('cce-zy-speaking'); }; }
    synth.speak(u);
  }
  window.cceSpeak = speak;

  // 點文字就唸：找最近的「一段話」
  var SPEAK_SEL = '[data-speak],h1,h2,h3,p,li,label,button,.drag-item,.bubble,.drop-zone>div';
  document.addEventListener('click', function (e) {
    if (!ttsOn || !e.target || !e.target.closest) return;
    if (e.target.closest('.cce-zy-bar')) return;
    var el = e.target.closest(SPEAK_SEL);
    if (!el) return;
    speak(el.getAttribute('data-speak') || el.innerText, el);
  }, true);

  // 答題回饋（id 結尾是 -fb / feedback）出現或改字時自動唸
  function isFeedback(n) { return n && n.nodeType === 1 && /(-fb|feedback)$/.test(n.id || ''); }
  var pending = null;
  var ownClass = function (s) { return (s || '').replace(/\bcce-zy-speaking\b/g, '').replace(/\s+/g, ' ').trim(); };
  new MutationObserver(function (muts) {
    if (!ttsOn) return;
    muts.forEach(function (m) {
      var n = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (!isFeedback(n)) return;
      // 只有朗讀外框變動（我們自己加的 class）不算新回饋，避免無限重唸
      if (m.type === 'attributes' && ownClass(m.oldValue) === ownClass(n.className)) return;
      if (!n.classList.contains('hide') && n.offsetParent !== null) pending = n;
    });
    if (!pending) return;
    var n = pending; pending = null;
    setTimeout(function () {
      var text = clean(n.innerText), now = Date.now();
      // 同一則回饋 1.5 秒內不重唸（程式常連續改兩次 class/文字）
      if (n.__cceSaid === text && now - (n.__cceAt || 0) < 1500) return;
      n.__cceSaid = text; n.__cceAt = now;
      speak(text, n);
    }, 50);
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

  /* ---------- 開關列 ---------- */
  function bar() {
    var b = document.createElement('div'); b.className = 'cce-zy-bar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', '注音與朗讀');
    var z = document.createElement('button'); z.type = 'button';
    var t = document.createElement('button'); t.type = 'button';
    function label() {
      z.textContent = 'ㄅㄆㄇ 注音 ' + (zhuyinOn ? '開' : '關'); z.setAttribute('aria-pressed', zhuyinOn);
      t.textContent = '🔊 朗讀 ' + (ttsOn ? '開' : '關'); t.setAttribute('aria-pressed', ttsOn);
    }
    z.onclick = function () { zhuyinOn = !zhuyinOn; save(ZY_KEY, zhuyinOn); applyZhuyin(); label(); };
    t.onclick = function () {
      ttsOn = !ttsOn; save(TTS_KEY, ttsOn); applyTts(); label();
      if (ttsOn) speak('朗讀打開了，點一下文字，我就會唸給你聽。');
    };
    label(); b.appendChild(z); b.appendChild(t);
    document.body.insertBefore(b, document.body.firstChild);
  }
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);
})();
