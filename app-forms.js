/* ==========================================================================
   app-forms.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - إدارة نماذج الإدخال (حاليًا: معاملات Transactions) بأسلوب step-based.
   - التحقق (Validation) الخفيف قبل الحفظ.
   - دفع العملية إلى الطابور الأوفلاين ثم تحديث العرض.
   - فصل منطق الأعمال عن DOM بقدر الممكن (يبقى الربط هنا فقط).
   ========================================================================== */

window.APP_FORMS = (function(){
  /* ===================== عناصر النموذج ===================== */
  const formTx  = document.getElementById("form-tx");
  const btnNext = formTx?.querySelector('[data-action="next"]');
  const btnPrev = formTx?.querySelector('[data-action="prev"]');
  const steps   = formTx ? Array.from(formTx.querySelectorAll(".step")) : [];
  let stepIndex = 0;

  function showStep(n){
    if(!steps.length) return;
    stepIndex = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, i)=> s.classList.toggle("active", i === stepIndex));
  }

  btnNext?.addEventListener("click", ()=> showStep(stepIndex + 1));
  btnPrev?.addEventListener("click", ()=> showStep(stepIndex - 1));

  /* ===================== جمع نموذج المعاملة ===================== */
  function collectTxModel(){
    // الثبات مضمون عبر data-bind="transactions.<field>"
    const model = {};
    formTx.querySelectorAll("[data-bind^='transactions.']").forEach(el=>{
      const [, field] = el.getAttribute("data-bind").split(".");
      let v = el.value;
      // تنميط مبسط
      if(field === "amount"){ v = Number(v); }
      if(field === "tags"){ v = String(v||"").trim(); }
      model[field] = v;
    });
    // إضافة id إن لم يوجد
    if(!model.id) model.id = UT.uid();
    return model;
  }

  /* ===================== تحقق أساسي ===================== */
  function validateTx(model){
    // حقول مطلوبة: date, category_id, amount
    if(!model.date) return "التاريخ مطلوب";
    if(!model.category_id) return "الفئة مطلوبة";
    if(model.amount === undefined || model.amount === null || isNaN(Number(model.amount))) return "المبلغ غير صالح";
    return null; // صالح
  }

  /* ===================== إعادة تعيين النموذج ===================== */
  function resetTxForm(){
    formTx.reset?.();
    // أبقِ القوائم كما هي؛ فقط أفرغ حقول النص/الأرقام
    formTx.querySelectorAll("input[type='text'], input[type='number'], input[type='date']").forEach(i=> i.value = "");
    showStep(0);
  }

  /* ===================== تقديم النموذج ===================== */
  async function submitTxForm(){
    if(!formTx) return;
    // اجمع
    const model = collectTxModel();
    // تحقق
    const err = validateTx(model);
    if(err){ UT.toast(err, "error"); return; }

    // ضف محليًا (in-memory + localStorage)
    STATE.S.data.transactions.push({
      id: model.id,
      date: model.date,
      account_id: model.account_id || "",
      category_id: model.category_id,
      amount: Number(model.amount||0),
      note: model.note || "",
      tags: model.tags || "",
      is_recurring: model.is_recurring || "",
      receipt_url: model.receipt_url || "",
      project_id: model.project_id || ""
    });
    STATE.saveLocal();

    // صفّ العملية للكتابة على Google Sheets (batch insert: transactions)
    UT.queuePush({ op:"insert", table:"transactions", rows:[
      {
        id: model.id,
        date: model.date,
        account_id: model.account_id || "",
        category_id: model.category_id,
        amount: Number(model.amount||0),
        note: model.note || "",
        tags: model.tags || "",
        is_recurring: model.is_recurring || "",
        receipt_url: model.receipt_url || "",
        project_id: model.project_id || ""
      }
    ]});

    // تحديث العرض
    if(window.APP_DATA){
      APP_DATA.renderTables?.();
      APP_DATA.renderDashboard?.();
    }

    // رسالة نجاح وإعادة التعيين
    UT.toast("تم الحفظ محليًا ✅");
    resetTxForm();
  }

  /* ===================== ربط إرسال النموذج ===================== */
  formTx?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    await submitTxForm();
  });

  // واجهة عامة
  return { submitTxForm, resetTxForm };
})();
