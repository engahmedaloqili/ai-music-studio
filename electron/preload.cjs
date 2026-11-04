// جسر آمن بين واجهة التطبيق وعملية Electron الرئيسية
// نعرض دالة واحدة فقط: طلب توليد أغنية من Lyria (يُنفَّذ في main لتجاوز قيود CORS على ترويسة Api-Revision)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studioNative', {
  lyriaRequest: (apiKey, model, prompt) => ipcRenderer.invoke('lyria:generate', { apiKey, model, prompt }),
});
