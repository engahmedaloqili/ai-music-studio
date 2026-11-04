// ==========================================
// مكتبة المقامات والسلالم والآلات
// لإضافة مقام: أضف عنصراً في SCALES (8 درجات بأنصاف التون من القرار، 1.5 = ثلاثة أرباع تون).
// لإضافة آلة نغمية: أضف عنصراً في INSTRUMENT_PRESETS مع patch (وصف الصوت).
// لإضافة آلة إيقاع: أضف عنصراً مع kit (8 أصوات من DRUM_VOICES، الدرجة 1 → العنصر الأول).
// كل شيء هنا يظهر تلقائياً في الواجهة وفي أوامر Gemini.
// ==========================================

export const GROUPS = {
  arabic: 'شرقي / عربي',
  western: 'غربي',
  latin: 'لاتيني',
  world: 'عالمي',
};

// ترددات القرار المستخدمة
const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.0;
const HALF_FLAT = (f) => f * Math.pow(2, -0.5 / 12); // نصف بيمول (ربع تون)

export const SCALES = {
  // ---------- المقامات الشرقية ----------
  hijaz: { group: 'arabic', name: 'مقام الحجاز (Hijaz)', intervals: [0, 1, 4, 5, 7, 8, 10, 12], baseFreq: D3, description: 'طابع شرقي أصيل وعاطفي' },
  bayati: { group: 'arabic', name: 'مقام البياتي (Bayati)', intervals: [0, 1.5, 3, 5, 7, 8, 10, 12], baseFreq: D3, description: 'المقام الأكثر شيوعاً في الموسيقى العربية' },
  husseini: { group: 'arabic', name: 'مقام الحسيني (Husseini)', intervals: [0, 1.5, 3, 5, 7, 8.5, 10, 12], baseFreq: D3, description: 'من عائلة البياتي، واسع ومهيب' },
  bayati_shuri: { group: 'arabic', name: 'مقام البياتي شوري (Bayati Shuri)', intervals: [0, 1.5, 3, 5, 6, 9, 10, 12], baseFreq: D3, description: 'بياتي بلون حجازي في الأعلى' },
  rast: { group: 'arabic', name: 'مقام الراست (Rast)', intervals: [0, 2, 3.5, 5, 7, 9, 10.5, 12], baseFreq: C3, description: 'فخم، طربي، وأساس المقامات الشرقية' },
  suznak: { group: 'arabic', name: 'مقام السوزناك (Suznak)', intervals: [0, 2, 3.5, 5, 7, 8, 11, 12], baseFreq: C3, description: 'راست في الأسفل وحجاز في الأعلى' },
  nahawand: { group: 'arabic', name: 'مقام النهاوند (Nahawand)', intervals: [0, 2, 3, 5, 7, 8, 11, 12], baseFreq: C3, description: 'ناعم ودرامي قريب من السلم الصغير الغربي' },
  kurd: { group: 'arabic', name: 'مقام الكرد (Kurd)', intervals: [0, 1, 3, 5, 7, 8, 10, 12], baseFreq: D3, description: 'حالم ورومانسي وحديث' },
  athar_kurd: { group: 'arabic', name: 'مقام أثر كرد (Athar Kurd)', intervals: [0, 1, 3, 6, 7, 8, 11, 12], baseFreq: C3, description: 'غامض ومتوتر' },
  saba: { group: 'arabic', name: 'مقام الصبا (Saba)', intervals: [0, 1.5, 3, 4, 7, 8, 10, 12], baseFreq: D3, description: 'حزين وشجي جداً' },
  saba_zamzam: { group: 'arabic', name: 'مقام الصبا زمزم (Saba Zamzam)', intervals: [0, 1, 3, 4, 7, 8, 10, 12], baseFreq: D3, description: 'صبا بدون أرباع تون، أكثر حدة' },
  sikah: { group: 'arabic', name: 'مقام السيكاه (Sikah)', intervals: [0, 1.5, 3.5, 5.5, 7, 8.5, 10.5, 12], baseFreq: HALF_FLAT(E3), description: 'روحاني، شائع في الإنشاد والتلاوة' },
  huzam: { group: 'arabic', name: 'مقام الهزام (Huzam)', intervals: [0, 1.5, 3.5, 4.5, 7.5, 8.5, 10.5, 12], baseFreq: HALF_FLAT(E3), description: 'سيكاه مع حجاز، عاطفي وطربي' },
  iraq: { group: 'arabic', name: 'مقام العراق (Iraq)', intervals: [0, 1.5, 3.5, 5, 7, 8.5, 10.5, 12], baseFreq: HALF_FLAT(123.47), description: 'من عائلة السيكاه، عميق' },
  ajam: { group: 'arabic', name: 'مقام العجم (Ajam)', intervals: [0, 2, 4, 5, 7, 9, 11, 12], baseFreq: 116.54, description: 'مشرق وفرح، يقابل الماجور الغربي' },
  jiharkah: { group: 'arabic', name: 'مقام الجهاركاه (Jiharkah)', intervals: [0, 2, 4, 5, 7, 9, 10.5, 12], baseFreq: F3, description: 'عجم بلمسة شرقية في الأعلى' },
  nakriz: { group: 'arabic', name: 'مقام النكريز (Nakriz)', intervals: [0, 2, 3, 6, 7, 9, 10, 12], baseFreq: C3, description: 'شجن شعبي، شائع في الموسيقى الشامية' },
  nawa_athar: { group: 'arabic', name: 'مقام نوا أثر (Nawa Athar)', intervals: [0, 2, 3, 6, 7, 8, 11, 12], baseFreq: C3, description: 'درامي ومتوتر' },
  hijazkar: { group: 'arabic', name: 'مقام الحجازكار (Hijazkar)', intervals: [0, 1, 4, 5, 7, 8, 11, 12], baseFreq: C3, description: 'حجاز مزدوج، ملحمي' },
  shad_araban: { group: 'arabic', name: 'مقام شد عربان (Shadd Araban)', intervals: [0, 1, 4, 5, 6, 9, 10, 12], baseFreq: G3, description: 'حجاز متكرر بلون بدوي' },
  zanjaran: { group: 'arabic', name: 'مقام الزنجران (Zanjaran)', intervals: [0, 1, 4, 5, 7, 9, 10, 12], baseFreq: C3, description: 'حجاز مع عجم في الأعلى' },

  // ---------- السلالم الغربية ----------
  major: { group: 'western', name: 'ماجور (Major / Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11, 12], baseFreq: C3, description: 'سعيد ومشرق' },
  natural_minor: { group: 'western', name: 'مينور طبيعي (Natural Minor)', intervals: [0, 2, 3, 5, 7, 8, 10, 12], baseFreq: C3, description: 'حزين وهادئ' },
  harmonic_minor: { group: 'western', name: 'مينور هارموني (Harmonic Minor)', intervals: [0, 2, 3, 5, 7, 8, 11, 12], baseFreq: C3, description: 'كلاسيكي ودرامي' },
  melodic_minor: { group: 'western', name: 'مينور ميلودي (Melodic Minor)', intervals: [0, 2, 3, 5, 7, 9, 11, 12], baseFreq: C3, description: 'جاز وكلاسيك' },
  dorian: { group: 'western', name: 'دوريان (Dorian)', intervals: [0, 2, 3, 5, 7, 9, 10, 12], baseFreq: D3, description: 'فانك وجاز وروك' },
  phrygian: { group: 'western', name: 'فريجيان (Phrygian)', intervals: [0, 1, 3, 5, 7, 8, 10, 12], baseFreq: E3, description: 'مظلم، ميتال وفلامنكو' },
  lydian: { group: 'western', name: 'ليديان (Lydian)', intervals: [0, 2, 4, 6, 7, 9, 11, 12], baseFreq: F3, description: 'حالم، موسيقى أفلام' },
  mixolydian: { group: 'western', name: 'ميكسوليديان (Mixolydian)', intervals: [0, 2, 4, 5, 7, 9, 10, 12], baseFreq: G3, description: 'بلوز وروك' },
  locrian: { group: 'western', name: 'لوكريان (Locrian)', intervals: [0, 1, 3, 5, 6, 8, 10, 12], baseFreq: C3, description: 'غير مستقر ومتوتر' },
  major_pentatonic: { group: 'western', name: 'خماسي ماجور (Major Pentatonic)', intervals: [0, 2, 4, 7, 9, 12, 14, 16], baseFreq: C3, description: 'بوب وكانتري' },
  minor_pentatonic: { group: 'western', name: 'خماسي مينور (Minor Pentatonic)', intervals: [0, 3, 5, 7, 10, 12, 15, 17], baseFreq: C3, description: 'روك وبلوز' },
  blues: { group: 'western', name: 'بلوز (Blues)', intervals: [0, 3, 5, 6, 7, 10, 12, 15], baseFreq: C3, description: 'بلوز وجاز' },
  whole_tone: { group: 'western', name: 'التون الكامل (Whole Tone)', intervals: [0, 2, 4, 6, 8, 10, 12, 14], baseFreq: C3, description: 'حالم وغامض (ديبوسي)' },

  // ---------- السلالم اللاتينية ----------
  spanish_phrygian: { group: 'latin', name: 'فريجيان إسباني (Spanish Phrygian)', intervals: [0, 1, 4, 5, 7, 8, 10, 12], baseFreq: E3, description: 'فلامنكو أندلسي' },
  flamenco: { group: 'latin', name: 'فلامنكو (Flamenco Mode)', intervals: [0, 1, 3, 4, 5, 7, 8, 10], baseFreq: E3, description: 'السلم الإسباني ذو الثماني نغمات' },
  lydian_dominant: { group: 'latin', name: 'ليديان دومينانت (Bossa / Latin Jazz)', intervals: [0, 2, 4, 6, 7, 9, 10, 12], baseFreq: C3, description: 'بوسا نوفا ولاتين جاز' },
  andean: { group: 'latin', name: 'خماسي أنديزي (Andean Pentatonic)', intervals: [0, 3, 5, 7, 10, 12, 15, 17], baseFreq: D3, description: 'موسيقى جبال الأنديز' },
  tango: { group: 'latin', name: 'تانغو (Tango Minor)', intervals: [0, 2, 3, 5, 7, 8, 11, 12], baseFreq: D3, description: 'تانغو أرجنتيني' },
  son_cubano: { group: 'latin', name: 'سون كوبي (Son / Salsa Major)', intervals: [0, 2, 4, 5, 7, 9, 10, 12], baseFreq: G3, description: 'سالسا وسون كوبي' },

  // ---------- عالمي ----------
  hirajoshi: { group: 'world', name: 'هيراجوشي ياباني (Hirajoshi)', intervals: [0, 2, 3, 7, 8, 12, 14, 15], baseFreq: D3, description: 'ياباني تقليدي' },
  bhairav: { group: 'world', name: 'بهيراف هندي (Bhairav)', intervals: [0, 1, 4, 5, 7, 8, 11, 12], baseFreq: C3, description: 'راغا هندية صباحية' },
  persian: { group: 'world', name: 'فارسي (Persian)', intervals: [0, 1, 4, 5, 6, 8, 11, 12], baseFreq: C3, description: 'شرقي فارسي' },
};

// ==========================================
// أصوات الإيقاع (كل صوت = طبقات من نغمة منزلقة أو ضجيج مفلتر)
// tone: [شكل الموجة، التردد البدائي، التردد النهائي، المدة، القوة]
// noise: [نوع الفلتر، التردد، Q، المدة، القوة]
// ==========================================
const T = (wave, f0, f1, dur, gain) => ({ kind: 'tone', wave, f0, f1, dur, gain });
const N = (filter, freq, Q, dur, gain) => ({ kind: 'noise', filter, freq, Q, dur, gain });

export const DRUM_VOICES = {
  // شرقي
  doum: [T('sine', 145, 48, 0.22, 1.2)],
  tak: [T('triangle', 620, 240, 0.08, 0.8)],
  ka: [N('highpass', 5000, 0.7, 0.05, 0.45)],
  riq_dum: [T('sine', 220, 110, 0.15, 0.9)],
  riq_tak: [T('triangle', 900, 500, 0.05, 0.5), N('bandpass', 7000, 1, 0.12, 0.4)],
  riq_jingle: [N('bandpass', 8500, 0.8, 0.18, 0.5)],
  daf_low: [T('sine', 110, 55, 0.35, 1.1), N('lowpass', 400, 0.7, 0.08, 0.3)],
  daf_slap: [T('triangle', 400, 200, 0.07, 0.7), N('bandpass', 2500, 1, 0.06, 0.4)],
  tabl_low: [T('sine', 90, 40, 0.4, 1.4)],
  tabl_high: [T('triangle', 300, 150, 0.08, 0.8), N('highpass', 3000, 0.7, 0.04, 0.3)],
  // غربي
  kick: [T('sine', 150, 45, 0.3, 1.3)],
  snare: [T('triangle', 220, 180, 0.1, 0.5), N('highpass', 1500, 0.7, 0.18, 0.7)],
  clap: [N('bandpass', 1200, 1.5, 0.12, 0.9)],
  hat: [N('highpass', 7000, 0.7, 0.04, 0.4)],
  open_hat: [N('highpass', 6500, 0.7, 0.3, 0.35)],
  tom: [T('sine', 200, 110, 0.25, 0.9)],
  crash: [N('highpass', 4500, 0.7, 0.9, 0.35)],
  // لاتيني
  cajon_bass: [T('sine', 120, 60, 0.2, 1.1), N('lowpass', 300, 0.7, 0.05, 0.3)],
  cajon_slap: [N('bandpass', 2000, 1, 0.12, 0.7), T('triangle', 350, 250, 0.05, 0.4)],
  cajon_tap: [N('highpass', 3500, 0.7, 0.04, 0.3)],
  conga_low: [T('sine', 200, 185, 0.35, 0.9)],
  conga_high: [T('sine', 290, 275, 0.25, 0.9)],
  conga_slap: [T('triangle', 320, 300, 0.06, 0.6), N('bandpass', 2500, 1, 0.05, 0.5)],
  conga_mute: [T('sine', 300, 280, 0.05, 0.6)],
  bongo_low: [T('sine', 380, 360, 0.15, 0.8)],
  bongo_high: [T('sine', 520, 500, 0.12, 0.8)],
  bongo_mute: [T('sine', 500, 480, 0.04, 0.5)],
  timbale_low: [T('triangle', 350, 330, 0.3, 0.7), N('bandpass', 3000, 1, 0.1, 0.25)],
  timbale_high: [T('triangle', 480, 460, 0.25, 0.7), N('bandpass', 3500, 1, 0.1, 0.25)],
  rimshot: [T('square', 800, 700, 0.03, 0.4), N('highpass', 3000, 0.7, 0.03, 0.4)],
  cowbell: [T('square', 540, 540, 0.25, 0.3), T('square', 800, 800, 0.25, 0.25)],
  clave: [T('sine', 2500, 2500, 0.06, 0.8)],
  guiro: [N('bandpass', 3500, 3, 0.15, 0.5)],
  shaker: [N('highpass', 6000, 0.7, 0.07, 0.35)],
  shaker_accent: [N('highpass', 5000, 0.7, 0.1, 0.55)],
};

let noiseBufferCache = null;
function getNoiseBuffer(ctx) {
  if (!noiseBufferCache || noiseBufferCache.sampleRate !== ctx.sampleRate) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // ثانية واحدة
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBufferCache = buffer;
  }
  return noiseBufferCache;
}

