/* v0.1.0 — Replacement */
(function(){
  const dict = {
    ar: {
      save:"حفظ", reset:"تهيئة", sync:"مزامنة", export:"تصدير", cancel:"إلغاء",
      prev:"السابق", next:"التالي", settings:"الإعدادات", execAs:"وضع التنفيذ",
      tab:{dashboard:"لوحة التحكم", transactions:"الحركات", budgets:"الميزانية", subscriptions:"الاشتراكات", projects:"المشاريع", reports:"التقارير", preferences:"التفضيلات"},
      kpi:{netIncome:"صافي الدخل", savingsRate:"نسبة الادخار", burnRate:"معدل الاستهلاك", fixedShare:"ثابت %"},
      recentActivity:"النشاط الأخير", date:"التاريخ", account:"المحفظة", category:"الفئة", amount:"المبلغ", note:"ملاحظة", project:"المشروع",
      budgets:"الميزانية", subscriptions:"الاشتراكات", projects:"المشاريع", reports:"التقارير", reportRange:"نطاق التقرير", run:"تشغيل",
      theme:"الثيم", transitionSpeed:"سرعة الحركة", language:"اللغة"
    },
    en: {
      save:"Save", reset:"Reset", sync:"Sync", export:"Export", cancel:"Cancel",
      prev:"Prev", next:"Next", settings:"Settings", execAs:"Execute as",
      tab:{dashboard:"Dashboard", transactions:"Transactions", budgets:"Budgets", subscriptions:"Subscriptions", projects:"Projects", reports:"Reports", preferences:"Preferences"},
      kpi:{netIncome:"Net Income", savingsRate:"Savings Rate", burnRate:"Burn Rate", fixedShare:"Fixed %"},
      recentActivity:"Recent Activity", date:"Date", account:"Account", category:"Category", amount:"Amount", note:"Note", project:"Project",
      budgets:"Budgets", subscriptions:"Subscriptions", projects:"Projects", reports:"Reports", reportRange:"Report Range", run:"Run",
      theme:"Theme", transitionSpeed:"Transition Speed", language:"Language"
    },
    fr: {
      save:"Enregistrer", reset:"Réinitialiser", sync:"Sync", export:"Exporter", cancel:"Annuler",
      prev:"Préc.", next:"Suiv.", settings:"Paramètres", execAs:"Exécuter en tant que",
      tab:{dashboard:"Tableau", transactions:"Transactions", budgets:"Budgets", subscriptions:"Abonnements", projects:"Projets", reports:"Rapports", preferences:"Préférences"},
      kpi:{netIncome:"Revenu net", savingsRate:"Taux d'épargne", burnRate:"Burn Rate", fixedShare:"Fixe %"},
      recentActivity:"Activité récente", date:"Date", account:"Compte", category:"Catégorie", amount:"Montant", note:"Note", project:"Projet",
      budgets:"Budgets", subscriptions:"Abonnements", projects:"Projets", reports:"Rapports", reportRange:"Plage du rapport", run:"Exécuter",
      theme:"Thème", transitionSpeed:"Vitesse de transition", language:"Langue"
    }
  };
  window.I18N = {
    t: (key)=> key.split('.').reduce((o,k)=> (o||{})[k], dict[APP_CONFIG.locale]) || key,
    apply: ()=>{
      document.querySelectorAll("[data-i18n]").forEach(el=>{
        const key = el.getAttribute("data-i18n");
        el.textContent = I18N.t(key);
      });
      document.documentElement.dir = APP_CONFIG.rtl ? "rtl" : "ltr";
    }
  };
})();
