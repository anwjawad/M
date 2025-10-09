# SCHEMA (v1.0)
هذا المستند يعرّف **مصدر الحقيقة** لهيكل بيانات التطبيق، وكيفية ربط الحقول بواجهات الإدخال، بما يضمن **ثبات الحقول** وعدم اختلاطها بين التبويبات. يجب أن يتطابق هذا مع محتوى `../schemas/schema.json` ومع رؤوس أوراق Google Sheets التي ينشئها GAS عبر `ensureSchema()`.

---

## الجداول والحقول

> كل ورقة في Google Sheets تحمل اسم جدول، والصف الأول فيها هو رؤوس الأعمدة **بالترتيب الثابت** أدناه.

### `accounts`
- `id` — معرف الحساب (UUID).
- `name` — اسم الحساب (Cash/Card/Bank/Wallet..).
- `type` — نوع الحساب: `cash | card | bank | wallet`.
- `currency` — العملة (مثال: `ILS`).
- `opening_balance` — الرصيد الافتتاحي (Number).

### `categories`
- `id` — معرف الفئة.
- `name` — اسم الفئة.
- `type` — `income | expense`.
- `parent_id` — فئة أصل (اختياري).

### `transactions`
- `id`
- `date` — بتنسيق ISO `YYYY-MM-DD`.
- `account_id`
- `category_id`
- `amount` — موجب للدخل، سالب للمصروف.
- `note`
- `tags` — نص حر أو CSV صغير.
- `is_recurring` — علم منطقي أو نصي (اختياري).
- `receipt_url` — رابط مرفق (اختياري).
- `project_id`

### `budgets`
- `id`
- `month` — `YYYY-MM`.
- `category_id`
- `amount`

### `projects`
- `id`
- `name`
- `type` — `personal | business`.

### `subscriptions`
- `id`
- `name`
- `amount` — عادةً قيمة سلبية شهرية.
- `cycle` — `M | Y | W`… إلخ.
- `next_due` — تاريخ الفاتورة التالية (اختياري).

---

## الربط مع واجهة المستخدم (Bindings)

في عناصر HTML الخاصة بالإدخال نستخدم خاصية:
data-bind="<table>.<field>"

أمثلة من `index.html`:
- حقل التاريخ: `data-bind="transactions.date"`
- اختيار المحفظة: `data-bind="transactions.account_id"`
- اختيار الفئة: `data-bind="transactions.category_id"`
- المبلغ: `data-bind="transactions.amount"`
- الملاحظة: `data-bind="transactions.note"`
- المشروع: `data-bind="transactions.project_id"`
- الوسوم: `data-bind="transactions.tags"`

> هذا يضمن عدم تغيّر الربط حتى عند تبديل التبويبات/الخطوات؛ فالقراءة/الكتابة تتم دائمًا وفق نفس الجدول/الحقل.

---

## القيود (Constraints)

- `transactions.date` — **مطلوب**، صيغة تاريخ صحيحة.
- `transactions.category_id` — **مطلوب**.
- `transactions.amount` — **مطلوب**، رقم (يمكن أن يكون سالبًا للمصروف).
- توحيد العملات مسؤولية الحساب/الإعدادات (لا تحويل تلقائي الآن).

---

## البيانات الأولية (Seeds)

موجودة داخل `../schemas/schema.json` تحت المفتاح `seeds`:
- حسابات أساسية: Cash / Card.
- فئات شائعة: Salary / Freelance / Grocery / Rent / Utilities… إلخ.
- مشاريع: Personal / Photography / Streaming.
- اشتراكات: Adobe CC / ChatGPT Plus (قيم افتراضية قابلة للتعديل).

يتم حقن الـ Seeds محليًا عند أول تشغيل عبر `APP_DATA.bootstrapFromSchema()` **فقط في حال كانت البيانات فارغة**، ثم يمكن مزامنتها لاحقًا مع Google Sheets (اختياري).

---

## تدفق البيانات

1. **Ensure Schema (GAS):**  
   عند الضغط على **Sync** يستدعي العميل `ensureSchema()` لإنشاء/تحديث أوراق الجداول ورؤوس الأعمدة.

2. **Queue → WriteBatch (Client → GAS):**  
   أي حفظ محلي يضيف عملية إلى طابور أوفلاين (`localStorage`). عند المزامنة تُجمع العمليات في دفعات حسب الجدول والعملية (مثل `"insert:transactions"`) وترسل دفعة واحدة إلى `writeBatch`.

3. **ReadBatch (GAS → Client):**  
   بعد الكتابة، يستدعي العميل `readBatch` لجلب نسخة حديثة من الجداول دفعة واحدة وتحديث الحالة المحلية.

> الاستجابات من GAS بصيغة JSON عبر `ContentService` وبـ `Content-Type: text/plain` لتجنّب مشاكل CORS مع GitHub Pages.

---

## أفضل الممارسات

- لا تضف أعمدة يدويًا داخل Google Sheets؛ استخدم `ensureSchema()`.
- لا تغيّر `data-bind` في HTML دون تحديث `schema.json`.
- لا تستخدم console.log في الإنتاج؛ استخدم التوستات للإشعار.
- الجداول الواسعة يجب أن تُعرض داخل حاويات `overflow-x:auto` (مطبّق في CSS).

---

## التعديلات المستقبلية

- دعم عمليات إضافية في GAS: تحديث/حذف حسب `id`.
- تعريف فئات “ثابتة” لحساب **Fixed %** في KPI.
- توسيع القيود (Validators) في الواجهة وفق `constraints`.

/schemas/schema.json ← المصدر الآلي

/docs/SCHEMA.md ← هذا التوثيق

/gas/Code.gs ← ensureSchema / readBatch_ / writeBatch_

/web/app-*.js ← المنطق والواجهة
