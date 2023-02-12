const { app, ipcMain, BrowserWindow } = require("electron")
const fs = require("fs")
const path = require("path")
const util = require("util")
const childProcess = require("child_process")

const MicrosoftAuthProvider = require("./app/MicrosoftAuthProvider")
const MinecraftAuthProvider = require("./app/MinecraftAuthProvider")
const { IPC_MESSAGES } = require("./app/constants")
const { msalConfig } = require("./app/authConfig.js")
const setting_1_12_2 = require("./app/version/setting_1_12_2.js")

let microsoftAuthProvider
let minecraftAuthProvider
let mainWindow

let createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "app/preload.js")
        },
    })

    microsoftAuthProvider = new MicrosoftAuthProvider(msalConfig)
    checkCache()
}

app.whenReady().then(() => {
    createWindow()
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
    const response = await microsoftAuthProvider.getTokenSilent()

    if (response) {
        minecraftAuthProvider = new MinecraftAuthProvider(response.accessToken)
        await minecraftAuthProvider.getXboxLiveToken()
        await minecraftAuthProvider.getMinecraftToken()
        await minecraftAuthProvider.authMinecraft()
        await minecraftAuthProvider.getProfile()

        await mainWindow.loadFile(path.join(__dirname, "app/html/index.html"))

        mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, response.account)
    } else {
        mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
    }
}

ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
    const response = await microsoftAuthProvider.login()

    minecraftAuthProvider = new MinecraftAuthProvider(response.accessToken)

    await mainWindow.loadFile(path.join(__dirname, "app/html/index.html"))

    mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, response.account)
})

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
    await microsoftAuthProvider.logout()

    await mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
})

ipcMain.on(IPC_MESSAGES.RUN_MINECRAFT, () => {
    console.log("running minecraft...")

    const args = setting_1_12_2.getArgs(minecraftAuthProvider.userName, minecraftAuthProvider.uuid, minecraftAuthProvider.minercaftAuthToken)

    const exec = util.promisify(childProcess.exec)
    exec(`java ${args}`)
})