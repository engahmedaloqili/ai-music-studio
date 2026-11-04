# AI Music Studio 🎛️

استوديو إنتاج موسيقي مبسط (DAW) بالمقامات الشرقية، مدعوم بـ Gemini، ويعمل كتطبيق مستقل على سطح المكتب.

## المتطلبات
- [Node.js 22 LTS](https://nodejs.org)
- Git

## التشغيل لأول مرة
```bash
npm install
npm start
```

## أيقونة على سطح المكتب
**الطريقة 1 — مثبّت حقيقي (موصى بها):**
```bash
npm run dist
```
ثم شغّل الملف الناتج في مجلد `release/` — ينشئ أيقونة على سطح المكتب وفي قائمة ابدأ.

**الطريقة 2 — اختصار سريع لمجلد المشروع:**
```bash
powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1
```

لأيقونة مخصصة ضع صورة `build/icon.ico` (256×256) قبل البناء.

## مفتاح Gemini
عند أول طلب للذكاء الاصطناعي سيطلب التطبيق المفتاح ويحفظه محلياً. أو انسخ `.env.example` إلى `.env`.

## التحديثات
1. عدّل الكود (بنفسك أو بالوكيل).
2. ارفع رقم `version` في `package.json`.
3. ```bash
   git commit -am "وصف التحديث"
   git tag v1.0.1
   git push && git push --tags
   ```
GitHub Actions يبني المثبّت وينشره في Releases، والتطبيق المثبت يكتشف التحديث تلقائياً.
