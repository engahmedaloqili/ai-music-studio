// ==========================================
// الكلمات: الأقسام، تقطيع المقاطع، وربط الكلمات باللحن
// lyrics = { title, topic, dialect, vocalTrackId, sections: [{ id, type, text }] }
// track.lyrics = مصفوفة 32 عنصر (مقطع لكل خطوة أو '')
// ==========================================

export const SECTION_TYPES = {
  intro: 'مقدمة',
  madhhab: 'المذهب (اللازمة)',
  verse: 'كوبليه',
  chorus: 'كورس / قرار',
  bridge: 'جسر',
  outro: 'قفلة',
};

export const DIALECTS = {
  fusha: 'فصحى',
  khaleeji: 'خليجي',
  najdi: 'سعودي نجدي',
  hijazi: 'حجازي',
  egyptian: 'مصري',
  shami: 'شامي',
  iraqi: 'عراقي',
  maghrebi: 'مغربي',
  english: 'English',
};

export const newSection = (type = 'verse', text = '') => ({
  id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  text,
});

export const DEFAULT_LYRICS = {
  title: 'أغنية جديدة',
  topic: '',
  dialect: 'khaleeji',
  vocalTrackId: null,
  sections: [newSection('madhhab', ''), newSection('verse', '')],
};

const STORAGE_KEY = 'ams_lyrics_v1';
export function loadLyrics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_LYRICS, ...JSON.parse(raw) };
  } catch (e) { /* */ }
  return DEFAULT_LYRICS;
}
export function saveLyrics(lyrics) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lyrics)); } catch (e) { /* */ }
}

// ---------- تقطيع المقاطع ----------
const DIACRITICS = /[ً-ٰٟـ]/g; // التشكيل والتطويل
const LONG_VOWELS = 'اوىيآ';
const ARABIC = /[؀-ۿ]/;

function syllabifyArabicWord(word) {
  const units = [];
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    const prev = word[i - 1];
    const prevIsVowel = prev && LONG_VOWELS.includes(prev) && units.length && units[units.length - 1].length > 1;
    // حرف المد يلتصق بالحرف السابق، إلا في أول الكلمة أو بعد مدّ آخر (يصير حرفاً صامتاً)
    if (LONG_VOWELS.includes(c) && i > 0 && units.length && !prevIsVowel && c !== 'آ') {
      units[units.length - 1] += c;
    } else {
      units.push(c);
    }
  }
  const syl = [];
  for (let k = 0; k < units.length; k++) {
    const u = units[k];
    // صامت + صامت قبل مقطع آخر = مقطع مغلق (مثل: قل-بي)
    if (u.length === 1 && units[k + 1]?.length === 1 && k + 2 < units.length) {
      syl.push(u + units[k + 1]);
      k++;
    } else {
      syl.push(u);
    }
  }
  // حرف صامت وحيد في آخر الكلمة يلتصق بما قبله
  if (syl.length > 1 && syl[syl.length - 1].length === 1) {
    const last = syl.pop();
    syl[syl.length - 1] += last;
  }
  return syl;
}

function syllabifyLatinWord(word) {
  const parts = word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
  return parts && parts.length ? parts : [word];
}

// يقبل تقطيعاً يدوياً بالشرطة: "حـ-بي-بي" أو "يا-حبي-بي"
export function syllabify(line) {
  const clean = line.replace(DIACRITICS, '').replace(/[.,!?؟،:;"«»()]/g, ' ').trim();
  if (!clean) return [];
  if (clean.includes('-')) return clean.split(/[\s-]+/).filter(Boolean);
  return clean
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (ARABIC.test(w) ? syllabifyArabicWord(w) : syllabifyLatinWord(w)));
}

export const linesOf = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

// يوزع مقاطع السطر على مسار نغمي ابتداءً من خطوة معينة
// إذا وُجدت نغمات في المسار يستخدمها بالترتيب، وإلا يضيف نغمات جديدة كل خطوتين
export function placeSyllables(track, syllables, startStep = 0) {
  const notes = [...track.notes];
  const lyrics = [...(track.lyrics || new Array(32).fill(''))];

  const noteSteps = [];
  for (let s = startStep; s < 32; s++) if (notes[s] > 0) noteSteps.push(s);
  const useExisting = noteSteps.length >= syllables.length;
  const gap = Math.max(1, Math.min(2, Math.floor((32 - startStep) / Math.max(1, syllables.length))));
  const melody = [1, 2, 3, 4, 5, 4, 3, 2];

  const steps = syllables.map((_, i) => (useExisting ? noteSteps[i] : startStep + i * gap)).filter((st) => st !== undefined && st <= 31);
  const end = steps.length ? steps[steps.length - 1] : startStep;
  for (let s = startStep; s <= end; s++) lyrics[s] = '';

  let placed = 0;
  syllables.forEach((syl, i) => {
    const step = steps[i];
    if (step === undefined || step > 31) return;
    if (!useExisting) notes[step] = notes[step] > 0 ? notes[step] : melody[i % melody.length];
    lyrics[step] = syl;
    placed++;
  });
  return { notes, lyrics, placed, total: syllables.length };
}

// يطبق رد Gemini: [{syllable, degree, length}] ابتداءً من خطوة (يمسح فقط المدى الذي يغطيه السطر)
export function applyComposedLine(track, items, startStep = 0) {
  const notes = [...track.notes];
  const lyrics = [...(track.lyrics || new Array(32).fill(''))];
  const placed = [];
  let step = startStep;
  for (const it of items) {
    if (step > 31) break;
    placed.push({ step, degree: Math.max(1, Math.min(8, Math.round(it.degree || 1))), syllable: it.syllable || '' });
    step += Math.max(1, Math.min(4, Math.round(it.length || 1)));
  }
  const end = Math.min(32, step);
  for (let s = startStep; s < end; s++) { lyrics[s] = ''; notes[s] = 0; }
  placed.forEach((p) => { notes[p.step] = p.degree; lyrics[p.step] = p.syllable; });
  return { notes, lyrics, end };
}
