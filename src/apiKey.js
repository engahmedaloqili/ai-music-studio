// مفاتيح الخدمات الخارجية
// الأولوية: ملف .env ← التخزين المحلي ← نافذة إدخال تظهر مرة واحدة.
// ملاحظة: window.prompt غير مدعوم داخل Electron، لذلك نستخدم نافذة HTML بسيطة.

const KEYS = {
  gemini: {
    storage: 'GEMINI_API_KEY',
    env: import.meta.env.VITE_GEMINI_API_KEY,
    title: 'مفتاح Gemini API',
    hint: 'يُحفظ على هذا الجهاز فقط. احصل عليه من aistudio.google.com/apikey',
    placeholder: 'AIza...',
  },
  fal: {
    storage: 'FAL_API_KEY',
    env: import.meta.env.VITE_FAL_KEY,
    title: 'مفتاح fal.ai (لـ ACE-Step)',
    hint: 'يُحفظ على هذا الجهاز فقط. أنشئ مفتاحاً من fal.ai/dashboard/keys (الاستخدام مدفوع حسب كل طلب).',
    placeholder: 'xxxxxxxx-xxxx:xxxxxxxx',
  },
};

function askForKey({ title, hint, placeholder }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.dir = 'rtl';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:inherit';
    overlay.innerHTML = `
      <div style="background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:16px;padding:24px;width:min(440px,90vw)">
        <h3 style="margin:0 0 8px;font-size:18px"></h3>
        <p style="margin:0 0 16px;font-size:13px;color:#94a3b8"></p>
        <input type="password" style="width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #475569;background:#020617;color:#e2e8f0" />
        <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-start">
          <button data-ok style="padding:8px 16px;border-radius:8px;border:0;background:#f59e0b;color:#000;cursor:pointer">حفظ</button>
          <button data-cancel style="padding:8px 16px;border-radius:8px;border:1px solid #475569;background:transparent;color:#e2e8f0;cursor:pointer">إلغاء</button>
        </div>
      </div>`;
    overlay.querySelector('h3').textContent = title;
    overlay.querySelector('p').textContent = hint;
    const input = overlay.querySelector('input');
    input.placeholder = placeholder;
    const done = (value) => {
      overlay.remove();
      resolve(value);
    };
    overlay.querySelector('[data-ok]').onclick = () => done(input.value.trim());
    overlay.querySelector('[data-cancel]').onclick = () => done('');
    input.onkeydown = (e) => {
      if (e.key === 'Enter') done(input.value.trim());
      if (e.key === 'Escape') done('');
    };
    document.body.appendChild(overlay);
    input.focus();
  });
}

async function getKey(name) {
  const cfg = KEYS[name];
  let key = cfg.env || localStorage.getItem(cfg.storage) || '';
  if (!key) {
    key = await askForKey(cfg);
    if (key) localStorage.setItem(cfg.storage, key);
  }
  return key;
}

export const getGeminiApiKey = () => getKey('gemini');
export const clearGeminiApiKey = () => localStorage.removeItem(KEYS.gemini.storage);
export const getFalApiKey = () => getKey('fal');
export const clearFalApiKey = () => localStorage.removeItem(KEYS.fal.storage);
