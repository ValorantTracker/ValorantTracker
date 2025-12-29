const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

let mainWindow;
let pythonProcess;
let tray;

const PYTHON_PORT = 5555;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f1923',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Try to load icon from assets folder
  let icon;
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const fs = require('fs');

  // Check if icon file exists
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  }

  // If icon is still empty or doesn't exist, use a base64 fallback
  if (!icon || icon.isEmpty()) {
    // Simple 16x16 red icon as base64 PNG
    const iconData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAnklEQVQ4T2NkoBAwUqifYTQMKBvBaAYYHQVUEwWjw4BqQp+hgYGB4T8DA8N/BgYGRgYGhv8MDAwM/xkYGBj+MzAw/GdgYGBgYGBgYPjPwMDA8J+BgYHhPwMDA8N/BgYGhv8MDAwM/xkYGBj+MzAwMPxnYGBg+M/AwMDwn4GBgeE/AwMDw38GBgaG/wwMDAz/GRgYGP4zMDAw/GdgYGD4z8DAwEBOFAAAz7gI8TXvZiEAAAAASUVORK5CYII=';
    icon = nativeImage.createFromDataURL(iconData);
  }

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Valorant Match Tracker');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
  });
}

function startPythonBackend() {
  const pythonScript = path.join(__dirname, 'backend', 'server.py');

  pythonProcess = spawn('python', [pythonScript], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });

  // Wait for backend to start
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

app.whenReady().then(async () => {
  await startPythonBackend();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in tray
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

// IPC handlers
ipcMain.handle('minimize-to-tray', () => {
  mainWindow.hide();
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.hide();
});

ipcMain.handle('resize-window', (event, width, height) => {
  if (mainWindow && !mainWindow.isMaximized()) {
    mainWindow.setSize(width, height, true);
    mainWindow.center();
  }
});

ipcMain.handle('show-notification', (event, title, body) => {
  const notification = {
    title: title,
    body: body
  };
  mainWindow.webContents.send('show-notification', notification);
});
