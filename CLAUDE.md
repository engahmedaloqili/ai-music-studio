# AI Music Studio

DAW مبسط بالعربية (RTL) مع مقامات شرقية، يعمل كتطبيق سطح مكتب عبر Electron.

## البنية
- `src/App.tsx` — كل واجهة الاستوديو (React + Tailwind v4 + Web Audio API). مكتوب كـ JS داخل ملف tsx؛ لا يوجد فحص أنواع (tsc) في البناء.
- `src/musicLibrary.js` — كل المقامات/السلالم (SCALES) والآلات (INSTRUMENT_PRESETS) وأصوات الإيقاع (DRUM_VOICES)، مقسمة حسب GROUPS (شرقي/غربي/لاتيني/عالمي). الإضافة هنا تظهر تلقائياً في الواجهة وفي قوائم Gemini.
  - آلة نغمية جديدة = عنصر مع `patch` (موجتان + فلتر + غلاف + اهتزاز). آلة إيقاع = عنصر مع `kit` (8 أصوات). الآلات الأصلية (oud, qanun, nay, strings, bass, synth) صوتها مبرمج يدوياً داخل `triggerInstrumentNote` في App.tsx.
- `src/audioClips.js` + `src/AudioClipLane.jsx` — استيراد مقاطع صوتية كمسارات (`track.kind === 'audio'`, بياناتها في `track.clip`). الـ AudioBuffer محفوظ في `audioBuffersRef` (خارج الـ state). الواجهة RTL: الخطوة 0 على اليمين.
- `src/vocalFx.js` — مؤثرات المقاطع (`clip.fx`): طبقة بدون تغيير السرعة (WSOLA + إعادة عيّنة، معالجة مسبقة ومخزنة في `entry.cache`)، EQ، ضاغط، تدبيل، إيكو، صدى قاعة، وقوالب جاهزة.
- `src/recorder.js` — تسجيل المايك (MediaRecorder). صلاحية المايك فقط مسموحة في `electron/main.cjs`.
- `src/lyria.js` — تحويل الكلمات لأغنية مغنّاة عبر Lyria (`lyria-3.5` / `lyria-3-clip-preview`) على Interactions API بنفس مفتاح Gemini. ترويسة `Api-Revision` ممنوعة بـ CORS، لذلك الطلب يمر عبر `electron/preload.cjs` → `ipcMain` في main.cjs؛ وفي المتصفح يُرسل بدونها.
- `src/aceStep.js` + `src/SongEditor.jsx` — تعديل الأغنية جزء جزء عبر ACE-Step على fal.ai (مفتاح منفصل `FAL_API_KEY`): توليد (`fal-ai/ace-step`)، إعادة غناء مقطع زمني (`audio-inpaint` بـ start/end بالثواني)، تغيير الكلمات بنفس اللحن أو إعادة توزيع (`audio-to-audio` بـ edit_mode). الطلب `POST https://fal.run/<model>` بترويسة `Authorization: Key ...`. الملفات غير المولّدة على fal تُرفع أولاً (storage/upload/initiate ثم PUT). كل تعديل يحفظ النسخة السابقة في `entry.history` للتراجع، وبيانات الأغنية في `clip.ace` {url, tags, lyrics, seed}.
- `src/lyrics.js` + `src/LyricsPanel.jsx` — تبويب الكلمات: نص واحد (`lyrics.text`) مقسّم بوسوم مثل [المذهب] أو [Verse 2] (تُحلّل بـ `parseLyrics`)، و".." فاصل أسطر، لهجات، تقطيع مقاطع تقريبي (أو يدوي بالشرطة)، وربط المقاطع بخطوات مسار الغناء (`track.lyrics` مصفوفة 32). الكلمات تنحفظ في localStorage. Gemini يكتب/يعدّل/يقترح قوافي/يلحّن سطراً عبر `askGeminiJSON` في App.tsx.
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
