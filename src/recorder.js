// تسجيل من المايكروفون: startRecording() ترجع كائناً فيه stop() يرجع Blob
// نطفئ معالجات المتصفح (إلغاء الصدى/الضوضاء) لأنها تشوّه الغناء.
export async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('المايكروفون غير مدعوم في هذا الجهاز');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start(250);
  const startedAt = performance.now();

  return {
    stream,
    elapsed: () => (performance.now() - startedAt) / 1000,
    stop: () =>
      new Promise((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
        };
        rec.stop();
      }),
    cancel: () => {
      rec.onstop = null;
      try { rec.stop(); } catch (e) { /* */ }
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
