const { app, BrowserWindow, ipcMain } = require('electron');
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
let client;
let clientReady = false;
let win
function createWindow() {
   win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration:true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
  });

  client.on('qr', async (qr) => {
    const qrDataUrl = await QRCode.toDataURL(qr);
    console.log(qrDataUrl);
    qrcode.generate(qr, {small: true});
    if (win && !win.isDestroyed()) {
      win.webContents.send('qr-code', qrDataUrl);
    }
  });

  client.on('ready', () => {
    clientReady = true;
    console.log('WhatsApp listo!');
  });

  client.initialize();
});

// Obtener lista de grupos
ipcMain.handle('is-ready', () => {
    return clientReady;
  });
  
ipcMain.handle('get-groups', async () => {
    if (!clientReady) throw new Error('WhatsApp no está listo aún.');
    const chats = await client.getChats();
    console.log("Estos son los chats");
    console.log(chats);
    const groups = chats.filter(chat => chat.isGroup);
    return groups.map(group => ({ id: group.id._serialized, name: group.name }));
  });
  
  ipcMain.handle('get-group-participants', async (event, groupId) => {
    if (!clientReady) throw new Error('WhatsApp no está listo aún.');
    const chat = await client.getChatById(groupId);
    const participants = chat.participants;
    return participants.map(p => p.id.user);
  });
  
  ipcMain.handle('logout', async () => {
    if (client && clientReady) {
      await client.logout();
      clientReady = false;
      return true;
    }
    return false;
  });