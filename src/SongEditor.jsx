import React, { useEffect, useRef, useState } from 'react';
import { Wand2, Play, Square, Undo2, Sparkles, Shuffle, Type } from 'lucide-react';

// ==========================================
// محرر الأغنية بالذكاء (ACE-Step): توليد، ثم تحديد جزء على الموجة وإعادة غنائه، أو تغيير الكلمات بنفس اللحن
// ==========================================

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, '0');
  return `${m}:${sec}`;
};

function Waveform({ peaks, duration, sel, onSelect, color }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const toTime = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    return Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration));
  };
  return (
    <div
      ref={ref}
      dir="ltr"
      className="relative h-24 rounded-lg bg-slate-950 border border-slate-800 cursor-crosshair select-none overflow-hidden"
      onPointerDown={(e) => {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        const t = toTime(e.clientX);
        drag.current = t;
        onSelect({ start: t, end: t });
      }}
      onPointerMove={(e) => {
        if (drag.current === null) return;
        const t = toTime(e.clientX);
        onSelect({ start: Math.min(drag.current, t), end: Math.max(drag.current, t) });
      }}
      onPointerUp={() => { drag.current = null; }}
    >
      <svg viewBox={`0 0 ${peaks.length} 100`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        {peaks.map((p, i) => (
          <rect key={i} x={i} y={50 - p * 46} width={0.8} height={Math.max(1, p * 92)} fill={color} opacity={0.85} />
        ))}
      </svg>
      {sel && sel.end - sel.start > 0.05 && (
        <div
          className="absolute top-0 bottom-0 bg-amber-400/25 border-x-2 border-amber-400 pointer-events-none"
          style={{ left: `${(sel.start / duration) * 100}%`, width: `${((sel.end - sel.start) / duration) * 100}%` }}
        />
      )}
      {/* علامات الزمن */}
      {Array.from({ length: Math.floor(duration / 15) + 1 }, (_, i) => i * 15).map((t) => (
        <span key={t} className="absolute bottom-0.5 text-[9px] text-slate-500 font-mono pointer-events-none" style={{ left: `${(t / duration) * 100}%` }}>
          {fmt(t).replace(/\.\d$/, '')}
        </span>
      ))}
    </div>
  );
}

