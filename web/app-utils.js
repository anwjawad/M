/* v0.1.0 — Replacement */
(function(){
  const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
  const nowISO = ()=> new Date().toISOString();

  async function fetchGAS(action, payload={}){
    if(!APP_CONFIG.gasUrl) throw new Error("GAS URL not configured");
    const body = JSON.stringify({action, payload, ts: nowISO(), v: APP_CONFIG.version});
    const ctl = new AbortController();
    const t = setTimeout(()=>ctl.abort(), APP_CONFIG.fetch.timeoutMs);
    const res = await fetch(APP_CONFIG.gasUrl, {
      method:"POST",
      headers: {"Content-Type": APP_CONFIG.fetch.contentType}, // text/plain to avoid preflight
      body,
      signal: ctl.signal,
      redirect: "follow",
      // لا نستخدم أي هيدرز مخصصة إضافية لتفادي CORS
    }).catch(e=>{ clearTimeout(t); throw e; });
    clearTimeout(t);
    const txt = await res.text();
    try{ return JSON.parse(txt); }catch{ throw new Error("Bad JSON from GAS"); }
  }

  function toast(msg, type="info", ms=2200){
    const wrap = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(()=>{ el.style.opacity = "0"; setTimeout(()=>wrap.removeChild(el), 300); }, ms);
  }

  function formatMoney(n){ return Number(n||0).toLocaleString(APP_CONFIG.locale, {minimumFractionDigits:2, maximumFractionDigits:2}); }

  // Offline queue via localStorage (خفيف)
  function queuePush(op){ 
    const q = JSON.parse(localStorage.getItem(APP_CONFIG.storage.queueKey) || "[]");
    q.push(Object.assign({id:crypto.randomUUID(), ts:Date.now()}, op));
    localStorage.setItem(APP_CONFIG.storage.queueKey, JSON.stringify(q));
  }
  function queueAll(){ return JSON.parse(localStorage.getItem(APP_CONFIG.storage.queueKey) || "[]"); }
  function queueClear(){ localStorage.setItem(APP_CONFIG.storage.queueKey, "[]"); }

  window.UT = { sleep, nowISO, fetchGAS, toast, formatMoney, queuePush, queueAll, queueClear };
})();
