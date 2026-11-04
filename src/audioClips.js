// ==========================================
// المقاطع الصوتية المستوردة (Audio Clips)
// مسار المقطع = track.kind === 'audio' وفيه track.clip:
//   fileName, duration (ثواني الملف الأصلي), startStep (خطوة البداية 0..31),
//   trimStart (بداية القص بالثواني), length (طول الجزء المستخدم بالثواني),
//   rate (السرعة/الطبقة 0.5..2), reverse (عكس), fadeIn / fadeOut (ثواني), loop (تكرار داخل المقطع)
// البيانات الصوتية نفسها (AudioBuffer) تُحفظ خارج الـ state في Map حسب id المسار.
// ==========================================

import { buildFxChain, pitchShiftBuffer, withDefaultFx, DEFAULT_FX } from './vocalFx';

export const PEAK_COUNT = 400;

export const AUDIO_TRACK_COLORS = ['#38bdf8', '#a3e635', '#f472b6', '#facc15', '#c084fc', '#fb923c'];

// قراءة الملف وتحويله إلى AudioBuffer مع حساب شكل الموجة
export async function decodeAudioFile(ctx, file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  return { buffer, peaks: computePeaks(buffer) };
}

export function computePeaks(buffer, count = PEAK_COUNT) {
  const channels = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
  const block = Math.max(1, Math.floor(buffer.length / count));
  const peaks = new Array(count).fill(0);
  for (let i = 0; i < count; i++) {
    let max = 0;
    const start = i * block;
    const end = Math.min(buffer.length, start + block);
    for (let s = start; s < end; s += 16) {
      for (const ch of channels) {
        const v = Math.abs(ch[s]);
        if (v > max) max = v;
      }
    }
    peaks[i] = max;
  }
  const top = Math.max(...peaks, 0.0001);
  return peaks.map((p) => Number((p / top).toFixed(3)));
}

export function reverseBuffer(ctx, buffer) {
  const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = out.getChannelData(c);
    for (let i = 0, n = src.length; i < n; i++) dst[i] = src[n - 1 - i];
  }
  return out;
}

export function newAudioTrack(id, fileName, duration, peaks, colorIndex = 0) {
  return {
    id,
    kind: 'audio',
    instrument: 'audio_clip',
    name: fileName.replace(/\.[^.]+$/, ''),
    color: AUDIO_TRACK_COLORS[colorIndex % AUDIO_TRACK_COLORS.length],
    volume: 0.9,
    pan: 0,
    reverb: 0,
    muted: false,
    solo: false,
    octave: 0,
    notes: new Array(32).fill(0),
    clip: {
      fileName,
      duration,
      peaks,
      startStep: 0,
      trimStart: 0,
      length: duration,
      rate: 1,
      reverse: false,
      fadeIn: 0.01,
      fadeOut: 0.05,
      loop: false,
      fx: JSON.parse(JSON.stringify(DEFAULT_FX)),
    },
  };
}

// البيانات الصوتية بعد العكس وتغيير الطبقة (مع ذاكرة مؤقتة)
export function getProcessedBuffer(ctx, entry, clip) {
  const pitch = clip.fx?.pitch || 0;
  const key = `${clip.reverse ? 1 : 0}|${pitch}`;
  entry.cache = entry.cache || new Map();
  if (entry.cache.has(key)) return entry.cache.get(key);
  let buf = entry.buffer;
  if (clip.reverse) buf = reverseBuffer(ctx, buf);
  if (pitch) buf = pitchShiftBuffer(ctx, buf, pitch);
  // نحتفظ بآخر 4 نسخ فقط حتى لا تمتلئ الذاكرة
  if (entry.cache.size >= 4) entry.cache.delete(entry.cache.keys().next().value);
  entry.cache.set(key, buf);
  return buf;
}

// تشغيل المقطع: يرجع كائناً فيه stop() و onended حتى يمكن إيقافه
// loopSeconds = مدة المقطوعة كاملة (32 خطوة) لمعرفة متى يتوقف المقطع المكرر
export function playClip(ctx, track, buffers, output, when, loopSeconds) {
  const clip = track.clip;
  const entry = buffers.get(track.id);
  if (!entry) return null;
  const buf = getProcessedBuffer(ctx, entry, clip);
  const fx = withDefaultFx(clip.fx);

  const trimStart = Math.min(clip.trimStart, clip.duration - 0.01);
  const length = Math.max(0.02, Math.min(clip.length, clip.duration - trimStart));
  const offset = clip.reverse ? clip.duration - trimStart - length : trimStart;

  const gain = ctx.createGain();
  const peak = track.volume;
  const playDuration = clip.loop
    ? Math.max(0.05, loopSeconds - (clip.startStep / 32) * loopSeconds)
    : length / clip.rate;
  const fadeIn = Math.min(clip.fadeIn, playDuration / 2);
  const fadeOut = Math.min(clip.fadeOut, playDuration / 2);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(peak, when + Math.max(fadeIn, 0.005));
  gain.gain.setValueAtTime(peak, when + playDuration - Math.max(fadeOut, 0.005));
  gain.gain.linearRampToValueAtTime(0, when + playDuration);

  const chain = buildFxChain(ctx, fx);
  gain.connect(chain.input);
  let node = chain.output;
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = track.pan || 0;
    chain.output.connect(pan);
    node = pan;
  }
  node.connect(output);

  const makeSource = (detuneCents, delaySec, target) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = clip.rate;
    if (detuneCents && src.detune) src.detune.value = detuneCents;
    src.connect(target);
    const t = when + delaySec;
    if (clip.loop) {
      src.loop = true;
      src.loopStart = offset;
      src.loopEnd = offset + length;
      src.start(t, offset);
      src.stop(t + playDuration);
    } else {
      src.start(t, offset, length);
    }
    return src;
  };

  const sources = [makeSource(0, 0, gain)];
  if (fx.double) {
    // نسخة ثانية منحرفة قليلاً بالطبقة والتوقيت ومزاحة للجهة الثانية
    const dGain = ctx.createGain();
    dGain.gain.value = 0.6;
    let dNode = dGain;
    if (ctx.createStereoPanner) {
      const dPan = ctx.createStereoPanner();
      dPan.pan.value = -(track.pan || 0) * 0.5 + 0.4;
      dGain.connect(dPan);
      dNode = dPan;
    }
    dNode.connect(gain);
    sources.push(makeSource(-12, 0.025, dGain));
  }

  return {
    stop: () => sources.forEach((s) => { try { s.stop(); } catch (e) { /* انتهى */ } }),
    set onended(fn) { sources[0].onended = fn; },
  };
}
