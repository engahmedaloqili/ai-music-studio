// ==========================================
// توليد أغنية مغنّاة عبر Google Lyria (نفس مفتاح Gemini)
// lyria-3.5 = أغنية كاملة (دقيقتين تقريباً)، lyria-3-clip-preview = مقطع 30 ثانية (أرخص وأسرع)
// المرجع: aistudio.google.com/docs/music-generation (Interactions API)
// ==========================================

import { clearGeminiApiKey } from './apiKey';

export const LYRIA_MODELS = {
  'lyria-3.5': 'أغنية كاملة (Lyria 3.5)',
  'lyria-3-clip-preview': 'مقطع تجريبي 30 ثانية (Lyria 3 Clip)',
};

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

// يبحث داخل الرد عن أول كتلة صوتية وأي نص (الرد على شكل steps → content)
function extract(node, found = { audio: null, mime: 'audio/mpeg', texts: [] }) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    node.forEach((n) => extract(n, found));
    return found;
  }
  if (node.type === 'audio' && typeof node.data === 'string' && !found.audio) {
    found.audio = node.data;
    if (node.mime_type || node.mimeType) found.mime = node.mime_type || node.mimeType;
  }
  if (node.type === 'text' && typeof node.text === 'string') found.texts.push(node.text);
  if (node.output_audio?.data && !found.audio) found.audio = node.output_audio.data;
  Object.values(node).forEach((v) => typeof v === 'object' && extract(v, found));
  return found;
}

// داخل تطبيق سطح المكتب يمر الطلب عبر Electron (بدون قيود CORS)، وفي المتصفح نطلب مباشرة بدون ترويسة Api-Revision
async function postInteraction(apiKey, model, prompt) {
  if (window.studioNative?.lyriaRequest) {
    const r = await window.studioNative.lyriaRequest(apiKey, model, prompt);
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => JSON.parse(r.body) };
  }
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ model, input: prompt }),
  });
}

export async function generateSong(apiKey, model, prompt) {
  const res = await postInteraction(apiKey, model, prompt);
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = (Array.isArray(j) ? j[0] : j)?.error?.message || '';
    } catch (e) { /* */ }
    if (/API key not valid/i.test(detail)) {
      clearGeminiApiKey();
      throw new Error('مفتاح Gemini غير صحيح، وتم مسحه. اضغط مرة ثانية وأدخل المفتاح الصحيح.');
    }
    if (res.status === 400 && /safety|blocked|policy/i.test(detail)) throw new Error('رفض Lyria الطلب لأسباب أمان أو حقوق (لا يُسمح بتقليد مغنٍّ معيّن أو كلمات محمية).');
    if (res.status === 403 || res.status === 401) throw new Error('المفتاح لا يملك صلاحية Lyria. تأكد من تفعيل الفوترة في Google AI Studio.');
    if (res.status === 429) throw new Error('تجاوزت حد الاستخدام. انتظر قليلاً وحاول مرة ثانية.');
    throw new Error(`خطأ من Lyria (${res.status}) ${detail}`);
  }
  const json = await res.json();
  const { audio, mime, texts } = extract(json);
  if (!audio) throw new Error('لم يرجع Lyria ملفاً صوتياً. جرّب تبسيط الوصف أو تقصير الكلمات.');
  const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
  return { blob: new Blob([bytes], { type: mime }), info: texts.join('\n').trim() };
}

// يبني وصف الأغنية: الأسلوب + الكلمات بوسوم إنجليزية
export function buildSongPrompt({ title, dialect, style, scale, bpm, instruments, lyricsText }) {
  return [
    `Create a complete song titled "${title}".`,
    `Style and mood: ${style || 'emotional Arabic song'}.`,
    `Musical mode / maqam: ${scale}. Tempo around ${bpm} BPM.`,
    instruments ? `Main instruments: ${instruments}.` : '',
    `Vocals: sing the lyrics exactly as written, ${dialect === 'English' ? 'in English' : `in ${dialect} Arabic pronunciation`}, with a clear expressive voice.`,
    '',
    'Lyrics:',
    lyricsText,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

// اسم اللهجة كما يفهمه نموذج الغناء
export const DIALECT_FOR_SINGER = {
  fusha: 'Modern Standard',
  khaleeji: 'Gulf (Khaleeji)',
  najdi: 'Saudi Najdi',
  hijazi: 'Saudi Hijazi',
  egyptian: 'Egyptian',
  shami: 'Levantine',
  iraqi: 'Iraqi',
  maghrebi: 'Moroccan',
  english: 'English',
};
