/* ==========================================================================
   app-modals.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - إدارة مودالات إنشاء الحسابات والفئات فقط (بدون منطق عرض الجداول).
   - حفظ محلي + دفع للأوفلاين كيو (Bulk Insert) بما يتوافق مع GAS.
   - الحفاظ على ثبات الحقول وربط القوائم مباشرة بعد الإضافة.
   ========================================================================== */

(function(){
  /* ===================== عناصر DOM للمودالات ===================== */
  const dlgAcc = document.getElementById("dlg-account");
  const dlgCat = document.getElementById("dlg-category");

  const accName = document.getElementById("acc-name");
  const accType = document.getElementById("acc-type");
  const accCur  = document.getElementById("acc-cur");
  const accOpen = document.getElementById("acc-open");
  const btnAccSave = document.getElementById("btn-acc-save");

  const catName = document.getElementById("cat-name");
  const catType = document.getElementById("cat-type");
  const catParent = document.getElementById("cat-parent");
  const btnCatSave = document.getElementById("btn-cat-save");

  /* ===================== أدوات محلية ===================== */
  function resetAccModal(){
    if(!dlgAcc) return;
    accName.value = "";
    accType.value = "cash";
    accCur.value = "ILS";
    accOpen.value = "0";
  }
  function resetCatModal(){
    if(!dlgCat) return;
    catName.value = "";
    catType.value = "income";
    catParent.value = "";
  }

  function ensureString(v){ return (v===undefined||v===null) ? "" : String(v); }
  function ensureNumber(v){ const n = Number(v||0); return isNaN(n) ? 0 : n; }

  /* ===================== حفظ حساب جديد ===================== */
  btnAccSave?.addEventListener("click", ()=>{
    const obj = {
      id: UT.uid(),
      name: ensureString(accName.value).trim(),
      type: ensureString(accType.value).trim() || "cash",
      currency: ensureString(accCur.value).trim() || "ILS",
      opening_balance: ensureNumber(accOpen.value)
    };

    if(!obj.name){
      UT.toast("اسم الحساب مطلوب","error");
      return;
    }

    // أضف للحالة المحلية
    STATE.S.data.accounts.push(obj);
    STATE.saveLocal();

    // أضف للطابور للكتابة الدُفعية
    UT.queuePush({ op:"insert", table:"accounts", rows:[ obj ] });

    // حدّث القوائم
    if(window.APP_DATA && APP_DATA.renderSelectors){
      APP_DATA.renderSelectors();
    }

    dlgAcc?.close();
    UT.toast("تم إضافة الحساب ✅");
    resetAccModal();
  });

  /* ===================== حفظ فئة جديدة ===================== */
  btnCatSave?.addEventListener("click", ()=>{
    const obj = {
      id: UT.uid(),
      name: ensureString(catName.value).trim(),
      type: ensureString(catType.value).trim() || "income",
      parent_id: ensureString(catParent.value).trim()
    };

    if(!obj.name){
      UT.toast("اسم الفئة مطلوب","error");
      return;
    }

    STATE.S.data.categories.push(obj);
    STATE.saveLocal();

    UT.queuePush({ op:"insert", table:"categories", rows:[ obj ] });

    if(window.APP_DATA && APP_DATA.renderSelectors){
      APP_DATA.renderSelectors();
    }

    dlgCat?.close();
    UT.toast("تم إضافة الفئة ✅");
    resetCatModal();
  });

  /* ===================== إغلاق بالنقر خارج الصندوق (احتياط) ===================== */
  [dlgAcc, dlgCat].forEach(dlg=>{
    if(!dlg) return;
    dlg.addEventListener("click", (e)=>{
      const box = dlg.querySelector(".modal-box");
      if(!box) return;
      const r = box.getBoundingClientRect();
      if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
        dlg.close();
      }
    });
  });
})();
