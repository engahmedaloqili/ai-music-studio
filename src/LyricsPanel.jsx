import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, ChevronUp, ChevronDown, Music, Wand2, Link2, Eraser } from 'lucide-react';
import { SECTION_TYPES, DIALECTS, newSection, syllabify, linesOf } from './lyrics';

// ==========================================
// تبويب الكلمات: أقسام الأغنية + مساعدة Gemini + ربط الأسطر باللحن
// ==========================================

const sectionKeys = Object.keys(SECTION_TYPES);

export default function LyricsPanel({
  lyrics,
  setLyrics,
  melodicTracks,
  scaleName,
  bpm,
  regionStart,
  askGemini,
  onLinkLine,
  onClearTrackLyrics,
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [instructions, setInstructions] = useState({});
  const [rhymes, setRhymes] = useState({});

  const update = (patch) => setLyrics((l) => ({ ...l, ...patch }));
  const updateSection = (id, patch) =>
    setLyrics((l) => ({ ...l, sections: l.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const moveSection = (idx, dir) =>
    setLyrics((l) => {
      const arr = [...l.sections];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return l;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...l, sections: arr };
    });

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

  // كتابة أغنية كاملة
  const writeSong = () =>
    run('song', async () => {
      const hasText = lyrics.sections.some((s) => s.text.trim());
      if (hasText && !window.confirm('سيتم استبدال الكلمات الحالية بأغنية جديدة. متابعة؟')) return;
      const res = await askGemini(
        `أنت شاعر غنائي محترف. اكتب كلمات أغنية قابلة للتلحين، بأسطر قصيرة متقاربة الوزن وقافية واضحة. ${context()}
استخدم أنواع الأقسام التالية فقط: ${sectionKeys.join(', ')}. كل قسم من 2 إلى 4 أسطر، والأسطر مفصولة بسطر جديد.`,
        lyrics.topic ? `اكتب أغنية عن: ${lyrics.topic}` : 'اكتب أغنية عاطفية مناسبة للمقام',
        {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            sections: {
              type: 'ARRAY',
              items: { type: 'OBJECT', properties: { type: { type: 'STRING', enum: sectionKeys }, text: { type: 'STRING' } }, required: ['type', 'text'] },
            },
            explanation_ar: { type: 'STRING' },
          },
          required: ['sections'],
        }
      );
      update({
        title: res.title || lyrics.title,
        sections: res.sections.map((s) => newSection(SECTION_TYPES[s.type] ? s.type : 'verse', s.text)),
      });
      setMessage(res.explanation_ar || 'تمت كتابة الأغنية ✅');
    });

  const editSection = (section, preset) =>
    run(`edit-${section.id}`, async () => {
      const instruction = preset || instructions[section.id] || 'حسّن الوزن والقافية مع الحفاظ على المعنى';
      const res = await askGemini(
        `أنت شاعر غنائي ومحرر كلمات. عدّل القسم المعطى حسب طلب المستخدم وأرجع النص الجديد فقط بنفس عدد الأسطر تقريباً. ${context()}`,
        `نوع القسم: ${SECTION_TYPES[section.type]}\nالنص الحالي:\n${section.text || '(فارغ - اكتب نصاً جديداً)'}\n\nالمطلوب: ${instruction}`,
        { type: 'OBJECT', properties: { text: { type: 'STRING' }, explanation_ar: { type: 'STRING' } }, required: ['text'] }
      );
      updateSection(section.id, { text: res.text });
      setMessage(res.explanation_ar || 'تم التعديل ✅');
    });

  const suggestRhymes = (section) =>
    run(`rhyme-${section.id}`, async () => {
      const res = await askGemini(
        `أنت خبير قوافي. اقترح 10 كلمات تصلح قافية لهذا المقطع الغنائي، باللهجة المطلوبة. ${context()}`,
        section.text || lyrics.topic || 'أغنية حب',
        { type: 'OBJECT', properties: { rhymes: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['rhymes'] }
      );
      setRhymes((r) => ({ ...r, [section.id]: res.rhymes }));
    });

  const linkLine = (line, mode, key) => run(key, async () => setMessage(await onLinkLine(line, mode)));

  const inputCls = 'bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500';
  const smallBtn = 'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition disabled:opacity-50';

  return (
    <div className="flex flex-col gap-4">
      {/* بيانات الأغنية */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
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
            <span className="text-[11px] text-slate-400">مسار الغناء (اللحن)</span>
            <select
              className={inputCls}
              value={lyrics.vocalTrackId || ''}
              onChange={(e) => update({ vocalTrackId: e.target.value || null })}
            >
              <option value="">— اختر آلة تمثل لحن الغناء —</option>
              {melodicTracks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">موضوع الأغنية وفكرتها</span>
          <input
            className={inputCls}
            placeholder="مثال: الحنين للوطن، أو أغنية فرح لعرس..."
            value={lyrics.topic}
            onChange={(e) => update({ topic: e.target.value })}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={writeSong}
            disabled={!!busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {busy === 'song' ? 'Gemini يكتب...' : 'اكتب لي أغنية كاملة (Gemini)'}
          </button>
          <button
            onClick={() => update({ sections: [...lyrics.sections, newSection('verse')] })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة قسم
          </button>
          {lyrics.vocalTrackId && (
            <button
              onClick={() => onClearTrackLyrics(lyrics.vocalTrackId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs border border-slate-700"
            >
              <Eraser className="w-3.5 h-3.5" /> مسح الكلمات من المسار
            </button>
          )}
        </div>
        {message && <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{message}</p>}
        <p className="text-[10px] text-slate-500 leading-relaxed">
          الربط باللحن يبدأ من «بداية منطقة التعديل» (الخطوة {regionStart + 1}). لتقطيع المقاطع بنفسك افصلها بشرطة: يا-حبي-بي.
        </p>
      </div>

      {/* الأقسام */}
      {lyrics.sections.map((section, idx) => {
        const lines = linesOf(section.text);
        return (
          <div key={section.id} className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
            <div className="flex items-center gap-2">
              <select
                className={`${inputCls} font-bold`}
                value={section.type}
                onChange={(e) => updateSection(section.id, { type: e.target.value })}
              >
                {Object.entries(SECTION_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 mr-auto">
                <button onClick={() => moveSection(idx, -1)} className="p-1 text-slate-500 hover:text-slate-200" title="تحريك لأعلى"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveSection(idx, 1)} className="p-1 text-slate-500 hover:text-slate-200" title="تحريك لأسفل"><ChevronDown className="w-4 h-4" /></button>
                <button
                  onClick={() => update({ sections: lyrics.sections.filter((s) => s.id !== section.id) })}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="حذف القسم"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              dir="auto"
              rows={Math.max(3, lines.length + 1)}
              value={section.text}
              onChange={(e) => updateSection(section.id, { text: e.target.value })}
              placeholder="اكتب كل سطر في سطر مستقل..."
              className="w-full bg-[#0b0f19] text-sm leading-7 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 resize-y"
            />

            {/* الأسطر: عدد المقاطع + الربط باللحن */}
            {lines.length > 0 && (
              <div className="space-y-1">
                {lines.map((line, li) => {
                  const syl = syllabify(line);
                  const key = `${section.id}-${li}`;
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-950/50 rounded-md px-2 py-1">
                      <span className="font-mono text-violet-300 w-14 shrink-0">{syl.length} مقطع</span>
                      <span className="text-slate-400 truncate flex-1 min-w-[8rem]" title={syl.join(' · ')}>{syl.join(' · ')}</span>
                      <button
                        disabled={!lyrics.vocalTrackId || !!busy}
                        onClick={() => linkLine(line, 'local', `link-${key}`)}
                        className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700`}
                        title="توزيع المقاطع على نغمات مسار الغناء"
                      >
                        <Link2 className="w-3 h-3" /> ربط باللحن
                      </button>
                      <button
                        disabled={!lyrics.vocalTrackId || !!busy}
                        onClick={() => linkLine(line, 'ai', `ai-${key}`)}
                        className={`${smallBtn} bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 border border-violet-500/30`}
                        title="Gemini يلحّن السطر على المقام الحالي"
                      >
                        <Sparkles className="w-3 h-3" /> {busy === `ai-${key}` ? '...' : 'لحّن بـ Gemini'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* أدوات Gemini للقسم */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                className={`${inputCls} flex-1 min-w-[10rem]`}
                placeholder="اطلب تعديل: خلّها أحزن، غيّر القافية، حوّلها للمصري..."
                value={instructions[section.id] || ''}
                onChange={(e) => setInstructions((s) => ({ ...s, [section.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && editSection(section)}
              />
              <button
                onClick={() => editSection(section)}
                disabled={!!busy}
                className={`${smallBtn} bg-violet-500 text-white hover:bg-violet-400`}
              >
                <Wand2 className="w-3 h-3" /> {busy === `edit-${section.id}` ? '...' : 'عدّل بـ Gemini'}
              </button>
              <button
                onClick={() => editSection(section, 'اضبط الوزن بحيث تتقارب أعداد المقاطع بين الأسطر، مع الحفاظ على المعنى والقافية')}
                disabled={!!busy}
                className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700`}
              >
                ضبط الوزن
              </button>
              <button
                onClick={() => suggestRhymes(section)}
                disabled={!!busy}
                className={`${smallBtn} bg-slate-800 text-slate-200 hover:bg-slate-700`}
              >
                {busy === `rhyme-${section.id}` ? '...' : 'اقترح قوافي'}
              </button>
            </div>
            {rhymes[section.id] && (
              <div className="flex flex-wrap gap-1.5">
                {rhymes[section.id].map((r, i) => (
                  <span key={i} className="text-[11px] bg-violet-500/10 text-violet-200 border border-violet-500/20 rounded-full px-2 py-0.5">{r}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
