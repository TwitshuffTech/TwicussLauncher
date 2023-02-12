const { app, ipcMain, BrowserWindow } = require("electron")
const path = require("path")

const AuthProvider = require("./app/AuthProvider")
const { IPC_MESSAGES } = require("./app/constants")
const { msalConfig } = require("./app/authConfig.js")

let authProvider;
let mainWindow;

let createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "app/preload.js")
        },
    })

    authProvider = new AuthProvider(msalConfig)
    checkCache()
}

app.whenReady().then(() => {
    createWindow()
    mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
})

app.on("window-all-closed", () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

let checkCache = async () => {
    const account = await authProvider.getAccount()

    mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account)
}

ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
    const account = await authProvider.login()

    await mainWindow.loadFile(path.join(__dirname, "app/html/index.html"))

    mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account)
})

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
    await authProvider.logout()

    await mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
})