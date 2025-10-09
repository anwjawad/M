/* ==========================================================================
   app-forms.js — مصروفي
   النسخة: v0.1.2
   الغرض:
   - نموذج المعاملة (Transactions) بأسلوب step-based.
   - التحقق والحفظ المحلي + الطابور.
   - جديد: ضبط إشارة المبلغ تلقائيًا حسب نوع الفئة (expense → سالب، income → موجب).
   ========================================================================== */

window.APP_FORMS = (function(){
  /* ===================== عناصر النموذج ===================== */
  const formTx  = document.getElementById("form-tx");
  const btnNext = formTx?.querySelector('[data-action="next"]');
  const btnPrev = formTx?.querySelector('[data-action="prev"]');
  const steps   = formTx ? Array.from(formTx.querySelectorAll(".step")) : [];
  const selCat  = formTx?.querySelector("[data-bind='transactions.category_id']");
  const inpAmt  = formTx?.querySelector("[data-bind='transactions.amount']");
  let stepIndex = 0;

  function showStep(n){
    if(!steps.length) return;
    stepIndex = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, i)=> s.classList.toggle("active", i === stepIndex));
  }
  btnNext?.addEventListener("click", ()=> showStep(stepIndex + 1));
  btnPrev?.addEventListener("click", ()=> showStep(stepIndex - 1));

  /* ===================== مساعد: نوع الفئة من الحالة ===================== */
  function getCategoryById(id){
    return (STATE.S.data.categories || []).find(c => String(c.id) === String(id));
  }
  function normalizeAmountByCategory(amount, category_id){
    const cat = getCategoryById(category_id);
    const n = Number(amount || 0);
    if(!cat || isNaN(n)) return n;
    if(cat.type === "expense") return Math.abs(n) * -1; // إجبار سالب
    if(cat.type === "income")  return Math.abs(n);      // إجبار موجب
    return n;
  }

  // عند تغيير الفئة: طبّق الإشارة فورًا لو في مبلغ مكتوب
  selCat?.addEventListener("change", ()=>{
    if(!inpAmt) return;
    const raw = Number(inpAmt.value || 0);
    const adjusted = normalizeAmountByCategory(raw, selCat.value);
    if(!isNaN(adjusted) && adjusted !== raw){
      inpAmt.value = adjusted;
    }
  });

  // عند خروج المستخدم من خانة المبلغ: أعِد ضبط الإشارة حسب الفئة الحالية
  inpAmt?.addEventListener("blur", ()=>{
    if(!selCat) return;
    const raw = Number(inpAmt.value || 0);
    const adjusted = normalizeAmountByCategory(raw, selCat.value);
    if(!isNaN(adjusted) && adjusted !== raw){
      inpAmt.value = adjusted;
    }
  });

  /* ===================== جمع نموذج المعاملة ===================== */
  function collectTxModel(){
    // الثبات مضمون عبر data-bind="transactions.<field>"
    const model = {};
    if(!formTx) return model;
    formTx.querySelectorAll("[data-bind^='transactions.']").forEach(el=>{
      const [, field] = el.getAttribute("data-bind").split(".");
      let v = el.value;
      if(field === "amount"){ v = Number(v); }
      if(field === "tags"){ v = String(v||"").trim(); }
      model[field] = v;
    });
    if(!model.id) model.id = UT.uid();

    // ✨ ضبط الإشارة حسب نوع الفئة
    model.amount = normalizeAmountByCategory(model.amount, model.category_id);

    return model;
  }

  /* ===================== تحقق أساسي ===================== */
  function validateTx(model){
    if(!model.date) return "التاريخ مطلوب";
    if(!model.category_id) return "الفئة مطلوبة";
    if(model.amount === undefined || model.amount === null || isNaN(Number(model.amount))) return "المبلغ غير صالح";
    return null;
  }

  /* ===================== إعادة تعيين النموذج ===================== */
  function resetTxForm(){
    if(!formTx) return;
    formTx.reset?.();
    formTx.querySelectorAll("input[type='text'], input[type='number'], input[type='date']").forEach(i=> i.value = "");
    showStep(0);
  }

  /* ===================== تقديم النموذج ===================== */
  async function submitTxForm(){
    if(!formTx) return;
    const model = collectTxModel();
    const err = validateTx(model);
    if(err){ UT.toast(err, "error"); return; }

    const row = {
      id: model.id,
      date: model.date,
      account_id: model.account_id || "",
      category_id: model.category_id,
      amount: Number(model.amount||0), // أصبح مضبوط الإشارة مسبقًا
      note: model.note || "",
      tags: model.tags || "",
      is_recurring: model.is_recurring || "",
      receipt_url: model.receipt_url || "",
      project_id: model.project_id || ""
    };

    // حفظ محلي
    STATE.S.data.transactions.push(row);
    STATE.saveLocal();

    // صفّ العملية للكتابة الدُفعية
    UT.queuePush({ op:"insert", table:"transactions", rows:[ row ]});

    // تحديث العرض
    APP_DATA?.renderTables?.();
    APP_DATA?.renderDashboard?.();

    // إشعار نجاح + مزامنة تلقائية
    UT.toast("تم الحفظ محليًا ✅");
    document.dispatchEvent(new Event("data:changed"));

    // إعادة تعيين
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