export function playDrumVoice(ctx, voiceKey, output, now) {
  const layers = DRUM_VOICES[voiceKey];
  if (!layers) return;
  for (const l of layers) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(l.gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + l.dur);
    g.connect(output);
    if (l.kind === 'tone') {
      const osc = ctx.createOscillator();
      osc.type = l.wave;
      osc.frequency.setValueAtTime(l.f0, now);
      if (l.f1 !== l.f0) osc.frequency.exponentialRampToValueAtTime(l.f1, now + l.dur * 0.6);
      osc.connect(g);
      osc.start(now);
      osc.stop(now + l.dur + 0.02);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = getNoiseBuffer(ctx);
      const f = ctx.createBiquadFilter();
      f.type = l.filter;
      f.frequency.value = l.freq;
      f.Q.value = l.Q;
      src.connect(f);
      f.connect(g);
      src.start(now, Math.random() * 0.5);
      src.stop(now + l.dur + 0.02);
    }
  }
}

// ==========================================
// الآلات
// patch: w1/w2 شكلا الموجتين، r2 نسبة تردد الموجة الثانية، mix2 قوتها،
//   filter نوع الفلتر، fMul (مضاعف التردد) أو fHz (تردد ثابت)، fEndMul انزلاق الفلتر خلال fSweep ثانية، Q،
//   attack زمن الدخول، peak أعلى قوة، decay مدة الذيل بالثواني، decaySteps مدة إضافية بعدد الخطوات،
//   vib اهتزاز {rate بالهرتز، depth نسبة من التردد}
// kit: ثماني أصوات إيقاعية لدرجات 1..8 (1=دم، 3=تك، 5=كا حسب الاصطلاح)
// ==========================================
export const INSTRUMENT_PRESETS = {
  // ---------- شرقي (الأصوات الأصلية لهذه الآلات مبرمجة في App.tsx) ----------
  oud: { group: 'arabic', name: 'عود شرقي (Oud)', color: '#f59e0b', icon: '🪕', type: 'plucked', octave: 0 },
  qanun: { group: 'arabic', name: 'قانون (Qanun)', color: '#10b981', icon: '🎼', type: 'bright_plucked', octave: 1 },
  nay: { group: 'arabic', name: 'ناي (Nay)', color: '#06b6d4', icon: '🪈', type: 'wind', octave: 1 },
  strings: { group: 'arabic', name: 'وتريات عربية (Strings)', color: '#8b5cf6', icon: '🎻', type: 'pad', octave: 1 },
  buzuq: { group: 'arabic', name: 'بزق (Buzuq)', color: '#d97706', icon: '🪕', type: 'plucked', octave: 1,
    patch: { w1: 'sawtooth', w2: 'triangle', r2: 2.001, mix2: 0.4, filter: 'lowpass', fMul: 6, fEndMul: 2, fSweep: 0.3, Q: 2, attack: 0.005, peak: 1, decay: 0.5 } },
  kamanja: { group: 'arabic', name: 'كمنجة شرقية (Kamanja)', color: '#a855f7', icon: '🎻', type: 'bowed', octave: 1,
    patch: { w1: 'sawtooth', w2: 'sawtooth', r2: 1.003, mix2: 0.8, filter: 'lowpass', fMul: 4, Q: 1, attack: 0.07, peak: 0.7, decaySteps: 2, vib: { rate: 5.5, depth: 0.008 } } },
  accordion: { group: 'arabic', name: 'أكورديون شرقي (Accordion)', color: '#ef4444', icon: '🪗', type: 'reed', octave: 1,
    patch: { w1: 'square', w2: 'sawtooth', r2: 1.004, mix2: 0.7, filter: 'lowpass', fMul: 3.5, attack: 0.03, peak: 0.55, decaySteps: 2, vib: { rate: 6, depth: 0.003 } } },
  mizmar: { group: 'arabic', name: 'مزمار (Mizmar)', color: '#eab308', icon: '🎺', type: 'wind', octave: 1,
    patch: { w1: 'square', w2: 'sawtooth', r2: 1.001, mix2: 0.6, filter: 'bandpass', fMul: 2.5, Q: 2, attack: 0.03, peak: 0.8, decaySteps: 1.8, vib: { rate: 6.5, depth: 0.01 } } },
  darbuka: { group: 'arabic', name: 'إيقاع دربكة (Darbuka)', color: '#ec4899', icon: '🥁', type: 'percussion', octave: 0,
    kit: ['doum', 'tak', 'tak', 'tak', 'ka', 'ka', 'ka', 'ka'] },
  riq: { group: 'arabic', name: 'رق (Riq)', color: '#f472b6', icon: '🪘', type: 'percussion', octave: 0,
    kit: ['riq_dum', 'riq_tak', 'riq_tak', 'riq_jingle', 'riq_jingle', 'riq_jingle', 'riq_tak', 'riq_jingle'] },
  daf: { group: 'arabic', name: 'دف (Daf)', color: '#db2777', icon: '🪘', type: 'percussion', octave: 0,
    kit: ['daf_low', 'daf_low', 'daf_slap', 'daf_slap', 'riq_jingle', 'riq_jingle', 'daf_slap', 'daf_low'] },
  tabl: { group: 'arabic', name: 'طبل بلدي (Tabl)', color: '#be185d', icon: '🥁', type: 'percussion', octave: 0,
    kit: ['tabl_low', 'tabl_low', 'tabl_high', 'tabl_high', 'tabl_high', 'tabl_high', 'tabl_low', 'tabl_high'] },
  bass: { group: 'arabic', name: 'باص عميق (Sub Bass)', color: '#3b82f6', icon: '🎸', type: 'bass', octave: -1 },
  synth: { group: 'western', name: 'سينثسايزر حديث (Lead Synth)', color: '#f43f5e', icon: '🎹', type: 'synth', octave: 1 },

  // ---------- غربي ----------
  piano: { group: 'western', name: 'بيانو (Piano)', color: '#e2e8f0', icon: '🎹', type: 'keys', octave: 0,
    patch: { w1: 'triangle', w2: 'sine', r2: 2.001, mix2: 0.5, filter: 'lowpass', fMul: 6, fEndMul: 1.5, fSweep: 0.8, attack: 0.003, peak: 1, decay: 0.9 } },
  epiano: { group: 'western', name: 'بيانو كهربائي (Electric Piano)', color: '#fb923c', icon: '🎹', type: 'keys', octave: 0,
    patch: { w1: 'sine', w2: 'sine', r2: 3, mix2: 0.25, filter: 'lowpass', fHz: 3000, attack: 0.005, peak: 1, decay: 1.1, vib: { rate: 4, depth: 0.002 } } },
  organ: { group: 'western', name: 'أورغن (Organ)', color: '#84cc16', icon: '🎛️', type: 'keys', octave: 0,
    patch: { w1: 'sine', w2: 'sine', r2: 2, mix2: 0.6, filter: 'lowpass', fHz: 4000, attack: 0.01, peak: 0.5, decaySteps: 2.2, tail: 0.3 } },
  acoustic_guitar: { group: 'western', name: 'جيتار أكوستيك (Acoustic Guitar)', color: '#ca8a04', icon: '🎸', type: 'plucked', octave: 0,
    patch: { w1: 'triangle', w2: 'sawtooth', r2: 1.003, mix2: 0.4, filter: 'lowpass', fMul: 5, fEndMul: 1.6, fSweep: 0.35, attack: 0.004, peak: 1, decay: 0.55 } },
  electric_guitar: { group: 'western', name: 'جيتار كهربائي (Electric Guitar)', color: '#dc2626', icon: '🎸', type: 'plucked', octave: 0,
    patch: { w1: 'sawtooth', w2: 'square', r2: 1.005, mix2: 0.8, filter: 'lowpass', fHz: 2200, Q: 4, attack: 0.005, peak: 0.7, decay: 0.5, decaySteps: 1 } },
  violin: { group: 'western', name: 'كمان (Violin)', color: '#9333ea', icon: '🎻', type: 'bowed', octave: 1,
    patch: { w1: 'sawtooth', w2: 'sawtooth', r2: 1.006, mix2: 0.8, filter: 'lowpass', fMul: 3, attack: 0.1, peak: 0.7, decaySteps: 2, vib: { rate: 5.5, depth: 0.007 } } },
  cello: { group: 'western', name: 'تشيلو (Cello)', color: '#7c3aed', icon: '🎻', type: 'bowed', octave: -1,
    patch: { w1: 'sawtooth', w2: 'sawtooth', r2: 1.004, mix2: 0.8, filter: 'lowpass', fMul: 3, attack: 0.1, peak: 0.75, decaySteps: 2.2, vib: { rate: 5, depth: 0.006 } } },
  upright_bass: { group: 'western', name: 'كونترباص (Upright Bass)', color: '#1d4ed8', icon: '🎻', type: 'bass', octave: -1,
    patch: { w1: 'triangle', w2: 'sine', r2: 0.5, mix2: 0.6, filter: 'lowpass', fHz: 600, attack: 0.01, peak: 1.1, decay: 0.45 } },
  harp: { group: 'western', name: 'هارب (Harp)', color: '#f9a8d4', icon: '🪉', type: 'plucked', octave: 1,
    patch: { w1: 'triangle', w2: 'sine', r2: 2, mix2: 0.3, filter: 'lowpass', fMul: 5, attack: 0.002, peak: 0.9, decay: 1.2 } },
  flute: { group: 'western', name: 'فلوت (Flute)', color: '#22d3ee', icon: '🪈', type: 'wind', octave: 1,
    patch: { w1: 'sine', w2: 'triangle', r2: 2, mix2: 0.15, filter: 'lowpass', fMul: 3, attack: 0.05, peak: 0.7, decaySteps: 1.6, vib: { rate: 5, depth: 0.006 } } },
  clarinet: { group: 'western', name: 'كلارينيت (Clarinet)', color: '#0ea5e9', icon: '🎷', type: 'wind', octave: 0,
    patch: { w1: 'square', w2: 'triangle', r2: 1.002, mix2: 0.5, filter: 'lowpass', fMul: 2.5, attack: 0.04, peak: 0.55, decaySteps: 1.8, vib: { rate: 5, depth: 0.003 } } },
  saxophone: { group: 'western', name: 'ساكسفون (Saxophone)', color: '#facc15', icon: '🎷', type: 'wind', octave: 0,
    patch: { w1: 'sawtooth', w2: 'square', r2: 1.003, mix2: 0.6, filter: 'bandpass', fMul: 3, Q: 1.2, attack: 0.04, peak: 0.8, decaySteps: 1.8, vib: { rate: 5, depth: 0.008 } } },
  trumpet: { group: 'western', name: 'ترومبيت (Trumpet)', color: '#fbbf24', icon: '🎺', type: 'brass', octave: 1,
    patch: { w1: 'sawtooth', w2: 'square', r2: 1.002, mix2: 0.4, filter: 'lowpass', fMul: 2, fEndMul: 5, fSweep: 0.06, attack: 0.03, peak: 0.65, decaySteps: 1.6, vib: { rate: 5.5, depth: 0.004 } } },
  trombone: { group: 'western', name: 'ترومبون (Trombone)', color: '#b45309', icon: '🎺', type: 'brass', octave: -1,
    patch: { w1: 'sawtooth', w2: 'sawtooth', r2: 1.003, mix2: 0.6, filter: 'lowpass', fMul: 1.5, fEndMul: 4, fSweep: 0.1, attack: 0.05, peak: 0.7, decaySteps: 1.8 } },
  glockenspiel: { group: 'western', name: 'جلوكنشبيل (Glockenspiel)', color: '#fde047', icon: '🔔', type: 'mallet', octave: 2,
    patch: { w1: 'sine', w2: 'sine', r2: 4, mix2: 0.3, filter: 'lowpass', fHz: 9000, attack: 0.002, peak: 0.8, decay: 0.9 } },
  choir: { group: 'western', name: 'كورال (Choir Pad)', color: '#c4b5fd', icon: '🎤', type: 'pad', octave: 0,
    patch: { w1: 'sawtooth', w2: 'sawtooth', r2: 1.006, mix2: 0.9, filter: 'lowpass', fHz: 1200, Q: 1, attack: 0.2, peak: 0.45, decaySteps: 2.5, vib: { rate: 4.5, depth: 0.004 } } },
  drumkit: { group: 'western', name: 'طقم درامز (Drum Kit)', color: '#f43f5e', icon: '🥁', type: 'percussion', octave: 0,
    kit: ['kick', 'kick', 'snare', 'clap', 'hat', 'open_hat', 'tom', 'crash'] },

  // ---------- لاتيني ----------
  spanish_guitar: { group: 'latin', name: 'جيتار إسباني (Flamenco Guitar)', color: '#c2410c', icon: '🎸', type: 'plucked', octave: 0,
    patch: { w1: 'triangle', w2: 'triangle', r2: 2.002, mix2: 0.35, filter: 'lowpass', fMul: 4, fEndMul: 1.3, fSweep: 0.3, attack: 0.003, peak: 1, decay: 0.6 } },
  tres: { group: 'latin', name: 'تريس كوبي (Tres Cubano)', color: '#ea580c', icon: '🪕', type: 'plucked', octave: 1,
    patch: { w1: 'sawtooth', w2: 'triangle', r2: 2.003, mix2: 0.6, filter: 'lowpass', fMul: 5, fEndMul: 1.8, fSweep: 0.25, attack: 0.003, peak: 0.9, decay: 0.45 } },
  charango: { group: 'latin', name: 'شارانغو (Charango)', color: '#f97316', icon: '🪕', type: 'plucked', octave: 1,
    patch: { w1: 'sawtooth', w2: 'sawtooth', r2: 2.004, mix2: 0.5, filter: 'lowpass', fMul: 6, fEndMul: 2, fSweep: 0.2, attack: 0.002, peak: 0.8, decay: 0.4 } },
  marimba: { group: 'latin', name: 'ماريمبا (Marimba)', color: '#a16207', icon: '🪵', type: 'mallet', octave: 1,
    patch: { w1: 'sine', w2: 'sine', r2: 4, mix2: 0.25, filter: 'lowpass', fHz: 5000, attack: 0.002, peak: 1, decay: 0.45 } },
  steel_drum: { group: 'latin', name: 'ستيل درام (Steel Drum)', color: '#14b8a6', icon: '🛢️', type: 'mallet', octave: 1,
    patch: { w1: 'sine', w2: 'triangle', r2: 2.01, mix2: 0.4, filter: 'bandpass', fMul: 2, Q: 1, attack: 0.004, peak: 1, decay: 0.7 } },
  pan_flute: { group: 'latin', name: 'ناي أنديزي (Pan Flute)', color: '#2dd4bf', icon: '🪈', type: 'wind', octave: 1,
    patch: { w1: 'sine', w2: 'triangle', r2: 1.002, mix2: 0.2, filter: 'lowpass', fMul: 2.5, attack: 0.04, peak: 0.75, decaySteps: 1.6, vib: { rate: 4.5, depth: 0.005 } } },
  bandoneon: { group: 'latin', name: 'باندونيون تانغو (Bandoneon)', color: '#991b1b', icon: '🪗', type: 'reed', octave: 0,
    patch: { w1: 'square', w2: 'sawtooth', r2: 1.003, mix2: 0.6, filter: 'lowpass', fMul: 3, attack: 0.04, peak: 0.55, decaySteps: 2 } },
  congas: { group: 'latin', name: 'كونغا (Congas)', color: '#b91c1c', icon: '🪘', type: 'percussion', octave: 0,
    kit: ['conga_low', 'conga_low', 'conga_slap', 'conga_high', 'conga_mute', 'conga_high', 'conga_low', 'conga_slap'] },
  bongos: { group: 'latin', name: 'بونغو (Bongos)', color: '#c2410c', icon: '🪘', type: 'percussion', octave: 0,
    kit: ['bongo_low', 'bongo_low', 'bongo_high', 'bongo_high', 'bongo_mute', 'bongo_high', 'bongo_low', 'bongo_high'] },
  timbales: { group: 'latin', name: 'تيمباليس (Timbales)', color: '#9f1239', icon: '🥁', type: 'percussion', octave: 0,
    kit: ['timbale_low', 'timbale_low', 'timbale_high', 'rimshot', 'cowbell', 'cowbell', 'timbale_high', 'crash'] },
  cajon: { group: 'latin', name: 'كاخون (Cajón)', color: '#78350f', icon: '📦', type: 'percussion', octave: 0,
    kit: ['cajon_bass', 'cajon_bass', 'cajon_slap', 'cajon_slap', 'cajon_tap', 'cajon_tap', 'cajon_slap', 'cajon_tap'] },
  latin_hand: { group: 'latin', name: 'كلافيس وكاوبل وغويرو (Claves/Cowbell/Güiro)', color: '#fb7185', icon: '🔔', type: 'percussion', octave: 0,
    kit: ['cowbell', 'cowbell', 'clave', 'clave', 'guiro', 'guiro', 'clave', 'cowbell'] },
  maracas: { group: 'latin', name: 'ماراكاس (Maracas / Shaker)', color: '#fda4af', icon: '🪇', type: 'percussion', octave: 0,
    kit: ['shaker_accent', 'shaker', 'shaker_accent', 'shaker', 'shaker', 'shaker', 'shaker_accent', 'shaker'] },
};

export const isPercussion = (instKey) => Boolean(INSTRUMENT_PRESETS[instKey]?.kit);

// قوائم مختصرة تُرسل لـ Gemini
export const scaleCatalogForAI = () =>
  Object.entries(SCALES).map(([k, s]) => `${k} = ${s.name}`).join('\n');
export const instrumentCatalogForAI = () =>
  Object.entries(INSTRUMENT_PRESETS).map(([k, i]) => `${k} = ${i.name}${i.kit ? ' [إيقاع]' : ''}`).join('\n');
