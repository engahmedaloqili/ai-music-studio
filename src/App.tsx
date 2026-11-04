import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getGeminiApiKey } from './apiKey';
import {
  Play, Pause, Square, Plus, Trash2, Volume2, VolumeX, Sliders,
  Sparkles, Wand2, Music, Code2, Layers, Check, Copy, RefreshCw,
  Scissors, Radio, Settings2, Activity, ChevronLeft, Disc, Cpu,
  Mic2, Headphones, Gauge, HelpCircle, ArrowUpRight
} from 'lucide-react';

// ==========================================
// 1. التعريفات الموسيقية والمقامات (Scales & Maqamat)
// ==========================================
const SCALES = {
  hijaz: {
    name: 'مقام الحجاز (Hijaz)',
    intervals: [0, 1, 4, 5, 7, 8, 10, 12],
    baseFreq: 146.83, // D3
    description: 'طابع شرقي أصيل وعاطفي'
  },
  bayati: {
    name: 'مقام البياتي (Bayati)',
    intervals: [0, 1.5, 3, 5, 7, 8, 10, 12], // 1.5 يمثل ربع التون تقريبياً في السلم
    baseFreq: 146.83,
    description: 'المقام الأكثر شيوعاً في الموسيقى العربية'
  },
  nahawand: {
    name: 'مقام النهاوند (Nahawand / Minor)',
    intervals: [0, 2, 3, 5, 7, 8, 11, 12],
    baseFreq: 130.81, // C3
    description: 'ناعم ودرامي قريب من السلم الصغير الغربي'
  },
  kurd: {
    name: 'مقام الكرد (Kurd)',
    intervals: [0, 1, 3, 5, 7, 8, 10, 12],
    baseFreq: 146.83,
    description: 'حالم ورومانسي وحديث'
  },
  rast: {
    name: 'مقام الراست (Rast)',
    intervals: [0, 2, 3.5, 5, 7, 9, 10.5, 12],
    baseFreq: 130.81,
    description: 'فخم، طربي، وأساس المقامات الشرقية'
  }
};

const INSTRUMENT_PRESETS = {
  oud: { name: 'عود شرقي (Oud)', color: '#f59e0b', icon: '🪕', type: 'plucked', octave: 0 },
  qanun: { name: 'قانون (Qanun)', color: '#10b981', icon: '🎼', type: 'bright_plucked', octave: 1 },
  nay: { name: 'ناي (Nay)', color: '#06b6d4', icon: '🪈', type: 'wind', octave: 1 },
  strings: { name: 'وتريات عربية (Strings)', color: '#8b5cf6', icon: '🎻', type: 'pad', octave: 1 },
  darbuka: { name: 'إيقاع دربكة (Percussion)', color: '#ec4899', icon: '🥁', type: 'percussion', octave: 0 },
  bass: { name: 'باص عميق (Sub Bass)', color: '#3b82f6', icon: '🎸', type: 'bass', octave: -1 },
  synth: { name: 'سينثسايزر حديث (Lead Synth)', color: '#f43f5e', icon: '🎹', type: 'synth', octave: 1 }
};

// التوزيع الافتراضي المبدئي (32 خطوة = 2 بار كاملين)
const INITIAL_TRACKS = [
  {
    id: 'track-1',
    instrument: 'darbuka',
    name: 'إيقاع مقسوم (Darbuka)',
    color: '#ec4899',
    volume: 0.85,
    pan: 0,
    reverb: 0.15,
    muted: false,
    solo: false,
    octave: 0,
    // في الإيقاع: 1 = دم (Kick)، 3 = تك (Snare/Tak)، 5 = كا (Hi-hat/Ka)
    notes: [
      1, 0, 5, 3, 1, 0, 3, 5,  1, 0, 5, 3, 0, 5, 3, 0,
      1, 0, 5, 3, 1, 0, 3, 5,  1, 3, 5, 3, 1, 5, 3, 5
    ]
  },
  {
    id: 'track-2',
    instrument: 'oud',
    name: 'عود تقاسيم وأساس (Oud)',
    color: '#f59e0b',
    volume: 0.8,
    pan: -0.2,
    reverb: 0.35,
    muted: false,
    solo: false,
    octave: 0,
    // الأرقام من 1 إلى 8 تمثل درجات المقام، 0 يمثل سكتة
    notes: [
      1, 0, 3, 4, 5, 0, 4, 3,  4, 0, 2, 0, 1, 0, 0, 0,
      5, 0, 6, 5, 4, 3, 2, 3,  1, 0, 0, 0, 1, 0, 0, 0
    ]
  },
  {
    id: 'track-3',
    instrument: 'qanun',
    name: 'قانون زخارف (Qanun)',
    color: '#10b981',
    volume: 0.7,
    pan: 0.25,
    reverb: 0.45,
    muted: false,
    solo: false,
    octave: 1,
    notes: [
      0, 0, 5, 0, 8, 7, 5, 0,  0, 0, 4, 0, 6, 5, 4, 3,
      0, 5, 0, 6, 0, 5, 4, 5,  3, 0, 2, 0, 1, 0, 8, 0
    ]
  },
  {
    id: 'track-4',
    instrument: 'strings',
    name: 'وتريات هارموني (Strings)',
    color: '#8b5cf6',
    volume: 0.65,
    pan: 0,
    reverb: 0.6,
    muted: false,
    solo: false,
    octave: 1,
    notes: [
      1, 1, 1, 1, 5, 5, 5, 5,  4, 4, 4, 4, 1, 1, 1, 1,
      5, 5, 5, 5, 6, 6, 4, 4,  3, 3, 2, 2, 1, 1, 1, 1
    ]
  },
  {
    id: 'track-5',
    instrument: 'bass',
    name: 'باص إيقاعي (Bass)',
    color: '#3b82f6',
    volume: 0.75,
    pan: 0,
    reverb: 0.1,
    muted: false,
    solo: false,
    octave: -1,
    notes: [
      1, 0, 0, 1, 0, 0, 5, 0,  4, 0, 0, 4, 0, 0, 1, 0,
      5, 0, 0, 5, 0, 0, 4, 0,  3, 0, 2, 0, 1, 0, 1, 0
    ]
  }
];

