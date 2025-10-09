/* v0.1.0 — Replacement */
window.APP_FORMS = (function(){
  const formTx = document.getElementById("form-tx");
  const steps = formTx.querySelectorAll(".step");
  let stepIndex = 0;

  formTx.querySelector('[data-action="next"]').addEventListener("click", ()=> setStep(stepIndex+1));
  formTx.querySelector('[data-action="prev"]').addEventListener("click", ()=> setStep(stepIndex-1));

  function setStep(n){
    stepIndex = Math.max(0, Math.min(steps.length-1, n));
    steps.forEach((s,i)=> s.classList.toggle("active", i===stepIndex));
  }

  formTx.addEventListener("submit", async (e)=>{
    e.preventDefault();
    await submitTxForm();
  });

  async function submitTxForm(){
    // اجمع الحقول حسب schema ثابت
    const model = {};
    formTx.querySelectorAll("[data-bind^='transactions.']").forEach(el=>{
      const [,field] = el.getAttribute("data-bind").split(".");
      model[field] = el.value;
    });
    // تحقق بسيط
    if(!model.date || !model.category_id || !model.amount){
      UT.toast("حقول ناقصة","error"); return;
    }
    // اضف للذاكرة ثم صفّ للدُفعات
    STATE.S.data.transactions.push(Object.assign({id:crypto.randomUUID()}, model));
    STATE.saveLocal();
    UT.queuePush({op:"insert", table:"transactions", rows:[model]});
    APP_DATA.renderTables();
    APP_DATA.renderDashboard();
    UT.toast("تم الحفظ محليًا ✅");
  }

  return { submitTxForm };
})();
