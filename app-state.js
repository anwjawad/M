/* ==========================================================================
   app-state.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - إدارة حالة التطبيق في الذاكرة + الحفظ المحلي (localStorage).
   - تحميل المخطط (schema.json) كمصدر الحقيقة وربط الحقول بالواجهات.
   - ضمان ثبات الحقول بين التبويبات عبر data-bind = "<table>.<field>".
   - عدم تجاوز 1000 سطر — الملف مستقل وواضح.
   ========================================================================== */

(function(){
  // 1) الحالة العامة للتطبيق
  const S = {
    schema: null, // يُحمّل من /schemas/schema.json
    data: {
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      subscriptions: [],
      projects: []
    },
    ui: {
      activeTab: "dashboard",
      theme: Config.get("theme", APP_CONFIG.theme),
      transitionMs: Config.get("transitionMs", APP_CONFIG.transitionMs),
      locale: Config.get("locale", APP_CONFIG.locale)
    }
  };

  // 2) مفاتيح التخزين
  const K = {
    LOCAL: APP_CONFIG.storage.localKey
  };

  // 3) أدوات تخزين محلي
  function saveLocal(){
    const payload = {
      ver: APP_CONFIG.version,
      schema: S.schema,
      data: S.data,
      ui: S.ui
    };
    try{
      localStorage.setItem(K.LOCAL, JSON.stringify(payload));
    }catch(e){
      // لا نطبع console.log في الإصدار النهائي؛ فقط نتجاهل بهدوء.
    }
  }

  function loadLocal(){
    try{
      const raw = localStorage.getItem(K.LOCAL);
      if(!raw) return;
      const parsed = JSON.parse(raw);
      if(parsed?.schema) S.schema = parsed.schema;
      if(parsed?.data)   S.data   = Object.assign(S.data, parsed.data);
      if(parsed?.ui)     S.ui     = Object.assign(S.ui, parsed.ui);
    }catch(_){ /* تجاهل */ }
  }

  // 4) ربط إدخالات DOM بالمخطط (ثبات الحقول)
  /**
   * يربط كل عنصر يملك data-bind="<table>.<field>" بحيث يتم
   * توثيق الجدول والحقل على العنصر نفسه لتفادي الالتباس بين التبويبات.
   */
  function bindInputToSchema(container = document){
    const bound = new Set();
    container.querySelectorAll("[data-bind]").forEach(el=>{
      const bind = el.getAttribute("data-bind");
      const [table, field] = String(bind).split(".");
      if(!table || !field) return;

      // ثبّت الميتاداتا على العنصر
      el.dataset.table = table;
      el.dataset.field = field;

      // منع تكرار المعالجة لنفس العقدة
      const key = `${table}.${field}:${el.tagName}:${el.name||""}:${el.id||""}`;
      if(bound.has(key)) return;
      bound.add(key);

      // عند التغيير، لا ننقل القيمة لأي عنصر آخر — فقط هذا الحقل
      // تُقرأ القيمة لاحقًا من APP_FORMS عند الإرسال.
      el.addEventListener("change", ()=>{
        // لا شيء فعلي هنا لضمان الثبات فقط؛ القراءة تتم لاحقًا.
      }, { passive: true });
    });
  }

  // 5) مساعد: تحميل المخطط (schema.json) من المسار النسبي
  async function loadSchema(){
    if(S.schema) return S.schema;
    const res = await fetch(APP_CONFIG.paths.schemas);
    const json = await res.json();
    S.schema = json;
    return S.schema;
  }

  // 6) مساعد: إسناد قيم UI (ثيم/لغة/سرعة حركة) عند بدأ التشغيل
  function applyUIBoot(){
    try{
      // ثيم
      document.body.classList.remove("theme-neon","theme-ocean","theme-rose","theme-mint");
      document.body.classList.add(`theme-${S.ui.theme}`);
      // سرعة الحركة
      document.documentElement.style.setProperty("--transition", `${S.ui.transitionMs}ms`);
      // لغة واتجاه
      APP_CONFIG.locale = S.ui.locale;
      APP_CONFIG.rtl    = (S.ui.locale === "ar");
      document.documentElement.dir = APP_CONFIG.rtl ? "rtl" : "ltr";
      document.body.style.direction = APP_CONFIG.rtl ? "rtl" : "ltr";
      // طبّق ترجمة أولية
      if(window.I18N && I18N.apply) I18N.apply();
      // نسخة التطبيق
      const verEl = document.getElementById("app-version");
      if(verEl) verEl.textContent = APP_CONFIG.version;
    }catch(_){ /* تجاهل */ }
  }

  // 7) نقاط تكامل مع واجهة التفضيلات لتحديث الحالة + الحفظ
  function setTheme(theme){
    S.ui.theme = theme;
    document.body.className = `theme-${theme} bg-base text-base-fg min-h-screen`;
    Config.set("theme", theme);
    saveLocal();
  }

  function setTransition(ms){
    S.ui.transitionMs = +ms || 300;
    document.documentElement.style.setProperty("--transition", `${S.ui.transitionMs}ms`);
    Config.set("transitionMs", S.ui.transitionMs);
    saveLocal();
  }

  function setLocale(lang){
    S.ui.locale = lang;
    APP_CONFIG.locale = lang;
    const rtl = (lang === "ar");
    APP_CONFIG.rtl = rtl;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.body.style.direction = rtl ? "rtl" : "ltr";
    if(window.I18N && I18N.apply) I18N.apply();
    Config.set("locale", lang);
    Config.set("rtl", rtl);
    saveLocal();
  }

  function setActiveTab(id){
    S.ui.activeTab = id;
    saveLocal();
  }

  // 8) تعريض واجهة STATE للاستخدام من بقية الوحدات
  window.STATE = {
    S,
    saveLocal,
    loadLocal,
    bindInputToSchema,
    loadSchema,
    applyUIBoot,
    setTheme,
    setTransition,
    setLocale,
    setActiveTab
  };

  // 9) تهيئة مبكرة (يتم استدعاؤها من app-dom عند DOMContentLoaded)
  //    ملاحظة: لا نبدأ أي عمليات Fetch هنا تجنبًا لتضارب الترتيب؛
  //    التحميل الفعلي للمخطط يحدث عندما تستدعيه app-dom.
})();
