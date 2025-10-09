/* ==========================================================================
   app-dom.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - تهيئة الواجهة وربط أحداث DOM بدون منطق أعمال.
   - تبويب/لوحات، إعدادات/تفضيلات، حفظ/تصدير/مزامنة، تحميل المخطط وربط الحقول.
   - تحديث ديناميكي دون إعادة تحميل الصفحة، ودعم RTL.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  /* ===================== تهيئة الحالة والواجهة ===================== */
  STATE.loadLocal();
  STATE.applyUIBoot();
  I18N.apply();

  // تفعيل قيمة عناصر التفضيلات من الحالة
  const elTheme   = document.getElementById("pref-theme");
  const elTrans   = document.getElementById("pref-trans-speed");
  const elLang    = document.getElementById("pref-lang");
  if(elTheme) elTheme.value = STATE.S.ui.theme;
  if(elTrans) elTrans.value = STATE.S.ui.transitionMs;
  if(elLang)  elLang.value  = STATE.S.ui.locale;

  /* ===================== التبويبات واللوحات ===================== */
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
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
    Object.keys(panels).forEach(k => panels[k]?.classList.toggle("active", k === id));
    STATE.setActiveTab(id);
  }

  // إعادة تفعيل آخر تبويب محفوظ
  if(STATE.S.ui.activeTab && panels[STATE.S.ui.activeTab]){
    activateTab(STATE.S.ui.activeTab);
  }

  tabs.forEach(btn=>{
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.tab);
    });
  });

  /* ===================== نافذة الإعدادات ===================== */
  const dlgSettings = document.getElementById("dlg-settings");
  const btnSettings = document.getElementById("btn-settings");
  const btnSettingsSave = document.getElementById("btn-settings-save");
  const cfgGasUrl = document.getElementById("cfg-gas-url");

  if(btnSettings){
    btnSettings.addEventListener("click", ()=>{
      if(cfgGasUrl) cfgGasUrl.value = APP_CONFIG.gasUrl || "";
      dlgSettings?.showModal();
    });
  }

  if(btnSettingsSave){
    btnSettingsSave.addEventListener("click", ()=>{
      const url = (cfgGasUrl?.value || "").trim();
      if(url){
        APP_CONFIG.gasUrl = url;
        Config.set("gasUrl", url);
        UT.toast("Saved GAS URL ✅");
      } else {
        UT.toast("يرجى إدخال رابط GAS","error");
      }
    });
  }

  /* ===================== أزرار الرأس: حفظ/تهيئة/تصدير/مزامنة ===================== */
  const btnSave   = document.getElementById("btn-save");
  const btnReset  = document.getElementById("btn-reset");
  const btnExport = document.getElementById("btn-export");
  const btnSync   = document.getElementById("btn-sync");

  if(btnSave){
    btnSave.addEventListener("click", async ()=>{
      if(window.APP_FORMS && APP_FORMS.submitTxForm){
        await APP_FORMS.submitTxForm();
      }
    });
  }

  if(btnReset){
    btnReset.addEventListener("click", ()=>{
      const ok = confirm("هل أنت متأكد من تهيئة البيانات محليًا؟ سيؤدي ذلك لمسح التخزين المحلي.");
      if(ok){
        localStorage.clear();
        location.reload();
      }
    });
  }

  if(btnExport){
    btnExport.addEventListener("click", ()=>{
      const state = localStorage.getItem(APP_CONFIG.storage.localKey) || "{}";
      UT.downloadTextFile(`masrofi-export-${Date.now()}.json`, state);
    });
  }

  if(btnSync){
    btnSync.addEventListener("click", async ()=>{
      if(window.APP_SYNC && APP_SYNC.syncNow){
        await APP_SYNC.syncNow();
      }
    });
  }

  /* ===================== تفضيلات: ثيم/سرعة/لغة ===================== */
  if(elTheme){
    elTheme.addEventListener("change", (e)=>{
      STATE.setTheme(e.target.value);
      UT.toast("تم تغيير الثيم");
    });
  }
  if(elTrans){
    elTrans.addEventListener("input", (e)=>{
      STATE.setTransition(e.target.value);
    });
  }
  if(elLang){
    elLang.addEventListener("change", (e)=>{
      STATE.setLocale(e.target.value);
      UT.toast("تم تغيير اللغة");
    });
  }

  /* ===================== أزرار إدارة الحسابات/الفئات (فتح المودالات) ===================== */
  const btnNewAcc = document.getElementById("btn-new-account");
  const btnNewCat = document.getElementById("btn-new-category");
  btnNewAcc?.addEventListener("click", ()=> document.getElementById("dlg-account")?.showModal());
  btnNewCat?.addEventListener("click", ()=> document.getElementById("dlg-category")?.showModal());

  /* ===================== التقارير: تشغيل تقرير شهري ===================== */
  const btnRunReport = document.getElementById("btn-run-report");
  const inpMonth     = document.getElementById("report-month");
  btnRunReport?.addEventListener("click", ()=>{
    const m = inpMonth?.value || ""; // "YYYY-MM" أو فارغ لعرض الكل
    if(window.APP_REPORTS && APP_REPORTS.renderMonthly){
      APP_REPORTS.renderMonthly(m);
    }
  });

  /* ===================== تحميل المخطط وربط الحقول ===================== */
  // حمّل schema.json → ثبّت الربط → Bootstrap من Seeds → املأ القوائم → اعرض
  try{
    await STATE.loadSchema();
    STATE.bindInputToSchema();

    if(window.APP_DATA && APP_DATA.bootstrapFromSchema){
      await APP_DATA.bootstrapFromSchema();
    }
    if(window.APP_DATA && APP_DATA.renderSelectors){
      APP_DATA.renderSelectors();
    }
    if(window.APP_DATA && APP_DATA.renderDashboard){
      APP_DATA.renderDashboard();
    }
    if(window.APP_DATA && APP_DATA.renderTables){
      APP_DATA.renderTables();
    }
  }catch(_){
    UT.toast("تعذر تحميل المخطط","error");
  }

  /* ===================== مزامنة عند فتح التطبيق (عند توفر URL والاتصال) ===================== */
  if(APP_CONFIG.gasUrl && UT.isOnline() && window.APP_SYNC && APP_SYNC.syncNow){
    try{
      await APP_SYNC.syncNow();
    }catch(_){
      // نتجاهل الخطأ هنا؛ يمكن للمستخدم تشغيل Sync يدويًا
    }
  }

  /* ===================== تحسينات صغيرة ===================== */
  // إغلاق المودالات عند النقر خارج الصندوق (لـ <dialog>)
  document.querySelectorAll("dialog").forEach(dlg=>{
    dlg.addEventListener("click", (e)=>{
      const rect = dlg.querySelector(".modal-box")?.getBoundingClientRect();
      if(!rect) return;
      const x = e.clientX, y = e.clientY;
      if(x < rect.left || x > rect.right || y < rect.top || y > rect.bottom){
        dlg.close();
      }
    });
  });
});
