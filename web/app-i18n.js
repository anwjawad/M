/* ==========================================================================
   app-i18n.js — مصروفي
   النسخة: v0.1.0
   الغرض:
   - إدارة تعدد اللغات (Arabic / English / French).
   - يتم تطبيق النصوص تلقائيًا على كل عنصر يحمل data-i18n.
   - التحكم بالاتجاه (RTL/LTR) بناءً على اللغة المختارة.
   ========================================================================== */

(function(){
  // القواميس الأساسية
  const DICTS = {
    ar: {
      save:"حفظ", reset:"تهيئة", sync:"مزامنة", export:"تصدير", cancel:"إلغاء",
      prev:"السابق", next:"التالي", settings:"الإعدادات", execAs:"التنفيذ كـ",
      newAccount:"+ حساب", newCategory:"+ فئة",
      tab:{dashboard:"لوحة التحكم", transactions:"الحركات", budgets:"الميزانية", subscriptions:"الاشتراكات", projects:"المشاريع", reports:"التقارير", preferences:"التفضيلات"},
      kpi:{netIncome:"صافي الدخل", savingsRate:"نسبة الادخار", burnRate:"معدل الاستهلاك", fixedShare:"نسبة الثابت"},
      recentActivity:"النشاط الأخير", date:"التاريخ", account:"المحفظة", category:"الفئة", amount:"المبلغ", note:"ملاحظة", project:"المشروع",
      budgets:"الميزانية", subscriptions:"الاشتراكات", projects:"المشاريع", reports:"التقارير", reportRange:"الفترة", run:"تشغيل",
      theme:"الثيم", transitionSpeed:"سرعة الحركة", language:"اللغة",
      name:"الاسم", type:"النوع", currency:"العملة", opening:"الرصيد الافتتاحي", parent:"الفئة الأصل"
    },
    en: {
      save:"Save", reset:"Reset", sync:"Sync", export:"Export", cancel:"Cancel",
      prev:"Prev", next:"Next", settings:"Settings", execAs:"Execute as",
      newAccount:"+ Account", newCategory:"+ Category",
      tab:{dashboard:"Dashboard", transactions:"Transactions", budgets:"Budgets", subscriptions:"Subscriptions", projects:"Projects", reports:"Reports", preferences:"Preferences"},
      kpi:{netIncome:"Net Income", savingsRate:"Savings Rate", burnRate:"Burn Rate", fixedShare:"Fixed %"},
      recentActivity:"Recent Activity", date:"Date", account:"Account", category:"Category", amount:"Amount", note:"Note", project:"Project",
      budgets:"Budgets", subscriptions:"Subscriptions", projects:"Projects", reports:"Reports", reportRange:"Report Range", run:"Run",
      theme:"Theme", transitionSpeed:"Transition Speed", language:"Language",
      name:"Name", type:"Type", currency:"Currency", opening:"Opening", parent:"Parent"
    },
    fr: {
      save:"Enregistrer", reset:"Réinit.", sync:"Sync", export:"Exporter", cancel:"Annuler",
      prev:"Préc.", next:"Suiv.", settings:"Paramètres", execAs:"Exécuter en tant que",
      newAccount:"+ Compte", newCategory:"+ Catégorie",
      tab:{dashboard:"Tableau", transactions:"Transactions", budgets:"Budgets", subscriptions:"Abonnements", projects:"Projets", reports:"Rapports", preferences:"Préférences"},
      kpi:{netIncome:"Revenu net", savingsRate:"Taux d'épargne", burnRate:"Taux de dépense", fixedShare:"Fixe %"},
      recentActivity:"Activité récente", date:"Date", account:"Compte", category:"Catégorie", amount:"Montant", note:"Note", project:"Projet",
      budgets:"Budgets", subscriptions:"Abonnements", projects:"Projets", reports:"Rapports", reportRange:"Période", run:"Exécuter",
      theme:"Thème", transitionSpeed:"Vitesse de transition", language:"Langue",
      name:"Nom", type:"Type", currency:"Devise", opening:"Solde initial", parent:"Parent"
    }
  };

  // دوال الخدمة
  const I18N = {
    /**
     * ترجم مفتاح (يدعم صيغة "tab.dashboard" مثلًا)
     */
    t(key){
      try{
        const dict = DICTS[APP_CONFIG.locale] || DICTS.en;
        return key.split('.').reduce((o,k)=> (o||{})[k], dict) || key;
      }catch(_){ return key; }
    },

    /**
     * تطبيق الترجمة على كل العناصر ذات data-i18n
     */
    apply(){
      const dict = DICTS[APP_CONFIG.locale] || DICTS.en;
      document.querySelectorAll("[data-i18n]").forEach(el=>{
        const key = el.getAttribute("data-i18n");
        el.textContent = I18N.t(key);
      });
      // تحديث الاتجاه
      const rtl = (APP_CONFIG.locale === "ar");
      APP_CONFIG.rtl = rtl;
      document.documentElement.dir = rtl ? "rtl" : "ltr";
      document.body.style.direction = rtl ? "rtl" : "ltr";
    },

    /**
     * تبديل اللغة مع الحفظ
     */
    switch(lang){
      if(!DICTS[lang]) return;
      APP_CONFIG.locale = lang;
      APP_CONFIG.rtl = (lang === "ar");
      Config.set("locale", lang);
      Config.set("rtl", APP_CONFIG.rtl);
      I18N.apply();
    },

    /**
     * استرجاع قائمة اللغات المدعومة
     */
    supported(){
      return Object.keys(DICTS);
    }
  };

  // تحميل الترجمة فورًا بعد DOM جاهز
  document.addEventListener("DOMContentLoaded", ()=>{
    I18N.apply();
  });

  // تعريضها للعالم
  window.I18N = I18N;
})();
