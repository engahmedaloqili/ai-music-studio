// نقطة دخول تطبيق سطح المكتب (Electron)
const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const path = require('path');

// السماح بالمايكروفون فقط (للتسجيل الصوتي) ورفض أي صلاحيات أخرى
function setupPermissions() {
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback, details) => {
    const audioOnly = permission === 'media' && (!details.mediaTypes || details.mediaTypes.every((t) => t === 'audio'));
    callback(audioOnly);
  });
}

// توليد الأغاني عبر Lyria من العملية الرئيسية (العنوان ثابت، والواجهة ترسل المفتاح والنص فقط)
const LYRIA_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
function setupLyria() {
  ipcMain.handle('lyria:generate', async (_e, { apiKey, model, prompt }) => {
    if (typeof apiKey !== 'string' || typeof prompt !== 'string' || !/^lyria-[\w.-]+$/.test(model)) {
      return { status: 400, body: JSON.stringify({ error: { message: 'invalid request' } }) };
    }
    const res = await fetch(LYRIA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'Api-Revision': '2026-05-20' },
      body: JSON.stringify({ model, input: prompt }),
    });
    return { status: res.status, body: await res.text() };
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617',
    title: 'AI Music Studio',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // فتح الروابط الخارجية في المتصفح الافتراضي بدل داخل التطبيق
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// التحديث التلقائي من GitHub Releases (يعمل فقط في النسخة المثبتة)
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  const { autoUpdater } = require('electron-updater');
  autoUpdater.on('update-downloaded', async () => {
    const { response } = await dialog.showMessageBox({
      type: 'info',
      buttons: ['إعادة التشغيل الآن', 'لاحقاً'],
      title: 'تحديث جديد',
      message: 'تم تنزيل إصدار جديد من AI Music Studio. هل تريد إعادة التشغيل للتحديث؟',
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

app.whenReady().then(() => {
  setupPermissions();
  setupLyria();
  createWindow();
  setupAutoUpdate();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
