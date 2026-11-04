import React, { useRef } from 'react';
import { Play, Scissors, Repeat, FlipHorizontal } from 'lucide-react';

// مسار مقطع صوتي: شكل الموجة على الخط الزمني (32 خطوة) + أدوات القص والتعديل
// الواجهة RTL، لذلك الخطوة 0 على اليمين والزمن يمشي من اليمين لليسار.

const fmt = (s) => `${s.toFixed(2)} ث`;

function Slider({ label, value, min, max, step, onChange, display, accent = 'accent-sky-500' }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-300">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        className={`w-full h-1 ${accent} cursor-pointer`}
      />
    </label>
  );
}

export default function AudioClipLane({
  track,
  stepSec,
  isPlaying,
  currentStep,
  regionStart,
  regionEnd,
  selected,
  onClipChange,
  onPreview,
}) {
  const clip = track.clip;
  const laneRef = useRef(null);
  const dragRef = useRef(null);

  const cycleSteps = clip.length / clip.rate / stepSec;
  const playSteps = clip.loop ? 32 - clip.startStep : cycleSteps;
  const visibleSteps = Math.max(0.3, Math.min(playSteps, 32 - clip.startStep));

  // الجزء المقصوص من شكل الموجة
  const n = clip.peaks.length;
  let slice = clip.peaks.slice(
    Math.floor((clip.trimStart / clip.duration) * n),
    Math.max(Math.floor((clip.trimStart / clip.duration) * n) + 1, Math.ceil(((clip.trimStart + clip.length) / clip.duration) * n))
  );
  if (clip.reverse) slice = [...slice].reverse();
  const repeats = clip.loop ? Math.max(1, Math.ceil(visibleSteps / Math.max(cycleSteps, 0.01))) : 1;
  const bars = Array.from({ length: repeats }, () => slice).flat();
  const svgWidth = clip.loop ? slice.length * (visibleSteps / Math.max(cycleSteps, 0.01)) : slice.length;

  const onPointerDown = (e) => {
    e.stopPropagation();
    const lane = laneRef.current;
    if (!lane) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, start: clip.startStep, stepPx: lane.clientWidth / 32 };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const delta = Math.round(-(e.clientX - d.x) / d.stepPx); // RTL: السحب يساراً = تأخير
    const next = Math.max(0, Math.min(31, d.start + delta));
    if (next !== clip.startStep) onClipChange({ startStep: next });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const maxLen = Math.max(0.05, clip.duration - clip.trimStart);

  return (
    <div className="flex-1 min-w-[640px] flex flex-col gap-2">
      {/* الخط الزمني */}
      <div ref={laneRef} className="relative h-14 rounded-md border border-slate-800/80 bg-slate-950/60 overflow-hidden select-none">
        {/* تقسيم الخطوات */}
        <div className="absolute inset-0 grid grid-cols-32 pointer-events-none">
          {Array.from({ length: 32 }, (_, i) => {
            const inRegion = i >= regionStart && i <= regionEnd;
            return (
              <div
                key={i}
                className={`border-l ${i % 4 === 0 ? 'border-slate-700/70' : 'border-slate-800/40'} ${
                  inRegion && selected ? 'bg-amber-500/10' : ''
                }`}
              />
            );
          })}
        </div>

        {/* المقطع */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(e) => e.stopPropagation()}
          title="اسحب لتحريك المقطع على الخط الزمني"
          className="absolute top-1 bottom-1 rounded-md cursor-grab active:cursor-grabbing border overflow-hidden"
          style={{
            right: `${(clip.startStep / 32) * 100}%`,
            width: `${(visibleSteps / 32) * 100}%`,
            backgroundColor: `${track.color}22`,
            borderColor: `${track.color}aa`,
          }}
        >
          <svg
            viewBox={`0 0 ${Math.max(1, svgWidth)} 100`}
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{ transform: 'scaleX(-1)' }}
          >
            {bars.map((p, i) => (
              <rect key={i} x={i} y={50 - p * 46} width={0.8} height={Math.max(1, p * 92)} fill={track.color} />
            ))}
          </svg>
          <span className="absolute top-0.5 right-1 text-[9px] font-bold text-white/80 drop-shadow pointer-events-none truncate max-w-full">
            {clip.fileName}
          </span>
        </div>

        {/* مؤشر التشغيل */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none"
            style={{ right: `${(currentStep / 32) * 100}%` }}
          />
        )}
      </div>

      {/* أدوات التعديل */}
      {selected && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5" onClick={(e) => e.stopPropagation()}>
          <Slider
            label="البداية في المقطوعة"
            value={clip.startStep}
            min={0}
            max={31}
            step={1}
            display={`خطوة ${clip.startStep + 1}`}
            onChange={(v) => onClipChange({ startStep: v })}
            accent="accent-amber-500"
          />
          <Slider
            label="بداية القص من الملف"
            value={clip.trimStart}
            min={0}
            max={Math.max(0, clip.duration - 0.05)}
            step={0.01}
            display={fmt(clip.trimStart)}
            onChange={(v) => onClipChange({ trimStart: v, length: Math.min(clip.length, clip.duration - v) })}
          />
          <Slider
            label="طول الجزء المستخدم"
            value={Math.min(clip.length, maxLen)}
            min={0.05}
            max={maxLen}
            step={0.01}
            display={fmt(clip.length)}
            onChange={(v) => onClipChange({ length: v })}
          />
          <Slider
            label="السرعة والطبقة"
            value={clip.rate}
            min={0.5}
            max={2}
            step={0.01}
            display={`×${clip.rate.toFixed(2)}`}
            onChange={(v) => onClipChange({ rate: v })}
            accent="accent-fuchsia-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <Slider
              label="ظهور"
              value={clip.fadeIn}
              min={0}
              max={2}
              step={0.01}
              display={fmt(clip.fadeIn)}
              onChange={(v) => onClipChange({ fadeIn: v })}
              accent="accent-emerald-500"
            />
            <Slider
              label="اختفاء"
              value={clip.fadeOut}
              min={0}
              max={2}
              step={0.01}
              display={fmt(clip.fadeOut)}
              onChange={(v) => onClipChange({ fadeOut: v })}
              accent="accent-emerald-500"
            />
          </div>

          <div className="col-span-2 md:col-span-5 flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={onPreview}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold"
            >
              <Play className="w-3 h-3" /> تجربة المقطع
            </button>
            <button
              onClick={() => onClipChange({ reverse: !clip.reverse })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                clip.reverse ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <FlipHorizontal className="w-3 h-3" /> عكس الصوت
            </button>
            <button
              onClick={() => onClipChange({ loop: !clip.loop })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                clip.loop ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Repeat className="w-3 h-3" /> تكرار حتى نهاية المقطوعة
            </button>
            <button
              onClick={() =>
                onClipChange({
                  startStep: regionStart,
                  length: Math.min(maxLen, (regionEnd - regionStart + 1) * stepSec * clip.rate),
                  loop: false,
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
            >
              <Scissors className="w-3 h-3" /> ضبط على منطقة التعديل
            </button>
            <button
              onClick={() => onClipChange({ trimStart: 0, length: clip.duration, rate: 1, reverse: false, loop: false, fadeIn: 0.01, fadeOut: 0.05 })}
              className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-[11px]"
            >
              إرجاع الأصل
            </button>
            <span className="text-[10px] text-slate-500 mr-auto">
              مدة الملف: {fmt(clip.duration)} — اسحب المقطع لتحريكه
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