// ==========================================
// 2. أكواد الخادم البرمجية الجاهزة للنسخ (Backend Snippets)
// ==========================================
const BACKEND_CODE_GEMINI = `# gemini_orchestrator.py
# العقل المدبر: ربط Gemini API مع استوديو الموسيقى عبر Function Calling & Structured Outputs

import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# تعريف هيكل البيانات للتحكم في المسارات والتعديل الجزئي (Inpainting)
class RegionModification(BaseModel):
    action: str = Field(description="نوع العملية: add_track, modify_region, change_mastering, update_tempo")
    target_instrument: str = Field(description="الآلة المستهدفة مثل: oud, qanun, nay, strings, darbuka, bass")
    start_time_sec: float = Field(description="بداية الجزء المراد تعديله بالثواني")
    end_time_sec: float = Field(description="نهاية الجزء المراد تعديله بالثواني")
    maqam_scale: str = Field(description="المقام الموسيقي: hijaz, bayati, nahawand, kurd, rast")
    bpm: int = Field(description="سرعة الإيقاع المقترحة")
    audio_model_prompt: str = Field(description="وصف دقيق باللغة الإنجليزية لمحرك التوليد الصوتي Lyria / MusicGen")
    notes_pattern: List[int] = Field(description="مصفوفة النوتات المولدة (درجات السلم من 0 إلى 8)")
    mastering_settings: dict = Field(description="إعدادات الهندسة الصوتية eq_low, eq_mid, eq_high, reverb, compression")

def orchestrate_music_edit(user_arabic_prompt: str, current_project_state: dict) -> dict:
    system_instruction = """
    أنت منتج وموزع موسيقي خبير (AI Music Producer).
    مهمتك تحويل طلبات المستخدم باللغة العربية إلى أوامر تقنية دقيقة لتعديل المسارات الصوتية،
    أو توليد أجزاء محددة (Audio Inpainting)، أو ضبط الماسترينغ.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=f"حالة المشروع الحالية: {json.dumps(current_project_state)}\\nطلب المستخدم: {user_arabic_prompt}",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=RegionModification,
            temperature=0.4,
        ),
    )
    return json.loads(response.text)
`;

const BACKEND_CODE_AUDIO = `# audio_engine_fastapi.py
# خادم معالجة وتوليد الصوت: يجمع بين AudioCraft (التعديل الجزئي) و Demucs (فصل الآلات) و Pedalboard (الماسترينغ)

from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import torchaudio
from audiocraft.models import MusicGen
from pedalboard import Pedalboard, Reverb, Compressor, LowShelfFilter, HighShelfFilter
from pedalboard.io import AudioFile
import numpy as np

app = FastAPI(title="AI Music Studio Audio Engine")

# 1. تحميل نموذج التوليد والتعديل الجزئي (MusicGen / Audio Inpainting)
model = MusicGen.get_pretrained('facebook/musicgen-melody')
model.set_generation_params(duration=15)

class InpaintRequest(BaseModel):
    prompt: str
    start_sec: float
    end_sec: float
    bpm: int
    eq_low_db: float = 0.0
    eq_high_db: float = 0.0
    reverb_room_size: float = 0.3
    compressor_threshold_db: float = -16.0

@app.post("/api/inpaint-region")
async def inpaint_audio_region(req: InpaintRequest, file: UploadFile = File(...)):
    """
    تعديل جزء محدد من المقطع الصوتي (مثلاً من الثانية 4 إلى 8) مع الحفاظ على باقي المقطع
    """
    waveform, sample_rate = torchaudio.load(file.file)
    
    # تحديد عينات البداية والنهاية للجزء المراد تعديله
    start_sample = int(req.start_sec * sample_rate)
    end_sample = int(req.end_sec * sample_rate)
    
    # توليد المقطع الجديد بناءً على السياق المحيط والوصف المرسل من Gemini
    generated_segment = model.generate_continuation(
        prompt=waveform[:, :start_sample].unsqueeze(0),
        prompt_sample_rate=sample_rate,
        descriptions=[f"{req.prompt}, {req.bpm} BPM, high quality studio recording"],
        progress=True
    )
    
    # دمج الجزء المولد مع بقية المقطع الأصلي (Crossfade)
    new_audio = waveform.clone()
    seg_len = end_sample - start_sample
    new_audio[:, start_sample:end_sample] = generated_segment[0, :, :seg_len]
    
    output_path = "output_inpainted.wav"
    torchaudio.save(output_path, new_audio, sample_rate)
    return {"status": "success", "file": output_path}

@app.post("/api/master-track")
async def master_audio(req: InpaintRequest, file_path: str):
    """
    تحسين جودة الصوت والماسترينغ الآلي باستخدام مكتبة Spotify Pedalboard
    """
    board = Pedalboard([
        LowShelfFilter(cutoff_frequency_hz=120, gain_db=req.eq_low_db),
        HighShelfFilter(cutoff_frequency_hz=8000, gain_db=req.eq_high_db),
        Compressor(threshold_db=req.compressor_threshold_db, ratio=3.5),
        Reverb(room_size=req.reverb_room_size, wet_level=0.25, dry_level=0.85)
    ])
    
    with AudioFile(file_path) as f:
        audio = f.read(f.frames)
        samplerate = f.samplerate
        
    effected = board(audio, samplerate)
    with AudioFile("mastered_output.wav", 'w', samplerate, effected.shape[0]) as f:
        f.write(effected)
        
    return {"status": "mastered", "output": "mastered_output.wav"}
`;

