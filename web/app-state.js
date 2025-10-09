/* v0.1.0 — Replacement */
(function(){
  const S = {
    schema: null,         // loaded from /schemas/schema.json
    data: {               // in-memory state
      accounts:[], categories:[], transactions:[], budgets:[], subscriptions:[], projects:[]
    },
    ui: {
      activeTab: "dashboard",
      theme: APP_CONFIG.theme,
      transitionMs: APP_CONFIG.transitionMs,
      locale: APP_CONFIG.locale
    }
  };

  function saveLocal(){
    const payload = { schema:S.schema, data:S.data, ui:S.ui, ver:APP_CONFIG.version };
    localStorage.setItem(APP_CONFIG.storage.localKey, JSON.stringify(payload));
  }
  function loadLocal(){
    const raw = localStorage.getItem(APP_CONFIG.storage.localKey);
    if(!raw) return;
    try{ 
      const parsed = JSON.parse(raw);
      if(parsed?.schema) S.schema = parsed.schema;
      if(parsed?.data) S.data = parsed.data;
      if(parsed?.ui) S.ui = Object.assign(S.ui, parsed.ui);
    }catch(_){}
  }

  function bindInputToSchema(container=document){
    // ثابت: كل input لديه data-bind = "<table>.<field>"
    container.querySelectorAll("[data-bind]").forEach(el=>{
      const [table, field] = el.getAttribute("data-bind").split(".");
      el.addEventListener("change", (e)=>{
        el.dataset.table = table; el.dataset.field = field; // ثبات
      });
    });
  }

  window.STATE = {
    S, saveLocal, loadLocal, bindInputToSchema
  };
})();