export default function SongEditor({
  songs,
  defaultTags,
  defaultLyrics,
  historyCount,
  onGenerate,
  onRepaint,
  onEdit,
  onUndo,
  onPreview,
  onStopPreview,
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [genTags, setGenTags] = useState(defaultTags);
  const [voice, setVoice] = useState('male vocal');
  const [duration, setDuration] = useState(120);
  const [trackId, setTrackId] = useState(songs[songs.length - 1]?.id || '');
  const [sel, setSel] = useState(null);
  const [variance, setVariance] = useState(0.5);
  const [drafts, setDrafts] = useState({}); // كلمات ووسوم لكل أغنية

  const track = songs.find((t) => t.id === trackId) || songs[songs.length - 1];
  useEffect(() => {
    if (!songs.find((t) => t.id === trackId) && songs.length) setTrackId(songs[songs.length - 1].id);
  }, [songs, trackId]);
  useEffect(() => setSel(null), [track?.id]);

  const draft = track
    ? drafts[track.id] || { lyrics: track.clip.ace?.lyrics || defaultLyrics, tags: track.clip.ace?.tags || defaultTags }
    : null;
  const setDraft = (patch) => track && setDrafts((d) => ({ ...d, [track.id]: { ...draft, ...patch } }));

  const run = async (key, fn) => {
    setBusy(key);
    setMessage('');
    try {
      setMessage(await fn());
    } catch (e) {
      setMessage(`⚠️ ${e.message || 'حدث خطأ'}`);
    }
    setBusy('');
  };

  const hasSel = sel && sel.end - sel.start >= 1;
  const inputCls = 'bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500';
  const btn = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50';
  const waiting = (k, label) => (busy === k ? 'جاري المعالجة... (دقيقة تقريباً)' : label);

  return (
    <div className="bg-[#111827] border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold">محرر الأغنية بالذكاء (ACE-Step)</h3>
        <span className="text-[10px] text-slate-500 mr-auto">عبر fal.ai — مدفوع حسب الاستخدام</span>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        هنا تقدر تعدّل جزء من الأغنية بدون ما تتغير كلها: حدد الجزء على الموجة بالسحب، عدّل كلماته، واضغط «أعد غناء الجزء المحدد».
        الباقي يبقى نفس اللحن ونفس الصوت. كل تعديل تقدر تتراجع عنه.
      </p>

      {/* 1) توليد أغنية */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2.5">
        <h4 className="text-xs font-bold text-cyan-300">١. ولّد أغنية من كلماتك</h4>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">الأسلوب (وسوم إنجليزية مفصولة بفواصل)</span>
          <input className={inputCls} dir="ltr" value={genTags} onChange={(e) => setGenTags(e.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <select className={inputCls} value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="male vocal">صوت رجالي</option>
            <option value="female vocal">صوت نسائي</option>
            <option value="male and female vocals, duet">ديو (رجالي ونسائي)</option>
            <option value="">بدون تحديد</option>
          </select>
          <label className="flex items-center gap-2 text-[11px] text-slate-400">
            المدة
            <input type="range" min={30} max={240} step={10} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="accent-cyan-500" />
            <span className="font-mono text-slate-200">{fmt(duration).replace(/\.\d$/, '')}</span>
          </label>
          <button
            disabled={!!busy || !defaultLyrics.trim()}
            onClick={() => run('gen', () => onGenerate({ tags: [genTags, voice].filter(Boolean).join(', '), duration }))}
            className={`${btn} bg-cyan-500 hover:bg-cyan-400 text-slate-950`}
          >
            <Sparkles className="w-3.5 h-3.5" /> {waiting('gen', 'ولّد الأغنية')}
          </button>
        </div>
        {!defaultLyrics.trim() && <p className="text-[10px] text-amber-300">اكتب الكلمات في مربع الكلمات فوق أولاً.</p>}
      </div>

      {/* 2) تعديل أجزاء الأغنية */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2.5">
        <h4 className="text-xs font-bold text-cyan-300">٢. عدّل الأغنية جزء جزء</h4>
        {!track ? (
          <p className="text-[11px] text-slate-500">ما فيه أغنية للحين. ولّد أغنية فوق، أو استورد ملف صوتي من تبويب المسارات.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <select className={inputCls} value={track.id} onChange={(e) => setTrackId(e.target.value)}>
                {songs.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({fmt(t.clip.duration).replace(/\.\d$/, '')})</option>
                ))}
              </select>
              <span className="text-[11px] font-mono text-amber-300">
                {hasSel ? `الجزء المحدد: ${fmt(sel.start)} ← ${fmt(sel.end)}` : 'اسحب على الموجة لتحديد جزء'}
              </span>
              <div className="flex items-center gap-1 mr-auto">
                <button onClick={() => onPreview(track.id, hasSel ? sel.start : 0, hasSel ? sel.end : track.clip.duration)} className={`${btn} bg-slate-800 text-slate-200`}>
                  <Play className="w-3.5 h-3.5" /> {hasSel ? 'اسمع الجزء' : 'اسمع'}
                </button>
                <button onClick={onStopPreview} className={`${btn} bg-slate-800 text-slate-200`}>
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <Waveform peaks={track.clip.peaks} duration={track.clip.duration} sel={sel} onSelect={setSel} color={track.color} />

            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">كلمات هذه الأغنية — عدّل السطر اللي تبي تغيّره</span>
              <textarea
                dir="auto"
                rows={6}
                value={draft.lyrics}
                onChange={(e) => setDraft({ lyrics: e.target.value })}
                className="w-full bg-slate-950 text-sm leading-7 text-slate-100 border border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 resize-y"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">الأسلوب</span>
                <input className={inputCls} dir="ltr" value={draft.tags} onChange={(e) => setDraft({ tags: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="flex justify-between text-[11px] text-slate-400">
                  <span>قوة التغيير في الجزء</span>
                  <span className="font-mono text-slate-200">{Math.round(variance * 100)}%</span>
                </span>
                <input type="range" min={0.1} max={1} step={0.05} value={variance} onChange={(e) => setVariance(Number(e.target.value))} className="accent-amber-500" />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={!!busy || !hasSel}
                onClick={() => run('repaint', () => onRepaint(track.id, { start: Math.round(sel.start * 10) / 10, end: Math.round(sel.end * 10) / 10, lyrics: draft.lyrics, tags: draft.tags, variance }))}
                className={`${btn} bg-amber-500 hover:bg-amber-400 text-slate-950`}
                title={hasSel ? '' : 'حدد جزء على الموجة أولاً (ثانية على الأقل)'}
              >
                <Wand2 className="w-3.5 h-3.5" /> {waiting('repaint', 'أعد غناء الجزء المحدد')}
              </button>
              <button
                disabled={!!busy}
                onClick={() => run('lyrics', () => onEdit(track.id, { mode: 'lyrics', lyrics: draft.lyrics, tags: draft.tags }))}
                className={`${btn} bg-violet-500 hover:bg-violet-400 text-white`}
              >
                <Type className="w-3.5 h-3.5" /> {waiting('lyrics', 'غيّر الكلمات بنفس اللحن')}
              </button>
              <button
                disabled={!!busy}
                onClick={() => run('remix', () => onEdit(track.id, { mode: 'remix', lyrics: draft.lyrics, tags: draft.tags }))}
                className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700`}
              >
                <Shuffle className="w-3.5 h-3.5" /> {waiting('remix', 'أعد التوزيع بالأسلوب الجديد')}
              </button>
              <button
                disabled={!!busy || !historyCount[track.id]}
                onClick={() => setMessage(onUndo(track.id))}
                className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 mr-auto`}
              >
                <Undo2 className="w-3.5 h-3.5" /> تراجع ({historyCount[track.id] || 0})
              </button>
            </div>
          </>
        )}
      </div>

      {message && <p className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 whitespace-pre-line">{message}</p>}
    </div>
  );
}
