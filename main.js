const { app, ipcMain, dialog, BrowserWindow, Menu } = require("electron")
const fs = require("fs")
const path = require("path")
const util = require("util")
const childProcess = require("child_process")
const axios = require("axios")

const MicrosoftAuthProvider = require("./app/MicrosoftAuthProvider")
const MinecraftAuthProvider = require("./app/MinecraftAuthProvider")
const ServerListHandler = require("./app/version/ServerListHandler.js")
const { IPC_MESSAGES } = require("./app/constants")
const { msalConfig } = require("./app/authConfig.js")
const downloader = require("./app/downloader.js")

const VERSION = "1.0.0"

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
    autoLogin()
}

//const menu = new Menu()
//Menu.setApplicationMenu(menu)

app.whenReady().then(() => {
    createWindow()
    checkUpdate()
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

const checkUpdate = async () => {
    const appVersionJSON = await downloader.downloadJSON("http://twicusstumble.ddns.net/download/twicusslauncher.json")
    if (appVersionJSON.latest_version !== VERSION) {
        dialog.showMessageBox(mainWindow, { title: "Update info", message: `アップデートが利用可能です。http://twicusstumble.ddns.net/ からダウンロードしてください。(v${VERSION} -> v${appVersionJSON.latest_version})`})
    }
}

const autoLogin = async () => {
    const response = await microsoftAuthProvider.getTokenSilent()

    if (response) {
        await authorizeAccount(response)

        await mainWindow.loadFile(path.join(__dirname, "app/html/index.html"))

        mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, minecraftAuthProvider.userName)
    } else {
        mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
    }
}

ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
    const response = await microsoftAuthProvider.login()

    if (response) {
        await authorizeAccount(response)

        await mainWindow.loadFile(path.join(__dirname, "app/html/index.html"))

        mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, minecraftAuthProvider.userName)
    }
})

const authorizeAccount = async (microsoftResponse) => {
    minecraftAuthProvider = new MinecraftAuthProvider(microsoftResponse.accessToken)
    await minecraftAuthProvider.getXboxLiveToken()
    await minecraftAuthProvider.getMinecraftToken()
    await minecraftAuthProvider.authMinecraft()
    await minecraftAuthProvider.getProfile()
}

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
    await microsoftAuthProvider.logout()
    
    minecraftAuthProvider = null
    await mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
})

ipcMain.on(IPC_MESSAGES.RUN_MINECRAFT, async () => {
    console.log("running minecraft...")
    mainWindow.webContents.send(IPC_MESSAGES.SHOW_RUN_STATUS, "Minecraftを起動しています...")

    const serverListHandler = new ServerListHandler()
    await serverListHandler.loadServerJSON("http://twicusstumble.ddns.net/mods/twicuss1.12.2.json")
    const args = await serverListHandler.prepareToRunMinecraft(minecraftAuthProvider.userName, minecraftAuthProvider.uuid, minecraftAuthProvider.minecraftAuthToken)

    const exec = util.promisify(childProcess.exec)
    exec(`java ${args}`)

    //app.quit()
})