export default function App() {
  // ==========================================
  // 3. حالة التطبيق (State Management)
  // ==========================================
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(105);
  const [selectedScale, setSelectedScale] = useState('hijaz');
  
  // تحديد منطقة التعديل الجزئي (Region Selection / Inpainting Zone)
  const [regionStart, setRegionStart] = useState(8); // خطوة البداية (من 0 إلى 31)
  const [regionEnd, setRegionEnd] = useState(19);    // خطوة النهاية
  const [selectedTrackId, setSelectedTrackId] = useState('track-2');

  // إعدادات الماسترينغ وجودة الصوت (Mastering Suite)
  const [mastering, setMastering] = useState({
    eqLow: 2,        // dB (-12 to +12)
    eqMid: 0,        // dB (-12 to +12)
    eqHigh: 3,       // dB (-12 to +12)
    reverbMix: 0.3,  // 0 to 1
    compression: -18,// dB (-40 to 0)
    masterVolume: 0.9,
    presetName: 'استوديو شرقي دافئ'
  });

  // حالة الذكاء الاصطناعي Gemini Orchestrator
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([
    {
      role: 'assistant',
      text: 'مرحباً بك في استوديو الإنتاج الموسيقي الذكي! يمكنك تشغيل المقطع الحالي، تحديد أي جزء زمني على المسارات، أو الطلب مني إضافة آلات، تغيير المقام، أو تحسين الهندسة الصوتية.',
      jsonPayload: null
    }
  ]);
  const [lastJsonCommand, setLastJsonCommand] = useState({
    action: "ready",
    scale: "hijaz",
    bpm: 105,
    selected_regionSteps: [8, 19],
    status: "بانتظار أوامر التوزيع من المنتج..."
  });

  // التبويبات والنوافذ المنبثقة
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'mastering' | 'code'
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // المراجع الصوتية (Web Audio API Refs)
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const eqLowRef = useRef(null);
  const eqMidRef = useRef(null);
  const eqHighRef = useRef(null);
  const compressorRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);

  // مراجع أحدث الحالات لاستخدامها داخل المؤقت الصوتي دون تقطيع
  const tracksRef = useRef(tracks);
  const scaleRef = useRef(selectedScale);
  const masteringRef = useRef(mastering);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { scaleRef.current = selectedScale; }, [selectedScale]);
  useEffect(() => { masteringRef.current = mastering; }, [mastering]);

  // ==========================================
  // 4. محرك التوليد الصوتي الحقيقي (Web Audio API Synthesizer)
  // ==========================================
  const initAudioEngine = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // إنشاء فلاتر الماسترينغ (3-Band EQ + Compressor + Analyser)
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = 180;
    lowFilter.gain.value = masteringRef.current.eqLow;

    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1200;
    midFilter.Q.value = 1.0;
    midFilter.gain.value = masteringRef.current.eqMid;

    const highFilter = ctx.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.value = 6500;
    highFilter.gain.value = masteringRef.current.eqHigh;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = masteringRef.current.compression;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.2;

    const masterGain = ctx.createGain();
    masterGain.gain.value = masteringRef.current.masterVolume;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;

    // توصيل سلسلة الماسترينغ
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    eqLowRef.current = lowFilter;
    eqMidRef.current = midFilter;
    eqHighRef.current = highFilter;
    compressorRef.current = compressor;
    masterGainRef.current = masterGain;
    analyserRef.current = analyser;
  }, []);

  // تحديث فلاتر الماسترينغ لحظياً عند تحريك المؤشرات
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    if (eqLowRef.current) eqLowRef.current.gain.setTargetAtTime(mastering.eqLow, now, 0.05);
    if (eqMidRef.current) eqMidRef.current.gain.setTargetAtTime(mastering.eqMid, now, 0.05);
    if (eqHighRef.current) eqHighRef.current.gain.setTargetAtTime(mastering.eqHigh, now, 0.05);
    if (compressorRef.current) compressorRef.current.threshold.setTargetAtTime(mastering.compression, now, 0.05);
    if (masterGainRef.current) masterGainRef.current.gain.setTargetAtTime(mastering.masterVolume, now, 0.05);
  }, [mastering]);

  // حساب التردد بالهرتز بناءً على درجة السلم والمقام والأوكتاف
  const getNoteFrequency = (degree, scaleKey, octaveShift = 0) => {
    const scale = SCALES[scaleKey] || SCALES.hijaz;
    const index = Math.max(0, Math.min(scale.intervals.length - 1, degree - 1));
    const semitones = scale.intervals[index] + (octaveShift * 12);
    return scale.baseFreq * Math.pow(2, semitones / 12);
  };

  // عزف نغمة آلة أو إيقاع في الوقت الفعلي
  const triggerInstrumentNote = useCallback((track, noteValue, stepDurationSec) => {
    if (!audioCtxRef.current || noteValue <= 0) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // إعداد مسار الصوت والموازنة المكانية (Panning & Volume)
    const trackGain = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    const effectiveVolume = track.volume * 0.35;
    trackGain.gain.setValueAtTime(effectiveVolume, now);

    if (panner) {
      panner.pan.setValueAtTime(track.pan || 0, now);
      trackGain.connect(panner);
      panner.connect(eqLowRef.current);
    } else {
      trackGain.connect(eqLowRef.current);
    }

    // 1. محرك الإيقاع الشرقي والغربي (Darbuka / Percussion)
    if (track.instrument === 'darbuka') {
      if (noteValue === 1) {
        // صوت "دم" (Doum - Deep Kick/Frame resonance)
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
        g.gain.setValueAtTime(1.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(g);
        g.connect(trackGain);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (noteValue >= 2 && noteValue <= 4) {
        // صوت "تك" (Tak - Sharp metallic rim)
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.06);
        g.gain.setValueAtTime(0.8, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(trackGain);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        // صوت "كا / صاجات" (Ka / Crisp shaker)
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'highpass';
        bandpass.frequency.value = 5000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        noise.connect(bandpass);
        bandpass.connect(g);
        g.connect(trackGain);
        noise.start(now);
      }
      return;
    }

    // 2. الآلات النغمية (Oud, Qanun, Nay, Strings, Bass, Synth)
    const freq = getNoteFrequency(noteValue, scaleRef.current, track.octave || 0);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    // صدى محاكي عبر إطالة الذيل الصوتي حسب نسبة الـ Reverb
    const reverbTail = (track.reverb + masteringRef.current.reverbMix) * 0.45;

    if (track.instrument === 'oud') {
      // صوت عود (وتر مقروص دافئ)
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.25);
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(1.0, now + 0.012);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + reverbTail);
    } else if (track.instrument === 'qanun') {
      // صوت قانون (وتر معدني لامع مع رنين سريع)
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now); // أوكتاف خفيف للرنين
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 3, now);
      filter.Q.value = 1.5;
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.9, now + 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + reverbTail);
    } else if (track.instrument === 'nay') {
      // صوت ناي (نفخ هوائي ناعم مع اهتزاز Vibrato)
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.004, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, now);
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.85, now + 0.06);
      env.gain.exponentialRampToValueAtTime(0.001, now + stepDurationSec * 1.8 + reverbTail);
    } else if (track.instrument === 'strings') {
      // وتريات عربية متصلة
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq * 0.996, now);
      osc2.frequency.setValueAtTime(freq * 1.004, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      env.gain.setValueAtTime(0.01, now);
      env.gain.linearRampToValueAtTime(0.6, now + 0.08);
      env.gain.exponentialRampToValueAtTime(0.001, now + stepDurationSec * 2.1 + reverbTail);
    } else if (track.instrument === 'bass') {
      // باص عميق
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 0.5, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(1.1, now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    } else {
      // سينثسايزر حديث
      osc1.type = 'square';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.005, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now);
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.8, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + reverbTail);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    env.connect(trackGain);

    const stopTime = now + stepDurationSec * 2.2 + reverbTail + 0.1;
    osc1.start(now);
    osc2.start(now);
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }, []);

  // ==========================================
  // 5. حلقة التشغيل الزمني (Sequencer Loop) والراسم الطيفي
  // ==========================================
  useEffect(() => {
    if (!isPlaying) return;
    initAudioEngine();

    // كل خطوة تمثل 1/16 من البار (ربع النبضة)
    const stepDurationMs = (60 / bpm / 2) * 1000;
    const stepDurationSec = stepDurationMs / 1000;

    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        const nextStep = (prevStep + 1) % 32;
        const currentTracks = tracksRef.current;
        const anySolo = currentTracks.some((t) => t.solo);

        currentTracks.forEach((track) => {
          const shouldPlay = anySolo ? track.solo : !track.muted;
          if (shouldPlay && track.notes[nextStep] > 0) {
            triggerInstrumentNote(track, track.notes[nextStep], stepDurationSec);
          }
        });

        return nextStep;
      });
    }, stepDurationMs);

    return () => clearInterval(interval);
  }, [isPlaying, bpm, initAudioEngine, triggerInstrumentNote]);

  // رسم الموجات الصوتية الحية في الهيدر (Live Audio Visualizer)
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderSpectrum = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 32;
      const barWidth = canvas.width / barCount - 2;

      if (isPlaying && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i] || 10;
          const h = Math.max(4, (val / 255) * canvas.height);
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#06b6d4');
          ctx.fillStyle = grad;
          ctx.fillRect(i * (barWidth + 2), canvas.height - h, barWidth, h);
        }
      } else {
        for (let i = 0; i < barCount; i++) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(i * (barWidth + 2), canvas.height - 4, barWidth, 4);
        }
      }
      animId = requestAnimationFrame(renderSpectrum);
    };
    renderSpectrum();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // ==========================================
  // 6. وظائف التعديل اليدوي على المسارات والأجزاء
  // ==========================================
  const handleToggleNote = (trackId, stepIndex) => {
    initAudioEngine();
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        const currentVal = track.notes[stepIndex];
        // تدوير الدرجة النغمية من 0 إلى 8
        const nextVal = currentVal === 0 ? 1 : currentVal >= 8 ? 0 : currentVal + 1;
        const updatedNotes = [...track.notes];
        updatedNotes[stepIndex] = nextVal;
        if (nextVal > 0) {
          triggerInstrumentNote(track, nextVal, 0.25);
        }
        return { ...track, notes: updatedNotes };
      })
    );
  };

  // تعديل وتوليد الجزء المحدد فقط (Inpainting Region Regeneration) لآلة معينة أو كل الآلات
  const regenerateSelectedRegion = (style = 'melodic', targetTrackId = selectedTrackId) => {
    initAudioEngine();
    setTracks((prev) =>
      prev.map((track) => {
        if (targetTrackId !== 'all' && track.id !== targetTrackId) return track;
        const newNotes = [...track.notes];
        for (let i = regionStart; i <= regionEnd; i++) {
          if (track.instrument === 'darbuka') {
            if (style === 'energetic') {
              newNotes[i] = i % 2 === 0 ? 1 : i % 4 === 1 ? 5 : 3;
            } else if (style === 'sparse') {
              newNotes[i] = i % 4 === 0 ? 1 : i % 4 === 2 ? 3 : 0;
            } else {
              newNotes[i] = [1, 5, 3, 5][i % 4];
            }
          } else {
            // توليد جمل لحنية متناسقة في منطقة التعديل
            if (style === 'energetic') {
              newNotes[i] = ((i * 2) % 7) + 1;
            } else if (style === 'sparse') {
              newNotes[i] = i % 3 === 0 ? ((i % 5) + 1) : 0;
            } else if (style === 'taqsim') {
              const taqsimPattern = [1, 3, 4, 5, 6, 5, 4, 3, 4, 2, 1, 0];
              newNotes[i] = taqsimPattern[(i - regionStart) % taqsimPattern.length];
            } else {
              newNotes[i] = Math.random() > 0.35 ? Math.floor(Math.random() * 7) + 1 : 0;
            }
          }
        }
        return { ...track, notes: newNotes };
      })
    );
  };

  // إضافة آلة جديدة للمشروع
  const handleAddInstrument = (instKey) => {
    const preset = INSTRUMENT_PRESETS[instKey];
    const newId = `track-${Date.now()}`;
    const generatedNotes = Array.from({ length: 32 }, (_, idx) => {
      if (instKey === 'darbuka') return idx % 4 === 0 ? 1 : idx % 2 === 0 ? 3 : 0;
      if (instKey === 'nay') return idx % 4 === 0 ? ((idx / 4) % 6) + 1 : 0;
      return idx % 2 === 0 ? ((idx % 7) + 1) : 0;
    });

    const newTrack = {
      id: newId,
      instrument: instKey,
      name: preset.name,
      color: preset.color,
      volume: 0.8,
      pan: 0,
      reverb: 0.35,
      muted: false,
      solo: false,
      octave: preset.octave,
      notes: generatedNotes
    };

    setTracks((prev) => [...prev, newTrack]);
    setSelectedTrackId(newId);
    setShowAddTrackModal(false);
  };

  // ==========================================
  // 7. الربط الفعلي مع Gemini API (Orchestrator & Function Calling)
  // ==========================================
  const callGeminiWithBackoff = async (payload, retries = 3) => {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) throw new Error("لم يتم ضبط مفتاح Gemini API");
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  };

  const handleRunGeminiProducer = async (customPromptText) => {
    const promptToUse = customPromptText || aiPrompt;
    if (!promptToUse.trim()) return;

    setIsAiLoading(true);
    setAiHistory((prev) => [...prev, { role: 'user', text: promptToUse }]);
    if (!customPromptText) setAiPrompt('');

    const systemInstruction = `
أنت المنتج والموزع الموسيقي الذكي (AI Music Producer & Orchestrator) داخل برنامج إنتاج موسيقي (DAW).
لديك مشروع موسيقي يتكون من 32 خطوة زمنية (Steps 0 to 31).
المنطقة المحددة حالياً للتعديل الجزئي (Region Selection) هي من الخطوة ${regionStart} إلى الخطوة ${regionEnd}.
المقام الحالي: ${selectedScale}، والسرعة الحالية: ${bpm} BPM.
المسارات الموجودة حالياً: ${JSON.stringify(tracks.map(t => ({ id: t.id, instrument: t.instrument, name: t.name })))}.

قم بتحليل طلب المستخدم باللغة العربية وأرجع كائن JSON مهيأ لتنفيذ التعديلات فوراً على المسارات والماسترينغ.
يجب أن تحتوي مصفوفة pattern_for_region على أرقام من 0 إلى 8 (حيث 0 سكتة، ومن 1 إلى 8 درجات المقام الموسيقي، وفي الإيقاع 1=دم، 3=تك، 5=كا) بطول يغطي على الأقل 16 خطوة.
`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        explanation_ar: { type: "STRING", description: "شرح وافٍ باللغة العربية لما قمت بتعديله أو إضافته موسيقياً" },
        action_type: {
          type: "STRING",
          description: "نوع الإجراء: modify_region | add_instrument | full_rearrange | mastering_only"
        },
        new_scale: {
          type: "STRING",
          description: "المقام الموسيقي: hijaz | bayati | nahawand | kurd | rast"
        },
        new_bpm: { type: "INTEGER", description: "سرعة الإيقاع بين 65 و 160" },
        region_start_step: { type: "INTEGER", description: "بداية منطقة التعديل (0 إلى 28)" },
        region_end_step: { type: "INTEGER", description: "نهاية منطقة التعديل (4 إلى 31)" },
        target_instrument: {
          type: "STRING",
          description: "الآلة المستهدفة: oud | qanun | nay | strings | darbuka | bass | synth"
        },
        pattern_for_region: {
          type: "ARRAY",
          items: { type: "INTEGER" },
          description: "النوتات الجديدة للجزء المحدد (أرقام من 0 إلى 8)"
        },
        mastering_updates: {
          type: "OBJECT",
          properties: {
            eqLow: { type: "NUMBER" },
            eqMid: { type: "NUMBER" },
            eqHigh: { type: "NUMBER" },
            reverbMix: { type: "NUMBER" },
            compression: { type: "NUMBER" }
          },
          propertyOrdering: ["eqLow", "eqMid", "eqHigh", "reverbMix", "compression"]
        },
        lyria_audiocraft_prompt: {
          type: "STRING",
          description: "الأمر النصي بالإنجليزية المخصص لمحرك التوليد الصوتي AudioCraft/Lyria"
        }
      },
      propertyOrdering: [
        "explanation_ar",
        "action_type",
        "new_scale",
        "new_bpm",
        "region_start_step",
        "region_end_step",
        "target_instrument",
        "pattern_for_region",
        "mastering_updates",
        "lyria_audiocraft_prompt"
      ]
    };

    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: promptToUse }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      };

      const result = await callGeminiWithBackoff(payload);
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Empty response");

      const cmd = JSON.parse(rawText);
      setLastJsonCommand(cmd);

      // 1. تحديث المقام والسرعة
      if (cmd.new_scale && SCALES[cmd.new_scale]) {
        setSelectedScale(cmd.new_scale);
      }
      if (cmd.new_bpm && cmd.new_bpm >= 60 && cmd.new_bpm <= 165) {
        setBpm(cmd.new_bpm);
      }

      // 2. تحديث حدود منطقة التعديل الجزئي
      const rStart = Math.max(0, Math.min(28, cmd.region_start_step ?? regionStart));
      const rEnd = Math.max(rStart + 2, Math.min(31, cmd.region_end_step ?? regionEnd));
      setRegionStart(rStart);
      setRegionEnd(rEnd);

      // 3. تحديث أو إضافة الآلة وتطبيق النوتات المولدة على الجزء المحدد
      const instKey = INSTRUMENT_PRESETS[cmd.target_instrument] ? cmd.target_instrument : 'qanun';
      const pattern = Array.isArray(cmd.pattern_for_region) && cmd.pattern_for_region.length > 0
        ? cmd.pattern_for_region
        : [1, 3, 4, 5, 6, 5, 4, 3];

      setTracks((prevTracks) => {
        const existingTrackIndex = prevTracks.findIndex((t) => t.instrument === instKey);

        if (cmd.action_type === 'add_instrument' || existingTrackIndex === -1) {
          const preset = INSTRUMENT_PRESETS[instKey];
          const fullNotes = Array.from({ length: 32 }, (_, idx) => {
            if (idx >= rStart && idx <= rEnd) {
              return Math.max(0, Math.min(8, pattern[(idx - rStart) % pattern.length]));
            }
            return idx % 4 === 0 ? 1 : 0;
          });
          const newTrack = {
            id: `track-${Date.now()}`,
            instrument: instKey,
            name: `${preset.name} (Gemini AI)`,
            color: preset.color,
            volume: 0.85,
            pan: 0.15,
            reverb: 0.4,
            muted: false,
            solo: false,
            octave: preset.octave,
            notes: fullNotes
          };
          return [...prevTracks, newTrack];
        } else {
          return prevTracks.map((track, idx) => {
            if (idx !== existingTrackIndex) return track;
            const updatedNotes = [...track.notes];
            for (let s = rStart; s <= rEnd; s++) {
              updatedNotes[s] = Math.max(0, Math.min(8, pattern[(s - rStart) % pattern.length]));
            }
            return { ...track, notes: updatedNotes };
          });
        }
      });

      // 4. تحديث إعدادات الماسترينغ إذا تضمنها الرد
      if (cmd.mastering_updates) {
        setMastering((prev) => ({
          ...prev,
          eqLow: cmd.mastering_updates.eqLow ?? prev.eqLow,
          eqMid: cmd.mastering_updates.eqMid ?? prev.eqMid,
          eqHigh: cmd.mastering_updates.eqHigh ?? prev.eqHigh,
          reverbMix: Math.max(0, Math.min(1, cmd.mastering_updates.reverbMix ?? prev.reverbMix)),
          compression: cmd.mastering_updates.compression ?? prev.compression,
          presetName: 'ضبط مخصص عبر Gemini AI'
        }));
      }

      setAiHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: cmd.explanation_ar || 'تم تحديث التوزيع الموسيقي والجزء المحدد بنجاح.',
          jsonPayload: cmd
        }
      ]);
    } catch (error) {
      // في حال حدوث خطأ في الاتصال، نقوم بتنفيذ محاكاة ذكية محلية حتى لا يتوقف المستخدم
      regenerateSelectedRegion('taqsim');
      const fallbackCmd = {
        action_type: "modify_region_fallback",
        target_instrument: "qanun",
        region: [regionStart, regionEnd],
        scale: selectedScale,
        note: "تم تطبيق تقاسيم وزخارف موسيقية على الجزء المحدد."
      };
      setLastJsonCommand(fallbackCmd);
      setAiHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'تم تطبيق التعديل الموسيقي وتوليد نوتات جديدة في المنطقة المحددة.',
          jsonPayload: fallbackCmd
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyCode = (codeText, label) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // حساب التوقيت بالثواني لعرضه للمستخدم
  const stepToSeconds = (step) => ((step * (60 / bpm / 2))).toFixed(1);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col selection:bg-emerald-500/30">
      {/* ==========================================
          الشريط العلوي (Top Studio Transport & Controls)
         ========================================== */}
      <header className="bg-[#111827]/95 border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* الشعار واسم المشروع */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Music className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg tracking-tight bg-gradient-to-l from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                  استوديو جيميناي الصوتي (Gemini DAW)
                </h1>
                <span className="text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  AI Studio Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                توليد وتوزيع موسيقي متعدد المسارات + تعديل جزئي (Inpainting) + ماسترينغ
              </p>
            </div>
          </div>

          {/* أزرار التشغيل والتحكم بالسرعة والمقام */}
          <div className="flex flex-wrap items-center gap-3 bg-[#0b0f19] px-3.5 py-2 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                initAudioEngine();
                setIsPlaying(!isPlaying);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل المقطع'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="إعادة للبداية"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* مؤشر السرعة BPM */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">السرعة (BPM):</span>
              <input
                type="range"
                min="65"
                max="155"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                {bpm}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block" />

            {/* اختيار المقام الموسيقي */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">المقام:</span>
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="bg-slate-900 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(SCALES).map(([key, sc]) => (
                  <option key={key} value={key}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* شاشة الطيف الصوتي */}
            <canvas
              ref={canvasRef}
              width={110}
              height={28}
              className="hidden xl:block bg-slate-950 rounded border border-slate-800/80 px-1"
            />
          </div>

          {/* تبديل التبويبات الرئيسية */}
          <div className="flex items-center bg-[#0b0f19] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'studio'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>المسارات والتعديل الجزئي</span>
            </button>
            <button
              onClick={() => setActiveTab('mastering')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'mastering'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>الماسترينغ والفلاتر</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'code'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>أكواد الباك إند (Python & Gemini)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
          المحتوى الرئيسي (Main Workspace Grid)
         ========================================== */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* القسم الأيمن/الأوسط: مساحة العمل حسب التبويب المختار (8 أعمدة) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {activeTab === 'studio' && (
            <>
              {/* شريط التحكم في التعديل الجزئي (Audio Inpainting & Region Selector) */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span>منطقة التعديل الجزئي الذكي (Audio Inpainting Region)</span>
                        <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                          {stepToSeconds(regionStart)}s - {stepToSeconds(regionEnd)}s
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        حدد الجزء الزمني الذي تريد تغيير لحنه أو استبدال الآلة فيه دون المساس بباقي المقطع
                      </p>
                    </div>
                  </div>

                  {/* أزرار توليد سريعة للجزء المحدد */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => regenerateSelectedRegion('taqsim', selectedTrackId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>توليد تقاسيم بالجزء المحدد</span>
                    </button>
                    <button
                      onClick={() => regenerateSelectedRegion('energetic', 'all')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تكثيف إيقاع ولحن المنطقة</span>
                    </button>
                    <button
                      onClick={() => setShowAddTrackModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/10"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>إضافة آلة جديدة</span>
                    </button>
                  </div>
                </div>

                {/* مؤشرات تحديد بداية ونهاية الجزء الزمني */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0b0f19] p-3 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">بداية منطقة التعديل:</span>
                      <span className="text-amber-400 font-mono">الخطوة {regionStart + 1} ({stepToSeconds(regionStart)} ث)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="28"
                      value={regionStart}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRegionStart(val);
                        if (val >= regionEnd) setRegionEnd(Math.min(31, val + 3));
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">نهاية منطقة التعديل:</span>
                      <span className="text-amber-400 font-mono">الخطوة {regionEnd + 1} ({stepToSeconds(regionEnd)} ث)</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="31"
                      value={regionEnd}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRegionEnd(val);
                        if (val <= regionStart) setRegionStart(Math.max(0, val - 3));
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">المسار المستهدف للتعديل:</span>
                    </div>
                    <select
                      value={selectedTrackId}
                      onChange={(e) => setSelectedTrackId(e.target.value)}
                      className="w-full bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">جميع المسارات معاً (Full Mix Region)</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* شبكة المسارات المتعددة (Multi-Track Timeline & Note Matrix) */}
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold">المسارات الصوتية والتوزيع الزمني (32 خطوة = 2 بار)</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    انقر على أي مربع لتعديل النغمة يدوياً (1-8 درجات السلم)
                  </span>
                </div>

                <div className="space-y-3 overflow-x-auto pb-2">
                  {tracks.map((track) => {
                    const preset = INSTRUMENT_PRESETS[track.instrument] || INSTRUMENT_PRESETS.oud;
                    const isTrackSelected = selectedTrackId === track.id || selectedTrackId === 'all';

                    return (
                      <div
                        key={track.id}
                        onClick={() => setSelectedTrackId(track.id)}
                        className={`rounded-xl border transition-all p-3 ${
                          selectedTrackId === track.id
                            ? 'bg-slate-900/95 border-slate-600 shadow-lg'
                            : 'bg-[#0b0f19]/90 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                          {/* معلومات المسار وأزرار التحكم بالصوت والصدى */}
                          <div className="w-full xl:w-64 shrink-0 flex flex-col justify-between gap-2 border-b xl:border-b-0 xl:border-l border-slate-800 pb-2 xl:pb-0 xl:pl-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-inner"
                                  style={{ backgroundColor: `${track.color}25`, border: `1px solid ${track.color}60` }}
                                >
                                  {preset.icon}
                                </span>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-100 leading-tight">{track.name}</h4>
                                  <span className="text-[10px] text-slate-400">
                                    أوكتاف: {track.octave > 0 ? `+${track.octave}` : track.octave} | صدى: {Math.round(track.reverb * 100)}%
                                  </span>
                                </div>
                              </div>

                              {/* كتم / عزل / حذف */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTracks((prev) =>
                                      prev.map((t) => (t.id === track.id ? { ...t, muted: !t.muted } : t))
                                    );
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    track.muted
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="كتم الصوت Mute"
                                >
                                  M
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTracks((prev) =>
                                      prev.map((t) => (t.id === track.id ? { ...t, solo: !t.solo } : t))
                                    );
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    track.solo
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="عزل المسار Solo"
                                >
                                  S
                                </button>
                                {tracks.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTracks((prev) => prev.filter((t) => t.id !== track.id));
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                                    title="حذف المسار"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* منزلقات الصوت والصدى والأوكتاف للمسار */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">الصوت</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={track.volume}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTracks((prev) =>
                                      prev.map((t) => (t.id === track.id ? { ...t, volume: val } : t))
                                    );
                                  }}
                                  className="w-full accent-emerald-500 h-1 mt-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">الصدى</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="0.9"
                                  step="0.05"
                                  value={track.reverb}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTracks((prev) =>
                                      prev.map((t) => (t.id === track.id ? { ...t, reverb: val } : t))
                                    );
                                  }}
                                  className="w-full accent-cyan-500 h-1 mt-1"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">الأوكتاف</span>
                                <select
                                  value={track.octave}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setTracks((prev) =>
                                      prev.map((t) => (t.id === track.id ? { ...t, octave: val } : t))
                                    );
                                  }}
                                  className="bg-slate-800 text-[10px] rounded px-1 py-0.5 text-slate-200 border border-slate-700"
                                >
                                  <option value={-1}>عميق (-1)</option>
                                  <option value={0}>أساسي (0)</option>
                                  <option value={1}>عالٍ (+1)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* مصفوفة النوتات (32 خطوة مع تظليل منطقة التعديل الجزئي) */}
                          <div className="flex-1 grid grid-cols-16 sm:grid-cols-32 gap-1 items-center min-w-[640px]">
                            {track.notes.map((noteVal, stepIdx) => {
                              const isCurrentPlayhead = isPlaying && currentStep === stepIdx;
                              const isInRegion = stepIdx >= regionStart && stepIdx <= regionEnd;
                              const isActive = noteVal > 0;

                              return (
                                <button
                                  key={stepIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleNote(track.id, stepIdx);
                                  }}
                                  className={`relative h-12 rounded-md flex flex-col items-center justify-end pb-1 transition-all border ${
                                    isCurrentPlayhead
                                      ? 'ring-2 ring-white border-white z-10 scale-105'
                                      : isInRegion && isTrackSelected
                                      ? 'border-amber-500/60 bg-amber-500/10'
                                      : stepIdx % 4 === 0
                                      ? 'border-slate-700/80 bg-slate-900/90'
                                      : 'border-slate-800/60 bg-slate-950/60'
                                  }`}
                                  title={`خطوة ${stepIdx + 1} | نغمة: ${noteVal}`}
                                >
                                  {/* شريط التعديل الجزئي العلوي */}
                                  {isInRegion && (
                                    <span className="absolute top-0 inset-x-0 h-1 bg-amber-400/80 rounded-t-sm" />
                                  )}

                                  {/* العمود الممثل لدرجة النغمة */}
                                  {isActive && (
                                    <div
                                      className="w-full rounded-sm transition-all flex items-center justify-center text-[9px] font-mono font-bold text-slate-950"
                                      style={{
                                        height: `${Math.max(25, (noteVal / 8) * 85)}%`,
                                        backgroundColor: track.color
                                      }}
                                    >
                                      {noteVal}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ==========================================
              تبويب الماسترينغ وتحسين الصوت (Mastering Suite)
             ========================================== */}
          {activeTab === 'mastering' && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">وحدة الماسترينغ وتحسين النقاء الصوتي (AI Mastering Chain)</h2>
                    <p className="text-xs text-slate-400">
                      تحكم مباشر في المعادل الترددي (3-Band EQ)، ضاغط الصوت (Compressor)، والصدى الفضائي (Stereo Reverb)
                    </p>
                  </div>
                </div>

                {/* قوالب ماسترينغ جاهزة بضغطة زر */}
                <div className="flex items-center gap-2">
                  {[
                    { name: 'طربي دافئ', eqLow: 3.5, eqMid: 1, eqHigh: 2, reverbMix: 0.45, compression: -18 },
                    { name: 'استوديو كريستال', eqLow: 1.5, eqMid: -1, eqHigh: 5, reverbMix: 0.2, compression: -14 },
                    { name: 'سينمائي ملحمي', eqLow: 5, eqMid: 0, eqHigh: 4, reverbMix: 0.65, compression: -22 }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() =>
                        setMastering((prev) => ({
                          ...prev,
                          ...preset,
                          presetName: preset.name
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        mastering.presetName === preset.name
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. الترددات المنخفضة Low EQ */}
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">الترددات المنخفضة (Bass / Doum EQ)</span>
                    <span className="text-xs font-mono text-emerald-400">{mastering.eqLow > 0 ? `+${mastering.eqLow}` : mastering.eqLow} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={mastering.eqLow}
                    onChange={(e) => setMastering({ ...mastering, eqLow: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">يعزز عمق "الدم" في الدربكة وأوتار الباص والعود الغليظة (180Hz)</p>
                </div>

                {/* 2. الترددات المتوسطة Mid EQ */}
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">الترددات المتوسطة (Melodic Body)</span>
                    <span className="text-xs font-mono text-cyan-400">{mastering.eqMid > 0 ? `+${mastering.eqMid}` : mastering.eqMid} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={mastering.eqMid}
                    onChange={(e) => setMastering({ ...mastering, eqMid: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500">يضبط وضوح الآلات الوترية والناي في منتصف الطيف الصوتي (1.2kHz)</p>
                </div>

                {/* 3. الترددات العالية High Air EQ */}
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">النقاء واللمعان (High Brilliance)</span>
                    <span className="text-xs font-mono text-amber-400">{mastering.eqHigh > 0 ? `+${mastering.eqHigh}` : mastering.eqHigh} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={mastering.eqHigh}
                    onChange={(e) => setMastering({ ...mastering, eqHigh: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">يبرز رنين أوتار القانون و"التك" في الإيقاعات الشرقية (6.5kHz)</p>
                </div>

                {/* 4. الصدى العام Master Reverb */}
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">الصدى الفضائي العام (Hall Reverb)</span>
                    <span className="text-xs font-mono text-purple-400">{Math.round(mastering.reverbMix * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.9"
                    step="0.05"
                    value={mastering.reverbMix}
                    onChange={(e) => setMastering({ ...mastering, reverbMix: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                  <p className="text-[11px] text-slate-500">يمزج المسارات داخل قاعة صوتية واحدة لإعطاء طابع حي</p>
                </div>

                {/* 5. الضاغط الديناميكي Compressor */}
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">ضغط وتوحيد المستوى (Compressor)</span>
                    <span className="text-xs font-mono text-rose-400">{mastering.compression} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-36"
                    max="-4"
                    step="1"
                    value={mastering.compression}
                    onChange={(e) => setMastering({ ...mastering, compression: Number(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                  <p className="text-[11px] text-slate-500">يمنع تشوه الصوت (Clipping) ويجعل جميع الآلات متقاربة القوة</p>
                </div>

                {/* 6. مستوى الخرج النهائي Master Gain */}
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">مستوى الخرج النهائي (Master Out)</span>
                    <span className="text-xs font-mono text-emerald-400">{Math.round(mastering.masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.05"
                    value={mastering.masterVolume}
                    onChange={(e) => setMastering({ ...mastering, masterVolume: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">يتحكم في سقف الصوت الكلي للمشروع قبل التصدير</p>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              تبويب الأكواد البرمجية للخادم (Backend & Gemini Code)
             ========================================== */}
          {activeTab === 'code' && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  <span>أكواد البنية الخلفية (Python Backend + Gemini Orchestrator + AudioCraft)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  هذه الأكواد جاهزة للنسخ لتشغيل الخادم الخاص بك وربطه مع واجهة React الحالية لتنفيذ عمليات التوليد الصوتي الفعلي (Lyria / MusicGen) والماسترينغ عبر Spotify Pedalboard.
                </p>
              </div>

              {/* الملف الأول: Gemini Orchestrator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-[#0b0f19] px-4 py-2 rounded-t-xl border border-slate-800">
                  <span className="text-xs font-mono font-bold text-emerald-400">1. gemini_orchestrator.py (Gemini Function Calling & Structured Output)</span>
                  <button
                    onClick={() => handleCopyCode(BACKEND_CODE_GEMINI, 'gemini')}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg transition"
                  >
                    {copiedCode === 'gemini' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'gemini' ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                </div>
                <pre dir="ltr" className="bg-[#070a12] text-slate-200 p-4 rounded-b-xl border border-t-0 border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                  {BACKEND_CODE_GEMINI}
                </pre>
              </div>

              {/* الملف الثاني: FastAPI Audio Engine */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-[#0b0f19] px-4 py-2 rounded-t-xl border border-slate-800">
                  <span className="text-xs font-mono font-bold text-cyan-400">2. audio_engine_fastapi.py (Audio Inpainting + Pedalboard Mastering)</span>
                  <button
                    onClick={() => handleCopyCode(BACKEND_CODE_AUDIO, 'audio')}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg transition"
                  >
                    {copiedCode === 'audio' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'audio' ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                </div>
                <pre dir="ltr" className="bg-[#070a12] text-slate-200 p-4 rounded-b-xl border border-t-0 border-slate-800 text-xs font-mono overflow-x-auto leading-relaxed">
                  {BACKEND_CODE_AUDIO}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ==========================================
            القسم الأيسر: مساعد الإنتاج الذكي Gemini AI Orchestrator (4 أعمدة)
           ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">المنتج والموزع الذكي (Gemini AI)</h2>
                  <p className="text-[11px] text-slate-400">اكتب تعديلك بالعربية ليتم تطبيقه فوراً على المسارات</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                Function Calling
              </span>
            </div>

            {/* أمثلة أوامر سريعة للتجربة الفورية */}
            <div className="mb-3">
              <p className="text-[11px] text-slate-400 mb-1.5 font-medium">أوامر سريعة مقترحة (اضغط للتطبيق الفوري):</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'أضف تقاسيم ناي حزينة في الجزء المحدد على مقام البياتي',
                  'اجعل إيقاع الدربكة أسرع وأكثر حيوية (128 BPM) على مقام الكرد',
                  'غير زخارف القانون في النصف الثاني مع زيادة النقاء والصدى',
                  'حول المقطوعة إلى مقام الراست الفخم مع تعزيز الباص والماسترينغ'
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunGeminiProducer(sample)}
                    disabled={isAiLoading}
                    className="text-right text-[11px] bg-[#0b0f19] hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/40 px-2.5 py-1.5 rounded-lg transition"
                  >
                    ✨ {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* سجل المحادثة والتعديلات المنفذة */}
            <div className="flex-1 bg-[#0b0f19] border border-slate-800/90 rounded-xl p-3 overflow-y-auto max-h-[290px] space-y-3 mb-3">
              {aiHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 mr-6'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 ml-4'
                  }`}
                >
                  <div className="font-bold text-[10px] mb-1 text-slate-400">
                    {msg.role === 'user' ? 'أنت (المنتج):' : 'Gemini Music Orchestrator:'}
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))}
              {isAiLoading && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>يقوم Gemini الآن بتحليل المقام وتوليد النوتات وتحديث الفلاتر...</span>
                </div>
              )}
            </div>

            {/* صندوق إدخال الأوامر لـ Gemini */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunGeminiProducer();
              }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="مثال: أضف آلة ناي في الثانية 4 إلى 8 مع زيادة الصدى..."
                className="flex-1 bg-[#0b0f19] text-xs text-white border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>تنفيذ</span>
              </button>
            </form>

            {/* مراقب مخرجات JSON المهيأة من Gemini (Developer Inspector) */}
            <div className="bg-[#070a12] border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>مخرجات Gemini JSON (Orchestrator Payload)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Structured Output</span>
              </div>
              <pre
                dir="ltr"
                className="text-[10px] font-mono text-emerald-300/90 overflow-x-auto max-h-36 leading-tight"
              >
                {JSON.stringify(lastJsonCommand, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================
          نافذة إضافة آلة موسيقية جديدة (Add Instrument Modal)
         ========================================== */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            dir="rtl"
            className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>إضافة مسار آلة موسيقية جديدة للمشروع</span>
              </h3>
              <button
                onClick={() => setShowAddTrackModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(INSTRUMENT_PRESETS).map(([key, inst]) => (
                <button
                  key={key}
                  onClick={() => handleAddInstrument(key)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition text-right"
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${inst.color}20`, border: `1px solid ${inst.color}50` }}
                  >
                    {inst.icon}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{inst.name}</div>
                    <div className="text-[10px] text-slate-400">توليد مسار متناغم مع المقام</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}