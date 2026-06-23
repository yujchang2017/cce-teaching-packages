/**
 * CCE Worksheet/PPT 匿名追蹤
 * 載入：worksheet_view / ppt_view
 * 點擊：worksheet_click（僅 worksheet）
 *
 * 共用主站的 UUID 與 consent（同網域 localStorage）
 */
(function () {
  if (window.__cceTrackerLoaded) return;
  window.__cceTrackerLoaded = true;

  var TRACK_URL =
    "https://script.google.com/macros/s/AKfycbxPLOjp2CdUXKJL57r_2YZ2qs2-n5aI2ynpknjLrnW8z0iqc2do-wSQ-LyW0PP7wh1S2A/exec";
  var UUID_KEY = "cce_uuid_v1";
  var CONSENT_KEY = "cce_track_consent_v1";

  // 沒同意就完全不啟用（連 UUID 都不寫）
  try {
    if (localStorage.getItem(CONSENT_KEY) !== "1") return;
  } catch (e) {
    return;
  }

  var keyId = "";
  var pageType = "worksheet";
  try {
    var metaKey = document.querySelector('meta[name="cce-key-id"]');
    var metaPage = document.querySelector('meta[name="cce-page-type"]');
    if (metaKey) keyId = metaKey.getAttribute("content") || "";
    if (metaPage) pageType = metaPage.getAttribute("content") || "worksheet";
  } catch (e) {}

  // 沒有 keyId 從 URL 推導：.../packages/level-iv/1.1-IV/worksheet.html
  if (!keyId) {
    try {
      var m = location.pathname.match(/\/(\d+\.\d+-[IVX]+)\//);
      if (m) keyId = m[1];
    } catch (e) {}
  }

  var uuid;
  try {
    uuid = localStorage.getItem(UUID_KEY);
    if (!uuid) {
      uuid = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : "anon-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(UUID_KEY, uuid);
    }
  } catch (e) {
    uuid = "anon";
  }

  var sessionId = "";
  try {
    sessionId = sessionStorage.getItem("cce_session_id") || "";
    if (!sessionId) {
      sessionId = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID().slice(0, 8)
        : "s" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("cce_session_id", sessionId);
    }
  } catch (e) {}

  var refHost = "";
  try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  var screenW = (window.screen && window.screen.width) || 0;

  function send(event, meta) {
    try {
      var payload = JSON.stringify({
        uuid: uuid,
        event: event,
        resource: keyId,
        meta: Object.assign({ pageType: pageType, sid: sessionId, ref: refHost, sw: screenW }, meta || {}),
        userAgent: navigator.userAgent,
      });
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
        navigator.sendBeacon(TRACK_URL, blob);
      } else {
        fetch(TRACK_URL, {
          method: "POST",
          body: payload,
          keepalive: true,
          mode: "no-cors",
        });
      }
    } catch (e) {}
  }

  // 載入事件
  send(pageType === "ppt" ? "ppt_view" : "worksheet_view");

  // 只有 worksheet 才追蹤點擊
  if (pageType === "worksheet") {
    // 防抖：500ms 內同一個元素只送一次
    var lastTarget = null;
    var lastTime = 0;
    document.addEventListener(
      "click",
      function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        var el = t.closest("button, [data-track], input[type=checkbox], input[type=radio], a");
        if (!el) return;
        var now = Date.now();
        if (el === lastTarget && now - lastTime < 500) return;
        lastTarget = el;
        lastTime = now;
        var label =
          (el.dataset && el.dataset.track) ||
          el.getAttribute("aria-label") ||
          (el.textContent || "").trim().slice(0, 50) ||
          el.tagName;
        send("worksheet_click", {
          label: label,
          id: el.id || null,
          tag: el.tagName,
        });
      },
      true
    );
  }

  // 頁面停留時間：離開時送出
  var pageLoadTime = Date.now();
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      var ms = Date.now() - pageLoadTime;
      if (ms > 1000) send("page_leave", { durationMs: ms });
    }
  });

  // 暴露給 worksheet 內手動呼叫
  window.cceTrack = send;
})();
