// ==========================================
// مؤثرات الصوت والغناء للمقاطع الصوتية (clip.fx)
// pitch: تغيير الطبقة بأنصاف التون بدون تغيير السرعة (معالجة مسبقة Granular)
// eq: low / presence / air بالديسيبل، comp: ضاغط صوت، double: تدبيل الصوت (صوتين)
// echo: {on, time, feedback, mix}، reverb: {on, size, mix}
// ==========================================

export const DEFAULT_FX = {
  pitch: 0,
  eq: { low: 0, presence: 0, air: 0 },
  comp: false,
  double: false,
  echo: { on: false, time: 0.3, feedback: 0.35, mix: 0.3 },
  reverb: { on: false, size: 2, mix: 0.3 },
};

export const VOCAL_PRESETS = {
  natural: { name: 'طبيعي', fx: DEFAULT_FX },
  studio: {
    name: 'استوديو نظيف',
    fx: { ...DEFAULT_FX, eq: { low: -3, presence: 3, air: 2 }, comp: true, reverb: { on: true, size: 1.5, mix: 0.18 } },
  },
  tarab: {
    name: 'طربي (صدى قاعة)',
    fx: { ...DEFAULT_FX, eq: { low: -2, presence: 2, air: 1 }, comp: true, reverb: { on: true, size: 3.5, mix: 0.38 }, echo: { on: true, time: 0.42, feedback: 0.25, mix: 0.18 } },
  },
  pop: {
    name: 'بوب حديث',
    fx: { ...DEFAULT_FX, eq: { low: -4, presence: 4, air: 4 }, comp: true, double: true, reverb: { on: true, size: 1.8, mix: 0.22 }, echo: { on: true, time: 0.25, feedback: 0.2, mix: 0.12 } },
  },
  radio: {
    name: 'راديو قديم',
    fx: { ...DEFAULT_FX, eq: { low: -12, presence: 8, air: -12 }, comp: true },
  },
  chipmunk: { name: 'صوت حاد (كرتوني)', fx: { ...DEFAULT_FX, pitch: 7 } },
  deep: { name: 'صوت عميق', fx: { ...DEFAULT_FX, pitch: -5, eq: { low: 3, presence: 0, air: -2 } } },
};

const clone = (o) => JSON.parse(JSON.stringify(o));
export const withDefaultFx = (fx) => ({ ...clone(DEFAULT_FX), ...(fx || {}) });

// تغيير الطبقة مع الحفاظ على الزمن:
// 1) إطالة/تقصير الزمن بنسبة الطبقة مع محاذاة الموجات (WSOLA) حتى لا يتشوه الصوت
// 2) إعادة العيّنة بنفس النسبة، فيرجع الطول الأصلي وتتغير الطبقة فقط
function wsolaStretch(channels, factor, sampleRate) {
  const len = channels[0].length;
  const N = Math.round(sampleRate * 0.04) & ~1; // إطار 40ms
  const Hs = N / 2; // خطوة الكتابة
  const Ha = Hs / factor; // خطوة القراءة
  const tol = Math.round(sampleRate * 0.012); // مدى البحث عن أفضل محاذاة
  const outLen = Math.ceil(len * factor) + N;
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);

  // نسخة أحادية للبحث عن المحاذاة
  const mono = new Float32Array(len);
  for (const ch of channels) for (let i = 0; i < len; i++) mono[i] += ch[i] / channels.length;

  const outs = channels.map(() => new Float32Array(outLen));
  const norm = new Float32Array(outLen);
  let prevRead = 0;
  for (let k = 0, outPos = 0; outPos < outLen - N; k++, outPos += Hs) {
    const nominal = Math.round(k * Ha);
    let read = nominal;
    if (k > 0) {
      // الاستمرار الطبيعي للإطار السابق
      const natural = prevRead + Hs;
      let best = -Infinity;
      for (let d = -tol; d <= tol; d += 2) {
        const cand = nominal + d;
        if (cand < 0 || cand + Hs >= len || natural + Hs >= len) continue;
        let sum = 0;
        for (let i = 0; i < Hs; i += 4) sum += mono[natural + i] * mono[cand + i];
        if (sum > best) { best = sum; read = cand; }
      }
    }
    read = Math.max(0, Math.min(len - 1, read));
    for (let c = 0; c < channels.length; c++) {
      const src = channels[c];
      const dst = outs[c];
      for (let i = 0; i < N; i++) {
        const r = read + i;
        if (r >= len) break;
        dst[outPos + i] += src[r] * win[i];
      }
    }
    for (let i = 0; i < N; i++) norm[outPos + i] += win[i];
    prevRead = read;
  }
  for (const o of outs) for (let i = 0; i < outLen; i++) if (norm[i] > 1e-3) o[i] /= norm[i];
  return outs;
}

export function pitchShiftBuffer(ctx, buffer, semitones) {
  if (!semitones) return buffer;
  const ratio = Math.pow(2, semitones / 12);
  const len = buffer.length;
  const channels = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
  const stretched = wsolaStretch(channels, ratio, buffer.sampleRate);
  const out = ctx.createBuffer(buffer.numberOfChannels, len, buffer.sampleRate);
  for (let c = 0; c < channels.length; c++) {
    const st = stretched[c];
    const dst = out.getChannelData(c);
    for (let i = 0; i < len; i++) {
      const r = i * ratio;
      const k = Math.floor(r);
      if (k + 1 >= st.length) break;
      const f = r - k;
      dst[i] = st[k] * (1 - f) + st[k + 1] * f;
    }
  }
  return out;
}

// استجابة صدى صناعية للـ Reverb
const irCache = new Map();
function impulseResponse(ctx, seconds) {
  const key = `${ctx.sampleRate}-${seconds.toFixed(1)}`;
  if (irCache.has(key)) return irCache.get(key);
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  irCache.set(key, ir);
  return ir;
}

// يبني سلسلة المؤثرات: يرجع {input, output}
export function buildFxChain(ctx, fx) {
  const f = withDefaultFx(fx);
  const input = ctx.createGain();
  const output = ctx.createGain();

  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 200;
  low.gain.value = f.eq.low;
  const presence = ctx.createBiquadFilter();
  presence.type = 'peaking';
  presence.frequency.value = 3000;
  presence.Q.value = 0.9;
  presence.gain.value = f.eq.presence;
  const air = ctx.createBiquadFilter();
  air.type = 'highshelf';
  air.frequency.value = 10000;
  air.gain.value = f.eq.air;
  input.connect(low);
  low.connect(presence);
  presence.connect(air);

  let dry = air;
  if (f.comp) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.15;
    comp.knee.value = 10;
    const makeup = ctx.createGain();
    makeup.gain.value = 1.4;
    air.connect(comp);
    comp.connect(makeup);
    dry = makeup;
  }
  dry.connect(output);

  if (f.echo.on) {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = f.echo.time;
    const fb = ctx.createGain();
    fb.gain.value = Math.min(0.85, f.echo.feedback);
    const wet = ctx.createGain();
    wet.gain.value = f.echo.mix;
    dry.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(output);
  }
  if (f.reverb.on) {
    const conv = ctx.createConvolver();
    conv.buffer = impulseResponse(ctx, f.reverb.size);
    const wet = ctx.createGain();
    wet.gain.value = f.reverb.mix;
    dry.connect(conv);
    conv.connect(wet);
    wet.connect(output);
  }
  return { input, output };
}
