/* ==========================================================================
   app-dom.js — مصروفي
   النسخة: v0.1.2
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  STATE.loadLocal();
  STATE.applyUIBoot();
  I18N.apply();

  const elTheme   = document.getElementById("pref-theme");
  const elTrans   = document.getElementById("pref-trans-speed");
  const elLang    = document.getElementById("pref-lang");
  if(elTheme) elTheme.value = STATE.S.ui.theme;
  if(elTrans) elTrans.value = STATE.S.ui.transitionMs;
  if(elLang)  elLang.value  = STATE.S.ui.locale;

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = {
    dashboard: document.getElementById("panel-dashboard"),
    transactions: document.getElementById("panel-transactions"),
    budgets: document.getElementById("panel-budgets"),
    subscriptions: document.getElementById("panel-subscriptions"),
    projects: document.getElementById("panel-projects"),
    reports: document.getElementById("panel-reports"),
    preferences: document.getElementById("panel-preferences")
  };

  function activateTab(id){
    // أغلق الكل أولًا
    Object.keys(panels).forEach(k => {
      if(panels[k]){
        panels[k].classList.remove("active");
      }
    });
    tabs.forEach(t => t.classList.remove("active"));

    // فعّل المطلوب
    const targetPanel = panels[id];
    const targetTab = tabs.find(t => t.dataset.tab === id);
    if(targetPanel) targetPanel.classList.add("active");
    if(targetTab) targetTab.classList.add("active");

    STATE.setActiveTab(id);
  }

  // تفعيل افتراضي مضمون
  let initial = STATE.S.ui.activeTab;
  if(!initial || !panels[initial]){
    initial = "dashboard";
  }
  activateTab(initial);

  tabs.forEach(btn=>{
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  /* ====== الإعدادات ====== */
  const dlgSettings = document.getElementById("dlg-settings");
  const btnSettings = document.getElementById("btn-settings");
  const btnSettingsSave = document.getElementById("btn-settings-save");
  const cfgGasUrl = document.getElementById("cfg-gas-url");

  btnSettings?.addEventListener("click", ()=>{
    if(cfgGasUrl) cfgGasUrl.value = APP_CONFIG.gasUrl || "";
    dlgSettings?.showModal();
  });

  btnSettingsSave?.addEventListener("click", ()=>{
    const url = (cfgGasUrl?.value || "").trim();
    if(url){
      APP_CONFIG.gasUrl = url;
      Config.set("gasUrl", url);
      UT.toast("Saved GAS URL ✅");
    } else {
      UT.toast("يرجى إدخال رابط GAS","error");
    }
  });

  /* ====== أزرار الرأس ====== */
  const btnSave   = document.getElementById("btn-save");
  const btnReset  = document.getElementById("btn-reset");
  const btnExport = document.getElementById("btn-export");
  const btnSync   = document.getElementById("btn-sync");

  btnSave?.addEventListener("click", async ()=>{
    if(window.APP_FORMS?.submitTxForm){
      await APP_FORMS.submitTxForm();
    }
  });

  btnReset?.addEventListener("click", ()=>{
    const ok = confirm("هل أنت متأكد من تهيئة البيانات محليًا؟ سيؤدي ذلك لمسح التخزين المحلي.");
    if(ok){
      localStorage.clear();
      location.reload();
    }
  });

  btnExport?.addEventListener("click", ()=>{
    const state = localStorage.getItem(APP_CONFIG.storage.localKey) || "{}";
    UT.downloadTextFile(`masrofi-export-${Date.now()}.json`, state);
  });

  btnSync?.addEventListener("click", async ()=>{
    if(window.APP_SYNC?.syncNow){
      await APP_SYNC.syncNow();
    }
  });

  /* ====== التفضيلات ====== */
  elTheme?.addEventListener("change", (e)=>{
    STATE.setTheme(e.target.value);
    UT.toast("تم تغيير الثيم");
  });
  elTrans?.addEventListener("input", (e)=>{
    STATE.setTransition(e.target.value);
  });
  elLang?.addEventListener("change", (e)=>{
    STATE.setLocale(e.target.value);
    UT.toast("تم تغيير اللغة");
  });

  /* ====== مودالات مختصرة ====== */
  document.getElementById("btn-new-account")?.addEventListener("click", ()=> document.getElementById("dlg-account")?.showModal());
  document.getElementById("btn-new-category")?.addEventListener("click", ()=> document.getElementById("dlg-category")?.showModal());

  /* ====== التقارير ====== */
  const btnRunReport = document.getElementById("btn-run-report");
  const inpMonth     = document.getElementById("report-month");
  btnRunReport?.addEventListener("click", ()=>{
    const m = inpMonth?.value || "";
    window.APP_REPORTS?.renderMonthly?.(m);
  });

  /* ====== تحميل المخطط والبيانات ====== */
  try{
    await STATE.loadSchema();
    STATE.bindInputToSchema();

    await APP_DATA?.bootstrapFromSchema?.();
    APP_DATA?.renderSelectors?.();
    APP_DATA?.renderDashboard?.();
    APP_DATA?.renderTables?.();
  }catch(_){
    UT.toast("تعذر تحميل المخطط","error");
  }

  /* ====== مزامنة عند الفتح (إن توفّر URL والاتصال) ====== */
  if(APP_CONFIG.gasUrl && UT.isOnline() && window.APP_SYNC?.syncNow){
    try{ await APP_SYNC.syncNow({silent:true}); }catch(_){}
  }

  /* ====== إغلاق المودالات بالنقر خارج الصندوق ====== */
  document.querySelectorAll("dialog").forEach(dlg=>{
    dlg.addEventListener("click", (e)=>{
      const rect = dlg.querySelector(".modal-box")?.getBoundingClientRect();
      if(!rect) return;
      if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom){
        dlg.close();
      }
    });
  });
});
