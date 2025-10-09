/* v0.1.0 — Replacement */
document.addEventListener("DOMContentLoaded", async () => {
  STATE.loadLocal();

  // Apply UI base
  document.body.classList.remove("theme-neon","theme-ocean","theme-rose","theme-mint");
  document.body.classList.add(`theme-${STATE.S.ui.theme}`);
  document.documentElement.style.setProperty("--transition", `${STATE.S.ui.transitionMs}ms`);
  document.getElementById("app-version").textContent = APP_CONFIG.version;
  I18N.apply();

  // Tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      btn.classList.add("active");
      const id = btn.dataset.tab;
      document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
      document.getElementById(`panel-${id}`).classList.add("active");
      STATE.S.ui.activeTab = id; STATE.saveLocal();
    });
  });

  // Settings modal
  const dlg = document.getElementById("dlg-settings");
  document.getElementById("btn-settings").addEventListener("click", ()=> dlg.showModal());
  document.getElementById("btn-settings-save").addEventListener("click", ()=>{
    const url = document.getElementById("cfg-gas-url").value.trim();
    if(url){ APP_CONFIG.gasUrl = url; UT.toast("Saved GAS URL ✅","success"); }
    STATE.saveLocal();
  });

  // Preferences
  document.getElementById("pref-theme").value = STATE.S.ui.theme;
  document.getElementById("pref-trans-speed").value = STATE.S.ui.transitionMs;
  document.getElementById("pref-lang").value = STATE.S.ui.locale;

  document.getElementById("pref-theme").addEventListener("change", (e)=>{
    STATE.S.ui.theme = e.target.value;
    document.body.className = `theme-${STATE.S.ui.theme} bg-base text-base-fg min-h-screen`;
    STATE.saveLocal();
  });
  document.getElementById("pref-trans-speed").addEventListener("input", (e)=>{
    STATE.S.ui.transitionMs = +e.target.value;
    document.documentElement.style.setProperty("--transition", `${STATE.S.ui.transitionMs}ms`);
    STATE.saveLocal();
  });
  document.getElementById("pref-lang").addEventListener("change", (e)=>{
    APP_CONFIG.locale = STATE.S.ui.locale = e.target.value;
    APP_CONFIG.rtl = e.target.value === "ar";
    I18N.apply(); STATE.saveLocal();
  });

  // Buttons
  document.getElementById("btn-save").addEventListener("click", async ()=>{
    await APP_FORMS.submitTxForm(); // يحفظ المعاملة الحالية (إن وجدت)
  });
  document.getElementById("btn-reset").addEventListener("click", ()=>{
    if(confirm("هل أنت متأكد من تهيئة البيانات محليًا؟")){ localStorage.clear(); location.reload(); }
  });
  document.getElementById("btn-export").addEventListener("click", ()=>{
    const blob = new Blob([localStorage.getItem(APP_CONFIG.storage.localKey) || "{}"], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `masrofi-export-${Date.now()}.json`; a.click();
  });
  document.getElementById("btn-sync").addEventListener("click", async ()=>{
    await APP_SYNC.syncNow();
  });

  // Load schema (مصدر الحقيقة للحقول)
  const schemaRes = await fetch("../schemas/schema.json");
  STATE.S.schema = await schemaRes.json();
  STATE.saveLocal();
  STATE.bindInputToSchema();

  // Initial render
  APP_DATA.renderDashboard();
  APP_DATA.renderTables();
});
