/* ==========================================================================
   app-utils.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - أدوات عامة: شبكة (GAS fetch), تنبيهات (toasts), تنسيقات, طابور أوفلاين.
   - جميع النداءات الشبكية تُرسل text/plain لتقليل احتمالات CORS.
   - لا استخدام لـ console.log في النسخة النهائية حسب تعليماتك.
   ========================================================================== */

(function(){
  /* ======================= أدوات وقت/تنسيق ======================= */
  const sleep   = (ms)=> new Promise(r=>setTimeout(r, ms));
  const nowISO  = ()=> new Date().toISOString();
  const toNum   = (v)=> (v===""||v===null||v===undefined) ? 0 : Number(v);
  const fmtMoney= (n)=> Number(n||0).toLocaleString(APP_CONFIG.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ======================= Toast إشعارات ======================= */
  function toast(message, type="info", ms=2200){
    const wrap = document.getElementById("toasts");
    if(!wrap) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role","status");
    el.textContent = String(message||"");
    wrap.appendChild(el);
    // إزالة تلقائية
    setTimeout(()=>{ 
      el.style.opacity = "0";
      el.style.transform = "translateY(4px)";
      setTimeout(()=>{ try{ wrap.removeChild(el); }catch(_){/*ignore*/} }, 320);
    }, ms);
  }

  /* ======================= تخزين محلي مبسّط ======================= */
  function lsGet(key, fallback=null){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(_){ return fallback; }
  }
  function lsSet(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(_){}
  }
  function lsDel(key){ try{ localStorage.removeItem(key); }catch(_){ } }

  /* ======================= طابور أوفلاين (Queue) ======================= */
  function queueAll(){
    return lsGet(APP_CONFIG.storage.queueKey, []);
  }
  function queuePush(op){
    const item = Object.assign({ id: crypto.randomUUID(), ts: Date.now() }, op);
    const arr = queueAll();
    arr.push(item);
    lsSet(APP_CONFIG.storage.queueKey, arr);
    return item.id;
  }
  function queueReplaceAll(arr){
    lsSet(APP_CONFIG.storage.queueKey, Array.isArray(arr) ? arr : []);
  }
  function queueClear(){ lsSet(APP_CONFIG.storage.queueKey, []); }

  /* ============== شبكة: اتصال مع GAS Web App (CORS-Safe) ============== */
  /**
   * fetchGAS(action, payload)
   * - يرسل POST text/plain إلى APP_CONFIG.gasUrl.
   * - يعتمد مهلة timeoutMs وإلغاء عبر AbortController.
   * - يتوقع JSON { ok: true/false, ... } من GAS.
   */
  async function fetchGAS(action, payload={}){
    if(!APP_CONFIG.gasUrl) throw new Error("GAS URL not configured");
    const ctl = new AbortController();
    const timer = setTimeout(()=> ctl.abort(), APP_CONFIG.fetch.timeoutMs);

    // نرسل body كسلسلة JSON لكن الـ Content-Type يبقى text/plain
    const body = JSON.stringify({
      action,
      payload,
      ts: nowISO(),
      version: APP_CONFIG.version
    });

    let respText = "";
    try{
      const resp = await fetch(APP_CONFIG.gasUrl, {
        method: "POST",
        headers: { "Content-Type": APP_CONFIG.fetch.contentType }, // text/plain
        body,
        signal: ctl.signal,
        redirect: "follow",
        // لا نستخدم كستوم هيدرز إضافية → لتقليل preflight
      });
      respText = await resp.text();
    } finally {
      clearTimeout(timer);
    }

    try{
      const json = JSON.parse(respText);
      return json;
    }catch(_){
      throw new Error("Bad JSON from GAS");
    }
  }

  /* ======================= أدوات مساعدة متنوعة ======================= */
  function downloadTextFile(filename, text){
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(()=> URL.revokeObjectURL(a.href), 1000);
  }

  function uid(){ try{ return crypto.randomUUID(); }catch(_){ return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`; } }

  function isOnline(){ return navigator.onLine; }

  // تجميع عناصر بفواصل (مثلاً tags)
  function splitCSV(s){ return String(s||"").split(",").map(x=>x.trim()).filter(Boolean); }

  // تنسيق تاريخ بسيط YYYY-MM
  function ymFromDate(iso){
    if(!iso) return "";
    const d = new Date(iso);
    if(isNaN(d)) return String(iso).slice(0,7);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  }

  // Group By مساعد
  function groupBy(arr, key){
    return (arr||[]).reduce((acc, item)=>{
      const k = typeof key === "function" ? key(item) : item[key];
      acc[k] = acc[k] || [];
      acc[k].push(item);
      return acc;
    }, {});
  }

  /* ======================= تعريض واجهة عامة ======================= */
  window.UT = {
    // time/format
    sleep, nowISO, fmtMoney, toNum, ymFromDate,
    // toasts
    toast,
    // local storage
    lsGet, lsSet, lsDel,
    // queue
    queueAll, queuePush, queueReplaceAll, queueClear,
    // network
    fetchGAS,
    // misc
    downloadTextFile, uid, isOnline, splitCSV, groupBy
  };
})();
