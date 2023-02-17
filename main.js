const { app, ipcMain, dialog, shell, BrowserWindow, Menu } = require("electron")
const fs = require("fs")
const path = require("path")
const util = require("util")
const childProcess = require("child_process")
const axios = require("axios")

const MicrosoftAuthProvider = require("./app/MicrosoftAuthProvider")
const MinecraftAuthProvider = require("./app/MinecraftAuthProvider")
const ServerListHandler = require("./app/version/ServerListHandler.js")
const ServerStatus = require("./app/ServerStatus.js")
const { IPC_MESSAGES } = require("./app/constants")
const { msalConfig } = require("./app/authConfig.js")
const downloader = require("./app/downloader.js")

const VERSION = "1.0.0"

let microsoftAuthProvider
let minecraftAuthProvider
let serverStatus
let mainWindow

let createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 650,
        webPreferences: {
            preload: path.join(__dirname, "app/preload.js")
        },
    })

    microsoftAuthProvider = new MicrosoftAuthProvider(msalConfig)
    serverStatus = new ServerStatus()
    autoLogin()
}

const menu = new Menu()
Menu.setApplicationMenu(menu)

app.whenReady().then(() => {
    createWindow()
    checkUpdate()
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit(); // macではウィンドウを閉じてもアプリが終了しないように
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(); // macでアプリアイコンがクリックされたときにウィンドウがない場合新たに生成する
    }
});

// 起動にアプリケーション更新の有無を確認
const checkUpdate = async () => {
    // twicusslauncher.jsonについて
    // {
    //     "latset_version": "{バージョン（1.0.0など）}"
    // }
    const appVersionJSON = await downloader.downloadJSON("http://twicusstumble.ddns.net/download/twicusslauncher.json")
    if (appVersionJSON.latest_version !== VERSION) {
        dialog.showMessageBox(mainWindow, { title: "Update info", message: `アップデートが利用可能です。http://twicusstumble.ddns.net/ からダウンロードしてください。(v${VERSION} -> v${appVersionJSON.latest_version})`})
    }
}

// アプリ起動時に自動ログインを試みる。その可否で遷移ページを振り分け
const autoLogin = async () => {
    const token = await microsoftAuthProvider.autoLogin()

    if (token) {
        transiteToMain(token)
    } else {
        mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
    }
}

ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
    const loginUrl = await microsoftAuthProvider.getAuthCodeUrl()

    let loginWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false
    })
    loginWindow.loadURL(loginUrl)

    loginWindow.webContents.on("will-redirect", async (event, newUrl) => {
        if (newUrl.startsWith("https://login.microsoftonline.com/common/oauth2/nativeclient?code=")) {
            const code = newUrl.substring(newUrl.indexOf("?code=") + 6, newUrl.indexOf("&"))

            const token = await microsoftAuthProvider.exchangeToken(code)
            if (token) {
                transiteToMain(token)
                loginWindow.close()
            }
        } else if (newUrl.startsWith("https://login.microsoftonline.com/common/oauth2/nativeclient?error=")) {
            console.log("Access denied.")
            loginWindow.close()
        }
    })
})

const transiteToMain = async (token) => {
    mainWindow.loadFile(path.join(__dirname, "app/html/loginTransition.html"))

    minecraftAuthProvider = new MinecraftAuthProvider()
    await minecraftAuthProvider.authMinecraft(token)

    if (!await minecraftAuthProvider.checkGameOwnership()) {
        dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `Minecraftを所有していません`})
        mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
        microsoftAuthProvider.logout()
    } else {
        await mainWindow.loadFile(path.join(__dirname, "app/html/index.html"))

        mainWindow.webContents.send(IPC_MESSAGES.SHOW_PLAYER_NAME, minecraftAuthProvider.userName)
        mainWindow.webContents.send(IPC_MESSAGES.SHOW_SKIN_VIEWER, await minecraftAuthProvider.get3DSkinImage())

        mainWindow.webContents.send(IPC_MESSAGES.SHOW_SERVER_STATUS, await serverStatus.getServerStatus())
        
    }
}

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
    await microsoftAuthProvider.logout()
    
    await mainWindow.loadFile(path.join(__dirname, "app/html/login.html"))
})

ipcMain.on(IPC_MESSAGES.RUN_MINECRAFT, async () => {
    console.log("running minecraft...")
    mainWindow.webContents.send(IPC_MESSAGES.SHOW_RUN_STATUS, "Minecraftを起動しています...")

    const serverListHandler = new ServerListHandler()
    await serverListHandler.loadServerJSON("http://twicusstumble.ddns.net/mods/twicuss1.12.2.json")

    const args = await serverListHandler.prepareToRunMinecraft(minecraftAuthProvider.userName, minecraftAuthProvider.uuid, minecraftAuthProvider.minecraftAuthToken)
    
    const exec = util.promisify(childProcess.exec)

    let javaPath
    if (process.platform == "win32") {
        javaPath = path.join(app.getPath("appData"), ".twicusslauncher/minecraft/runtime/jre-legacy/jdk8u362-b09-jre/bin/javaw.exe")
    } else if (process.platform == "darwin") {
        //javaPath = path.join(app.getPath("appData"), ".twicusslauncher/minecraft/runtime/jre-legacy/jdk8u362-b09-jre/Contents/Home/bin/java")
        // macでコンソールから起動しようとするとjavaのruntimeエラーが出る。しょうがなくMinecraft.appを起動することで妥協
        exec("open /Applications/Minecraft.app").then(() => {
            app.quit()
        })
    }

    if (javaPath) {
        exec(`${javaPath.replaceAll(" ", "\\ ")} ${args}`, (error, stdout, stderror) => {
            console.log(error)
            if (error) {
                dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `Minecraftの起動に失敗しました`})
            }
        })
    }
})