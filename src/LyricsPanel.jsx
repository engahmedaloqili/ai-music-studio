import React, { useRef, useState } from 'react';
import { Sparkles, Music, Wand2, Link2, Eraser, AlignRight, Disc3, Download } from 'lucide-react';
import {
  SECTION_TYPES,
  DIALECTS,
  parseLyrics,
  serializeLyrics,
  tagForType,
  syllabify,
  linesOf,
} from './lyrics';
import { LYRIA_MODELS } from './lyria';

// ==========================================
// تبويب الكلمات: مربع واحد للكلمات مع وسوم الأقسام + أدوات Gemini + الربط باللحن + التحويل لأغنية
// ==========================================

const typeKeys = Object.keys(SECTION_TYPES);

export default function LyricsPanel({
  lyrics,
  setLyrics,
  melodicTracks,
  scaleName,
  bpm,
  regionStart,
  defaultStyle,
  askGemini,
  onLinkLine,
  onClearTrackLyrics,
  onGenerateSong,
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState({});
  const [rhymes, setRhymes] = useState({});
  const [songModel, setSongModel] = useState('lyria-3.5');
  const [song, setSong] = useState(null);
  const textRef = useRef(null);

  const parts = parseLyrics(lyrics.text || '');
  const update = (patch) => setLyrics((l) => ({ ...l, ...patch }));
  const setParts = (next) => update({ text: serializeLyrics(next) });
  const updatePart = (idx, patch) => setParts(parts.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const context = () =>
    `اللهجة: ${DIALECTS[lyrics.dialect]}. المقام الموسيقي الحالي: ${scaleName}. السرعة: ${bpm} BPM. عنوان الأغنية: ${lyrics.title}. الموضوع: ${lyrics.topic || 'غير محدد'}.`;

  const run = async (key, fn) => {
    setBusy(key);
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setMessage(`⚠️ ${e.message || 'تعذر الاتصال بـ Gemini'}`);
    }
    setBusy('');
  };

  // إدراج وسم قسم عند مكان المؤشر
  const insertTag = (type) => {
    if (!type) return;
    const el = textRef.current;
    const text = lyrics.text || '';
    const pos = el ? el.selectionStart : text.length;
    const before = text.slice(0, pos).replace(/\s*$/, '');
    const after = text.slice(pos).replace(/^\s*/, '');
    const tag = `[${SECTION_TYPES[type].name}]`;
    const next = `${before}${before ? '\n\n' : ''}${tag}\n${after}`;
    update({ text: next });
    setTimeout(() => {
      if (!el) return;
      const caret = (before ? before.length + 2 : 0) + tag.length + 1;
      el.focus();
      el.setSelectionRange(caret, caret);
    }, 0);
  };

  // ترتيب النص: كل وسم في سطر، وكل ".." يصير سطراً جديداً
  const formatText = () =>
    setParts(parts.map((p) => ({ ...p, body: linesOf(p.body).join('\n') })));

  const writeSong = () =>
    run('song', async () => {
      if (lyrics.text.trim() && !window.confirm('سيتم استبدال الكلمات الحالية بأغنية جديدة. متابعة؟')) return;
      const names = typeKeys.map((k) => `[${SECTION_TYPES[k].name}]`).join('، ');
      const res = await askGemini(
        `أنت شاعر غنائي محترف. اكتب كلمات أغنية قابلة للتلحين بأسطر قصيرة متقاربة الوزن وقافية واضحة. ${context()}
اكتب الأغنية نصاً واحداً، وقبل كل قسم ضع وسماً بين قوسين مربعين من هذه الوسوم: ${names} (ويمكن إضافة رقم مثل [كوبليه 2]). كل سطر في سطر مستقل.`,
        lyrics.topic ? `اكتب أغنية عن: ${lyrics.topic}` : 'اكتب أغنية عاطفية مناسبة للمقام',
        {
          type: 'OBJECT',
          properties: { title: { type: 'STRING' }, lyrics: { type: 'STRING' }, explanation_ar: { type: 'STRING' } },
          required: ['lyrics'],
        }
      );
      update({ title: res.title || lyrics.title, text: serializeLyrics(parseLyrics(res.lyrics)) });
      setMessage(res.explanation_ar || 'تمت كتابة الأغنية ✅');
    });

  const editPart = (idx, preset) =>
    run(`edit-${idx}`, async () => {
      const part = parts[idx];
      const instruction = preset || instructions[idx] || 'حسّن الوزن والقافية مع الحفاظ على المعنى';
      const res = await askGemini(
        `أنت شاعر غنائي ومحرر كلمات. عدّل الجزء المعطى حسب طلب المستخدم وأرجع النص الجديد فقط (بدون وسم القسم)، كل سطر في سطر مستقل. ${context()}`,
        `القسم: ${part.tag || 'بدون اسم'}\nالنص الحالي:\n${part.body || '(فارغ - اكتب نصاً جديداً)'}\n\nالمطلوب: ${instruction}`,
        { type: 'OBJECT', properties: { text: { type: 'STRING' }, explanation_ar: { type: 'STRING' } }, required: ['text'] }
      );
      updatePart(idx, { body: res.text.replace(/^\s*\[[^\]]+\]\s*/, '').trim() });
      setMessage(res.explanation_ar || 'تم التعديل ✅');
    });

  const suggestRhymes = (idx) =>
    run(`rhyme-${idx}`, async () => {
      const res = await askGemini(
        `أنت خبير قوافي. اقترح 10 كلمات تصلح قافية لهذا المقطع الغنائي، باللهجة المطلوبة. ${context()}`,
        parts[idx].body || lyrics.topic || 'أغنية حب',
        { type: 'OBJECT', properties: { rhymes: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['rhymes'] }
      );
      setRhymes((r) => ({ ...r, [idx]: res.rhymes }));
    });

  const linkLine = (line, mode, key) => run(key, async () => setMessage(await onLinkLine(line, mode)));

  const makeSong = () =>
    run('lyria', async () => {
      if (!lyrics.text.trim()) throw new Error('اكتب الكلمات أولاً');
      if (song?.url) URL.revokeObjectURL(song.url);
      setSong(null);
      const result = await onGenerateSong(songModel, lyrics.style || defaultStyle);
      setSong(result);
      setMessage(result.message);
    });

  const inputCls = 'bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500';
  const smallBtn = 'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition disabled:opacity-50';
  const card = 'bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl';

  return (
    <div className="flex flex-col gap-4">
      {/* بيانات الأغنية */}
      <div className={`${card} space-y-3`}>
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold">كلمات الأغنية</h3>
          <span className="text-[10px] text-slate-500 mr-auto">تنحفظ تلقائياً على جهازك</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">العنوان</span>
            <input className={inputCls} value={lyrics.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">اللهجة</span>
            <select className={inputCls} value={lyrics.dialect} onChange={(e) => update({ dialect: e.target.value })}>
              {Object.entries(DIALECTS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-400">مسار الغناء (للربط باللحن)</span>
            <select className={inputCls} value={lyrics.vocalTrackId || ''} onChange={(e) => update({ vocalTrackId: e.target.value || null })}>
              <option value="">— اختر آلة تمثل لحن الغناء —</option>
              {melodicTracks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">موضوع الأغنية وفكرتها</span>
          <input className={inputCls} placeholder="مثال: الحنين للوطن، أو أغنية فرح لعرس..." value={lyrics.topic} onChange={(e) => update({ topic: e.target.value })} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={writeSong} disabled={!!busy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold disabled:opacity-60">
            <Sparkles className="w-3.5 h-3.5" />
            {busy === 'song' ? 'Gemini يكتب...' : 'اكتب لي أغنية كاملة (Gemini)'}
          </button>
          {lyrics.vocalTrackId && (
            <button onClick={() => onClearTrackLyrics(lyrics.vocalTrackId)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs border border-slate-700">
              <Eraser className="w-3.5 h-3.5" /> مسح الكلمات من المسار
            </button>
          )}
        </div>
        {message && <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 whitespace-pre-line">{message}</p>}
      </div>

      {/* مربع الكلمات الواحد */}
      <div className={`${card} space-y-2.5`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-200">النص الكامل</span>
          <select value="" onChange={(e) => insertTag(e.target.value)} className={`${inputCls} font-bold`}>
            <option value="">+ إدراج قسم عند المؤشر...</option>
            {typeKeys.map((k) => (
              <option key={k} value={k}>{SECTION_TYPES[k].name}</option>
            ))}
          </select>
          <button onClick={formatText} className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700`} title="يضع كل قسم في سطر، ويحوّل .. إلى سطر جديد">
            <AlignRight className="w-3 h-3" /> ترتيب النص
          </button>
          <span className="text-[10px] text-slate-500 mr-auto">{parts.length} جزء</span>
        </div>
        <textarea
          ref={textRef}
          dir="auto"
          rows={14}
          value={lyrics.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={'الصق أو اكتب الكلمات هنا. ضع اسم القسم بين قوسين قبل كل جزء، مثل:\n\n[المذهب]\nيا ليل طوّل يا ليل\n\n[كوبليه]\nعيونك نور دربي'}
          className="w-full bg-[#0b0f19] text-sm leading-7 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 resize-y"
        />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          الوسوم بالعربي أو الإنجليزي تنفهم: [المذهب] [كوبليه 2] [كورس] [جسر] [قفلة] أو [Verse] [Chorus] [Bridge]. والفاصل ".." يعتبر سطراً جديداً.
        </p>
      </div>

      {/* الأجزاء المكتشفة */}
      {parts.map((part, idx) => {
        const lines = linesOf(part.body);
        return (
          <div key={idx} className={`${card} space-y-2.5`}>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${inputCls} font-bold`}
                value={part.type || ''}
                onChange={(e) => updatePart(idx, { tag: e.target.value ? tagForType(e.target.value, part.tag || '') : null, type: e.target.value || null })}
              >
                {!part.type && <option value="">بدون قسم — اختر النوع</option>}
                {typeKeys.map((k) => (
                  <option key={k} value={k}>{SECTION_TYPES[k].name}</option>
                ))}
              </select>
              {part.tag && <span className="text-[11px] font-mono text-violet-300">[{part.tag}]</span>}
              <span className="text-[10px] text-slate-500 mr-auto">{lines.length} سطر</span>
            </div>

            {lines.length > 0 ? (
              <div className="space-y-1">
                {lines.map((line, li) => {
                  const syl = syllabify(line);
                  const key = `${idx}-${li}`;
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-950/50 rounded-md px-2 py-1">
                      <span className="font-mono text-violet-300 w-14 shrink-0">{syl.length} مقطع</span>
                      <span className="text-slate-200 flex-1 min-w-[8rem] truncate" title={syl.join(' · ')}>{line}</span>
                      <button disabled={!lyrics.vocalTrackId || !!busy} onClick={() => linkLine(line, 'local', `link-${key}`)} className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700`} title="توزيع المقاطع على نغمات مسار الغناء">
                        <Link2 className="w-3 h-3" /> ربط باللحن
                      </button>
                      <button disabled={!lyrics.vocalTrackId || !!busy} onClick={() => linkLine(line, 'ai', `ai-${key}`)} className={`${smallBtn} bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 border border-violet-500/30`}>
                        <Sparkles className="w-3 h-3" /> {busy === `ai-${key}` ? '...' : 'لحّن بـ Gemini'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">هذا الجزء فارغ.</p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                className={`${inputCls} flex-1 min-w-[10rem]`}
                placeholder="اطلب تعديل لهذا الجزء: خلّها أحزن، غيّر القافية..."
                value={instructions[idx] || ''}
                onChange={(e) => setInstructions((s) => ({ ...s, [idx]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && editPart(idx)}
              />
              <button onClick={() => editPart(idx)} disabled={!!busy} className={`${smallBtn} bg-violet-500 text-white hover:bg-violet-400`}>
                <Wand2 className="w-3 h-3" /> {busy === `edit-${idx}` ? '...' : 'عدّل بـ Gemini'}
              </button>
              <button onClick={() => editPart(idx, 'اضبط الوزن بحيث تتقارب أعداد المقاطع بين الأسطر، مع الحفاظ على المعنى والقافية')} disabled={!!busy} className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>
                ضبط الوزن
              </button>
              <button onClick={() => suggestRhymes(idx)} disabled={!!busy} className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700`}>
                {busy === `rhyme-${idx}` ? '...' : 'اقترح قوافي'}
              </button>
            </div>
            {rhymes[idx] && (
              <div className="flex flex-wrap gap-1.5">
                {rhymes[idx].map((r, i) => (
                  <span key={i} className="text-[11px] bg-violet-500/10 text-violet-200 border border-violet-500/20 rounded-full px-2 py-0.5">{r}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* تحويل الكلمات إلى أغنية مغنّاة */}
      <div className={`${card} space-y-3 border-amber-500/30`}>
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold">حوّل الكلمات لأغنية مغنّاة (Google Lyria)</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          يرسل الكلمات مع الأسلوب والمقام لنموذج Lyria، ويرجع أغنية كاملة بصوت مغني وموسيقى. تنضاف كمسار صوتي تقدر تعدّل عليه وتحفظها.
          يستخدم نفس مفتاح Gemini، ويحتاج تفعيل الفوترة في Google AI Studio (تكلفة بسيطة لكل أغنية).
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">الأسلوب الموسيقي (بالعربي أو الإنجليزي)</span>
          <input className={inputCls} placeholder={defaultStyle} value={lyrics.style || ''} onChange={(e) => update({ style: e.target.value })} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select className={inputCls} value={songModel} onChange={(e) => setSongModel(e.target.value)}>
            {Object.entries(LYRIA_MODELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={makeSong} disabled={!!busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-60">
            <Disc3 className={`w-4 h-4 ${busy === 'lyria' ? 'animate-spin' : ''}`} />
            {busy === 'lyria' ? 'جاري توليد الأغنية... (قد يأخذ دقيقة أو أكثر)' : 'حوّلها لأغنية 🎤'}
          </button>
        </div>
        {song?.url && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 rounded-lg p-2.5">
            <audio controls src={song.url} className="h-9 flex-1 min-w-[14rem]" />
            <a href={song.url} download={`${lyrics.title || 'song'}.mp3`} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
              <Download className="w-3.5 h-3.5" /> حفظ الملف
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
