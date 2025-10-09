/* v0.1.0 — Replacement */
window.APP_CONFIG = {
  version: "v0.1.0",
  gasUrl: "", // ضع هنا URL بعد نشر GAS كـ Web App (شرح في docs/SETUP.md)
  locale: "ar",
  rtl: true,
  theme: "neon",
  transitionMs: 300,
  storage: {
    localKey: "masrofi.state.v1",
    queueKey: "masrofi.queue.v1"
  },
  fetch: {
    // مهم: لتفادي CORS preflight نخلي المحتوى text/plain
    contentType: "text/plain;charset=utf-8",
    timeoutMs: 20000
  }
};
