const { app, ipcMain, dialog, BrowserWindow } = require("electron")
const { autoUpdater } = require("electron-updater")
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

const VERSION = require("./package.json").version

let microsoftAuthProvider
let minecraftAuthProvider
let serverStatus
let mainWindow

let useOfficialJRE = false;
let runMinecraftDirectly = false;

let createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 650,
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#161616",
            symbolColor: "#ffffff"
        },
        webPreferences: {
            preload: path.join(__dirname, "app/preload.js")
        },
    })

    microsoftAuthProvider = new MicrosoftAuthProvider(msalConfig)
    serverStatus = new ServerStatus()
    autoLogin()
}

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
    if (process.platform == "win32") {
        autoUpdater.checkForUpdatesAndNotify()
    } else {
        // twicusslauncher.jsonについて
        // {
        //     "latset_version": "{最新のバージョン（1.0.0など）},"
        //     "supported_versions": ["{サポートされているバージョン}", "{}", ...]
        // }
        const appVersionJSON = await downloader.downloadJSON("http://twicusstumble.ddns.net/download/twicusslauncher.json")
        if (!appVersionJSON.supported_versions.includes(VERSION)) {
            dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `このバージョン (v${VERSION}) は現在サポートされていません。http://twicusstumble.ddns.net/ から最新のものをダウンロードしてください。`}).then(() => {
                app.quit()
            })
        } else if (appVersionJSON.latest_version !== VERSION) {
            dialog.showMessageBox(mainWindow, { title: "Update info", message: `アップデートが利用可能です。http://twicusstumble.ddns.net/ からダウンロードしてください。(v${VERSION} -> v${appVersionJSON.latest_version})`})
        }
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

ipcMain.on(IPC_MESSAGES.USE_OFFICIAL_JRE, (event, bool) => {
    useOfficialJRE = bool
    console.log(`useOfficialJRE: ${useOfficialJRE}`)
})

ipcMain.on(IPC_MESSAGES.RUN_MINECRAFT_DIRECTLY, (event, bool) => {
    runMinecraftDirectly = bool
    console.log(`runMinecraftDirectly: ${runMinecraftDirectly}`)
})

ipcMain.on(IPC_MESSAGES.RUN_MINECRAFT, async () => {
    console.log("running minecraft...")

    const serverListHandler = new ServerListHandler()
    await serverListHandler.loadServerJSON("http://twicusstumble.ddns.net/mods/twicuss1.12.2.json")

    const args = await serverListHandler.prepareToRunMinecraft(minecraftAuthProvider.userName, minecraftAuthProvider.uuid, minecraftAuthProvider.minecraftAuthToken)
    
    const exec = util.promisify(childProcess.exec)

    let javaPath
    if (process.platform == "win32") {
        if (useOfficialJRE) {
            javaPath = path.join(app.getPath("appData"), "../Local/Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/runtime/jre-legacy/windows-x64/jre-legacy/bin/javaw.exe")
        } else {
            javaPath = path.join(app.getPath("appData"), ".twicusslauncher/minecraft/runtime/jre-legacy/jdk8u362-b09-jre/bin/javaw.exe")
        }
    } else if (process.platform == "darwin") {
        if (useOfficialJRE) {
            javaPath = path.join(app.getPath("appData"), "minecraft/runtime/jre-legacy/mac-os/jre-legacy/jre.bundle/Contents/Home/bin/java")
        }
    }

    if (javaPath && (process.platform == "win32" || runMinecraftDirectly)) {
        exec(`${javaPath.replaceAll(" ", "\\ ")} ${args}`, (error, stdout, stderror) => {
            if (error) {
                console.log(error)
                dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `Minecraftの起動に失敗しました`})
            }
        })
    } else {
        exec("open /Applications/Minecraft.app").then(() => {
            app.quit()
        })
    }
})