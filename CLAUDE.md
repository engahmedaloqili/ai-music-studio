# AI Music Studio

DAW مبسط بالعربية (RTL) مع مقامات شرقية، يعمل كتطبيق سطح مكتب عبر Electron.

## البنية
- `src/App.tsx` — كل واجهة الاستوديو (React + Tailwind v4 + Web Audio API). مكتوب كـ JS داخل ملف tsx؛ لا يوجد فحص أنواع (tsc) في البناء.
- `src/apiKey.js` — جلب مفتاح Gemini (env → localStorage → نافذة إدخال). لا تستخدم `window.prompt` لأنه لا يعمل في Electron.
- `electron/main.cjs` — نافذة التطبيق + التحديث التلقائي عبر `electron-updater` من GitHub Releases.
- `.github/workflows/release.yml` — يبني مثبّت ويندوز عند دفع وسم `v*`.
- مقاطع Python (FastAPI/MusicGen/Gemini) داخل App.tsx هي نصوص معروضة فقط، ولا يوجد خادم Python بعد.

## الأوامر
- `npm run electron:dev` تطوير مع إعادة تحميل فورية
- `npm start` بناء وتشغيل
- `npm run dist` مثبّت محلي في `release/`

## إصدار تحديث
ارفع `version` في package.json ثم: `git tag vX.Y.Z && git push --tags`.

## قواعد
- لا تضع مفاتيح API في الكود أو في git.
- حافظ على واجهة عربية واتجاه RTL.
