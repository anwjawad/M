/** ==========================================================================
 * Code.gs — مصروفي (Google Apps Script)
 * النسخة: v0.1.0
 * الغرض:
 * - نقطة دخول Web App (doGet/doPost) مع استجابات JSON (text/plain) لتفادي CORS.
 * - تهيئة المخطط ensureSchema() وإنشاء الأوراق/الهيدرات لكل جدول.
 * - عدم استخدام console.log في النسخة النهائية (التزام بتعليمات المشروع).
 * ============================================================================
 * تعليمات النشر:
 * - Deploy → New deployment → نوع Web app
 * - Execute as: Me
 * - Who has access: Anyone
 * - انسخ Web App URL وضعه في /web/app-config.js (أو من Settings داخل التطبيق).
 * ============================================================================
 */

/** أسماء أوراق مرجعية */
const META_NAME = "META";

/** تعريف المخطط (Headers) — يجب أن يتوافق مع /schemas/schema.json */
const SCHEMA_DEF = {
  version: "1.0",
  tables: {
    accounts:      ["id","name","type","currency","opening_balance"],
    categories:    ["id","name","type","parent_id"],
    transactions:  ["id","date","account_id","category_id","amount","note","tags","is_recurring","receipt_url","project_id"],
    budgets:       ["id","month","category_id","amount"],
    projects:      ["id","name","type"],
    subscriptions: ["id","name","amount","cycle","next_due"]
  }
};

/** ======= Utilities ======= */

/** إخراج JSON كنص (text/plain) لتقليل احتمالات CORS */
function jsonOut(obj, code) {
  var out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  // (معلومات الحالة HTTP لا تُضبط مباشرة عبر ContentService؛ نضمّن code في الجسم عند الحاجة)
  if (code) {
    var payload = JSON.stringify(Object.assign({}, obj, { code: code }));
    out = ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
  }
  return out;
}

/** قراءة جسم الطلب بأمان */
function readBody_(e) {
  try {
    if (e && e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
  } catch (_err) { /* تجاهل */ }
  return {};
}

/** إرجاع مرجع الشيت (Spreadsheet) النشط */
function ss_() {
  return SpreadsheetApp.getActive();
}

/** الحصول/إنشاء ورقة باسم محدد */
function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/** مقارنة مصفوفتين بسيطًا */
function arraysEqual_(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (String(a[i]) !== String(b[i])) return false;
  }
  return true;
}

/** ======= Web App Entrypoints ======= */

function doGet(e) {
  return jsonOut({ ok: true, ping: true, ts: new Date().toISOString(), version: SCHEMA_DEF.version });
}

function doPost(e) {
  try {
    var body = readBody_(e);
    var action = body.action;

    if (action === "ensureSchema") return ensureSchema();
    if (action === "readBatch")   return readBatch_(body.payload);
    if (action === "writeBatch")  return writeBatch_(body.payload);

    return jsonOut({ ok: false, error: "Unknown action" }, 400);
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) }, 500);
  }
}

/** ======= Schema Management ======= */

/**
 * ensureSchema:
 * - ينشئ ورقة META تحمل قائمة الجداول والأعمدة.
 * - ينشئ ورقة لكل جدول (إن لم تكن موجودة) ويضبط الصف الأول كهيدر مطابق للمخطط.
 * - إذا اختلف الهيدر، يُعاد بناؤه مع الحفاظ على ترتيب الأعمدة وفق المخطط.
 */
function ensureSchema() {
  var ss = ss_();

  // أنشئ/حدّث META
  var meta = getOrCreateSheet_(ss, META_NAME);
  meta.clear();

  // صف العناوين في META
  meta.getRange(1, 1, 1, 3).setValues([["table", "columns", "updated_at"]]);

  var tables = SCHEMA_DEF.tables;
  var keys = Object.keys(tables);

  // كتابة صف لكل جدول في META
  var rows = [];
  for (var i = 0; i < keys.length; i++) {
    var name = keys[i];
    var cols = tables[name];
    rows.push([name, cols.join(","), new Date()]);
  }
  if (rows.length) {
    meta.getRange(2, 1, rows.length, 3).setValues(rows);
  }

  // إنشاء وتثبيت هيدرات الجداول
  for (var j = 0; j < keys.length; j++) {
    var tName = keys[j];
    var colsArr = tables[tName];
    var sh = getOrCreateSheet_(ss, tName);

    var lastCol = Math.max(1, sh.getLastColumn());
    var currentHeader = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    // إذا الشيت جديد أو الرأس مختلف، نعيد بناء الهيدر
    if (currentHeader.length === 1 && currentHeader[0] === "" || !arraysEqual_(currentHeader.slice(0, colsArr.length), colsArr)) {
      sh.clear();
      sh.getRange(1, 1, 1, colsArr.length).setValues([colsArr]);
    }
  }

  return jsonOut({ ok: true, version: SCHEMA_DEF.version });
}

/** ======= Batch Read/Write ======= */

/**
 * readBatch_:
 * payload: { tables: ["accounts","categories",...] }
 * - يعيد كائن data يحوي مصفوفة كائنات لكل جدول.
 */
function readBatch_(payload) {
  var ss = ss_();
  var tables = (payload && payload.tables) || [];
  var out = {};

  for (var i = 0; i < tables.length; i++) {
    var name = tables[i];
    var sh = ss.getSheetByName(name);
    if (!sh) { out[name] = []; continue; }

    var lastRow = Math.max(1, sh.getLastRow());
    var lastCol = Math.max(1, sh.getLastColumn());
    var header = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    var values = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

    var list = [];
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      var obj = {};
      for (var c = 0; c < header.length; c++) {
        obj[header[c]] = row[c];
      }
      list.push(obj);
    }
    out[name] = list;
  }

  return jsonOut({ ok: true, data: out });
}

/**
 * writeBatch_:
 * payload: { rowsByTable: { "insert:transactions": [ {...}, ... ], "insert:accounts":[...] } }
 * - يدعم عملية "insert" فقط — حسب تعليمات المشروع.
 * - يكتب القيم وفق ترتيب الأعمدة المعرفة في SCHEMA_DEF.
 */
function writeBatch_(payload) {
  var ss = ss_();
  var grouped = (payload && payload.rowsByTable) || payload || {};
  var keys = Object.keys(grouped);

  for (var i = 0; i < keys.length; i++) {
    var opTable = keys[i]; // مثال: "insert:transactions"
    var parts = opTable.split(":");
    var op = parts[0];
    var name = parts[1];

    if (op !== "insert") {
      throw new Error("Unsupported op: " + op);
    }

    var sh = ss.getSheetByName(name);
    if (!sh) throw new Error("Sheet not found: " + name);

    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var rows = grouped[opTable];
    if (!rows || !rows.length) continue;

    // جهّز مصفوفة القيم بالترتيب الصحيح
    var values = [];
    for (var r = 0; r < rows.length; r++) {
      var obj = rows[r];
      var line = [];
      for (var c = 0; c < header.length; c++) {
        var col = header[c];
        line.push(obj.hasOwnProperty(col) ? obj[col] : "");
      }
      values.push(line);
    }

    if (values.length) {
      var startRow = sh.getLastRow() + 1;
      sh.getRange(startRow, 1, values.length, header.length).setValues(values);
    }
  }

  return jsonOut({ ok: true });
}
