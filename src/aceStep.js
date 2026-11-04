// ==========================================
// ACE-Step عبر fal.ai: توليد أغنية + إعادة غناء جزء محدد (Repaint) + تغيير الكلمات مع الحفاظ على اللحن
// النماذج: fal-ai/ace-step | fal-ai/ace-step/audio-inpaint | fal-ai/ace-step/audio-to-audio
// الطلب: POST https://fal.run/<model>  مع ترويسة Authorization: Key <FAL_KEY>
// ==========================================
import { clearFalApiKey } from './apiKey';

const RUN = 'https://fal.run/';
const UPLOAD_INIT = 'https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3';

async function falRun(apiKey, model, input) {
  const res = await fetch(RUN + model, {
    method: 'POST',
    headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail || j);
    } catch (e) { /* */ }
    if (res.status === 401 || res.status === 403) {
      clearFalApiKey();
      throw new Error('مفتاح fal.ai غير صحيح، وتم مسحه. اضغط مرة ثانية وأدخل المفتاح الصحيح.');
    }
    if (res.status === 402 || /balance|credit|billing/i.test(detail)) throw new Error('رصيد fal.ai غير كافٍ. أضف رصيداً من fal.ai/dashboard/billing.');
    throw new Error(`خطأ من ACE-Step (${res.status}) ${detail.slice(0, 200)}`);
  }
  return res.json();
}

// ---------- رفع الصوت ----------
function encodeWav(buffer) {
  const ch = Math.min(2, buffer.numberOfChannels);
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const out = new ArrayBuffer(44 + len * ch * 2);
  const v = new DataView(out);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, len * ch * 2, true);
  const data = [];
  for (let c = 0; c < ch; c++) data.push(buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([out], { type: 'audio/wav' });
}

export async function uploadAudio(apiKey, buffer) {
  const blob = encodeWav(buffer);
  const init = await fetch(UPLOAD_INIT, {
    method: 'POST',
    headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_type: 'audio/wav', file_name: 'song.wav' }),
  });
  if (init.ok) {
    const { upload_url, file_url } = await init.json();
    const put = await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: blob });
    if (put.ok && file_url) return file_url;
  }
  // بديل: إرسال الملف داخل الطلب (للمقاطع القصيرة فقط)
  if (blob.size > 12 * 1024 * 1024) throw new Error('تعذر رفع الملف إلى fal.ai، والملف أكبر من أن يُرسل مباشرة.');
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
}

async function downloadAudio(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('تعذر تحميل الملف الناتج من fal.ai');
  return res.blob();
}

// ---------- العمليات ----------
const QUALITY = { number_of_steps: 60, scheduler: 'euler', guidance_type: 'apg' };

export async function aceGenerate(apiKey, { tags, lyrics, duration, seed }) {
  const out = await falRun(apiKey, 'fal-ai/ace-step', { ...QUALITY, tags, lyrics, duration, ...(seed ? { seed } : {}) });
  return { blob: await downloadAudio(out.audio.url), url: out.audio.url, seed: out.seed, tags, lyrics };
}

// إعادة غناء جزء من الأغنية (بالثواني) والباقي يبقى كما هو
export async function aceRepaint(apiKey, { audioUrl, tags, lyrics, start, end, variance = 0.5 }) {
  const out = await falRun(apiKey, 'fal-ai/ace-step/audio-inpaint', {
    ...QUALITY,
    audio_url: audioUrl,
    tags,
    lyrics,
    start_time: start,
    start_time_relative_to: 'start',
    end_time: end,
    end_time_relative_to: 'start',
    variance,
  });
  return { blob: await downloadAudio(out.audio.url), url: out.audio.url, seed: out.seed, tags, lyrics };
}

// تغيير الكلمات في الأغنية كاملة مع الحفاظ على اللحن (edit_mode = lyrics) أو إعادة توزيع بأسلوب جديد (remix)
export async function aceEdit(apiKey, { audioUrl, mode, originalTags, originalLyrics, tags, lyrics, originalSeed }) {
  const out = await falRun(apiKey, 'fal-ai/ace-step/audio-to-audio', {
    ...QUALITY,
    audio_url: audioUrl,
    edit_mode: mode,
    original_tags: originalTags,
    original_lyrics: originalLyrics || '',
    tags,
    lyrics,
    ...(originalSeed ? { original_seed: originalSeed } : {}),
  });
  return { blob: await downloadAudio(out.audio.url), url: out.audio.url, seed: out.seed, tags, lyrics };
}

// وسوم الأسلوب بالإنجليزي (ACE-Step يفهمها أفضل)
export function buildAceTags({ style, dialect, instruments, bpm, voice }) {
  return [
    style,
    dialect === 'English' ? 'english vocals' : `arabic, ${dialect || 'arabic'} arabic vocals`,
    voice,
    instruments,
    `${bpm} bpm`,
  ]
    .filter(Boolean)
    .join(', ');
}
