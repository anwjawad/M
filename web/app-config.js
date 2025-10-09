/* ==========================================================================
   app-config.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - تهيئة الإعدادات العامة للتطبيق (ثيم/لغة/سرعة الحركة/تخزين/شبكة).
   - متوافق مع GitHub Pages (روابط نسبية) وGAS Web App (بدون CORS).
   - يمكن تعديل القيم من شاشة Settings/Preferences.
   ========================================================================== */

(function initConfig(){
  // ملاحظة مهمة:
  // - سنستخدم Content-Type: text/plain لتقليل احتمالات CORS preflight.
  // - ضع رابط GAS Web App بعد النشر في الحقل gasUrl أدناه أو من نافذة Settings.
  // - كل المفاتيح تحفظ محليًا عند التعديل (localStorage).

  const DEFAULTS = {
    version: "v0.1.0",
    gasUrl: "",                // ضع هنا URL بعد نشر GAS كـ Web App (شرح في docs/SETUP.md)
    locale: "ar",              // ar | en | fr
    rtl: true,
    theme: "neon",             // neon | ocean | rose | mint
    transitionMs: 300,         // سرعة الحركة (تتحكم بها من Preferences)
    storage: {
      localKey: "masrofi.state.v1",
      queueKey: "masrofi.queue.v1",
      cfgKey:   "masrofi.cfg.v1"
    },
    fetch: {
      // مهم: نستخدم text/plain بدلاً من application/json لتفادي الـ preflight في أغلب الحالات
      contentType: "text/plain;charset=utf-8",
      timeoutMs: 20000
    },
    paths: {
      // جميع المسارات نسبية لتعمل على GitHub Pages:
      schemas: "../schemas/schema.json",
      assets:  "../assets/"
    }
  };

  // تحميل إعدادات محفوظة مسبقًا (إن وجدت)
  function loadSaved(){
    try{
      const raw = localStorage.getItem(DEFAULTS.storage.cfgKey);
      if(!raw) return {};
      return JSON.parse(raw) || {};
    }catch(_){ return {}; }
  }

  // دمج الإعدادات: المحفوظة ← الافتراضية
  const SAVED = loadSaved();
  const APP_CONFIG = Object.assign({}, DEFAULTS, SAVED);

  // تعريض الكائن عالميًا
  window.APP_CONFIG = APP_CONFIG;

  // أدوات مبسطة للتعامل مع الإعدادات (قراءة/تعديل/حفظ)
  window.Config = {
    get(key, fallback){
      try{
        return key.split(".").reduce((o,k)=> (o||{})[k], APP_CONFIG) ?? fallback;
      }catch(_){ return fallback; }
    },
    set(path, value){
      // يدعم path بشكل "a.b.c"
      const parts = path.split(".");
      let ref = APP_CONFIG;
      for(let i=0;i<parts.length-1;i++){
        const p = parts[i];
        if(typeof ref[p] !== "object" || ref[p] === null) ref[p] = {};
        ref = ref[p];
      }
      ref[parts[parts.length-1]] = value;
      this.save();
      return true;
    },
    save(){
      localStorage.setItem(APP_CONFIG.storage.cfgKey, JSON.stringify({
        version: APP_CONFIG.version,      // نحتفظ بالنسخة للمقارنة مستقبلًا
        gasUrl: APP_CONFIG.gasUrl,
        locale: APP_CONFIG.locale,
        rtl: APP_CONFIG.rtl,
        theme: APP_CONFIG.theme,
        transitionMs: APP_CONFIG.transitionMs,
        storage: APP_CONFIG.storage,
        fetch: APP_CONFIG.fetch,
        paths: APP_CONFIG.paths
      }));
    },
    reset(){
      localStorage.removeItem(APP_CONFIG.storage.cfgKey);
      // لا نعيد تحميل الصفحة هنا؛ يدار من زر Reset العام إن لزم
    }
  };

  // تهيئة DOM أولية: النسخة في الهيدر
  document.addEventListener("DOMContentLoaded", ()=>{
    const el = document.getElementById("app-version");
    if(el) el.textContent = APP_CONFIG.version;
  });
})();
