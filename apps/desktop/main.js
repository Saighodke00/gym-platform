const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

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
  // In production, we connect to the Cloud API, so we don't start the local API anymore.
  
  createWindow();

  // Expose local IP to frontend
  // No longer needed for cloud API
  ipcMain.on('get-local-ip', (event) => {
    event.reply('local-ip', '127.0.0.1');
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
