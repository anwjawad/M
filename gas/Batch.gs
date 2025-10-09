/** ==========================================================================
 * Batch.gs — مصروفي (Google Apps Script)
 * النسخة: v0.1.0
 * الغرض:
 * - ملف مساعد اختياري لعمليات القراءة/الكتابة الدُفعية.
 * - ملاحظة هامة: تم تنفيذ الدوال الأساسية readBatch_ و writeBatch_ داخل Code.gs
 *   (بناءً على موافقتك السابقة) لتبسيط التدفق وتقليل التبعيات.
 * - هذا الملف يوفّر أدوات عامة يمكن استخدامها لاحقًا للتوسّع دون
 *   تكرار الدوال أو تضاربها مع Code.gs.
 * ============================================================================
 * إرشاد:
 * - لا تُعرِّف هنا دوالًا باسم readBatch_ أو writeBatch_ كي لا يحدث تضارب.
 * - استخدم الأدوات المساعدة أدناه إن رغبت بتطوير عمليات متقدمة لاحقًا
 *   (تصفية/ترقيم صفحات/تعديل/حذف/بحث... إلخ).
 * ============================================================================
 */

/** يحصل على مرجع الشيت النشط */
function _ss() { return SpreadsheetApp.getActive(); }

/** يعيد ورقة بالاسم أو ينشئها */
function _sheet(name) {
  var ss = _ss();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/** يقرأ الهيدر (الصف الأول) كمصفوفة أعمدة */
function _header(sh) {
  var lastCol = Math.max(1, sh.getLastColumn());
  return sh.getRange(1, 1, 1, lastCol).getValues()[0];
}

/** يحوّل نطاق بيانات إلى مصفوفة كائنات وفق الهيدر */
function _rowsAsObjects(sh) {
  var lastRow = Math.max(1, sh.getLastRow());
  var lastCol = Math.max(1, sh.getLastColumn());
  var head = _header(sh);
  if (lastRow <= 1) return [];
  var values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r], obj = {};
    for (var c = 0; c < head.length; c++) obj[head[c]] = row[c];
    out.push(obj);
  }
  return out;
}

/** يكتب صفوفًا (مصفوفة كائنات) وفق ترتيب الهيدر */
function _appendObjects(sh, objects) {
  if (!objects || !objects.length) return 0;
  var head = _header(sh);
  var values = [];
  for (var i = 0; i < objects.length; i++) {
    var obj = objects[i], line = [];
    for (var c = 0; c < head.length; c++) {
      var col = head[c];
      line.push(obj.hasOwnProperty(col) ? obj[col] : "");
    }
    values.push(line);
  }
  if (values.length) {
    var startRow = sh.getLastRow() + 1;
    sh.getRange(startRow, 1, values.length, head.length).setValues(values);
  }
  return values.length;
}

/** قراءة عامة لورقة باسم محدد (مصفوفة كائنات) */
function readSheetObjects(name) {
  var sh = _sheet(name);
  return _rowsAsObjects(sh);
}

/** كتابة عامة (إلحاق) لورقة باسم محدد (مصفوفة كائنات) */
function appendSheetObjects(name, objects) {
  var sh = _sheet(name);
  return _appendObjects(sh, objects);
}

/** مثال مساعد للتقسيم إلى صفحات (Pagination) — غير مستخدم افتراضيًا */
function readSheetPage(name, page, pageSize) {
  page = Math.max(1, Math.floor(page || 1));
  pageSize = Math.max(1, Math.floor(pageSize || 50));

  var sh = _sheet(name);
  var head = _header(sh);
  var lastRow = Math.max(1, sh.getLastRow());
  var total = Math.max(0, lastRow - 1);
  if (total === 0) {
    return { header: head, rows: [], page: page, pageSize: pageSize, total: 0, pages: 0 };
  }

  var pages = Math.ceil(total / pageSize);
  if (page > pages) page = pages;

  var startOffset = (page - 1) * pageSize;
  var take = Math.min(pageSize, total - startOffset);
  var values = sh.getRange(2 + startOffset, 1, take, head.length).getValues();

  var rows = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r], obj = {};
    for (var c = 0; c < head.length; c++) obj[head[c]] = row[c];
    rows.push(obj);
  }

  return { header: head, rows: rows, page: page, pageSize: pageSize, total: total, pages: pages };
}

/** دالة مساعدة لاستبدال قيم فارغة بسلسلة فارغة */
function _sanitizeObj(obj) {
  var out = {};
  for (var k in obj) {
    if (!obj.hasOwnProperty(k)) continue;
    var v = obj[k];
    out[k] = (v === null || v === undefined) ? "" : v;
  }
  return out;
}

/** لاحقًا: يمكن إضافة أدوات تعديل/حذف حسب الهوية (id) إن رغبت */
