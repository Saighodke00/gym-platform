const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const address = require('address');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let apiProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'GDK Gym Management',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // In development, load from Vite dev server
  // In production, load from local file
  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../web/dist/index.html')}`;
  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startAPI() {
  const apiPath = path.join(__dirname, '../api/src/server.ts');
  const projectRoot = path.join(__dirname, '../../');
  const env = { ...process.env, NODE_ENV: 'development', PORT: 4000 };

  // Use array arguments correctly with spawn and wrap paths in quotes for Windows
  apiProcess = spawn('npx', ['tsx', `"${apiPath}"`], {
    cwd: projectRoot,
    env,
    shell: true,
  });

  apiProcess.stdout.on('data', (data) => {
    console.log(`API: ${data}`);
  });

  apiProcess.stderr.on('data', (data) => {
    console.error(`API Error: ${data}`);
  });
}

app.on('ready', () => {
  // Only start the API process automatically if we are NOT in development
  // In development, the root 'concurrently' script handles the API
  if (!isDev) {
    startAPI();
  }
  
  createWindow();

  // Expose local IP to frontend
  ipcMain.on('get-local-ip', (event) => {
    const ip = address.ip();
    // Filter out localhost/loopback if possible
    if (ip === '127.0.0.1') {
      // Fallback to more aggressive search
      const os = require('os');
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            event.reply('local-ip', iface.address);
            return;
          }
        }
      }
    }
    event.reply('local-ip', ip);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (apiProcess) {
    apiProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
