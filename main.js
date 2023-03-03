const { app, ipcMain, dialog, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");
const util = require("util");
const childProcess = require("child_process");
const axios = require("axios");

const { IPC_MESSAGES } = require("./app/constants");
const Downloader = require("./app/Downloader.js");
const AccountHandler = require("./app/account/AccountHandler.js");
const ServerListHandler = require("./app/version/ServerListHandler.js");

require("./app/account/AccountHandler.js");

const VERSION = require("./package.json").version;

let accountHandler;

let mainWindow;

let useOfficialJRE = false;

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
    });
}

app.whenReady().then(() => {
    createWindow();

    accountHander = new AccountHandler(mainWindow);
    accountHandler.autoLogin();

    checkUpdate();
});

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
        // windowsの場合はautoUpdaterで自動更新
        autoUpdater.checkForUpdates();
        autoUpdater.on("update-downloaded", async (info) => {
            const response = await dialog.showMessageBox(mainWindow, { type: "info", title: "Update available", buttons: ["再起動", "後で"], message: "アップデートが利用可能です。今すぐアプリを再起動しますか？" });
            if (response.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });

        autoUpdater.on("error", (error) => {
            dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `アプリのアップデートに失敗しました\r\n${error}`});
        });
    } else {
        // twicusslauncher.jsonについて
        // {
        //     "latset_version": "{最新のバージョン（1.0.0など）},"
        //     "supported_versions": ["{サポートされているバージョン}", "{}", ...]
        // }
        const appVersionJSON = await Downloader.downloadJSON("http://twicusstumble.ddns.net/download/twicusslauncher.json");
        if (!appVersionJSON.supported_versions.includes(VERSION)) {
            dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `このバージョン (v${VERSION}) は現在サポートされていません。http://twicusstumble.ddns.net/ から最新のものをダウンロードしてください。`}).then(() => {
                shell.openExternal("https://github.com/TwitshuffTech/TwicussLauncher/releases");
                app.quit();
            });
        } else if (appVersionJSON.latest_version !== VERSION) {
            dialog.showMessageBox(mainWindow, { title: "Update info", message: `アップデートが利用可能です。http://twicusstumble.ddns.net/ からダウンロードしてください。(v${VERSION} -> v${appVersionJSON.latest_version})`}).then(() => {
                shell.openExternal("https://github.com/TwitshuffTech/TwicussLauncher/releases");
            });
        }
    }
}

ipcMain.on(IPC_MESSAGES.LOGIN, () => {
    accountHandler.login();
});

ipcMain.on(IPC_MESSAGES.LOGOUT, () => {
    accountHandler.logout();
});

ipcMain.on(IPC_MESSAGES.USE_OFFICIAL_JRE, (event, bool) => {
    useOfficialJRE = bool;
});

ipcMain.on(IPC_MESSAGES.RUN_MINECRAFT, async () => {
    console.log("running minecraft...");

    const serverListHandler = new ServerListHandler();
    await serverListHandler.loadServerJSON("http://twicusstumble.ddns.net/mods/twicuss1.12.2.json");

    const args = await serverListHandler.prepareToRunMinecraft(accountHandler.getUserName(), accountHandler.getUUID(), accountHandler.getMinecraftAuthToken());
    
    const exec = util.promisify(childProcess.exec);

    let javaPath;
    if (process.platform == "win32") {
        if (useOfficialJRE) {
            javaPath = path.join(app.getPath("appData"), "../Local/Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/runtime/jre-legacy/windows-x64/jre-legacy/bin/javaw.exe");
        } else {
            javaPath = path.join(app.getPath("appData"), ".twicusslauncher/minecraft/runtime/jre-legacy/jdk8u362-b09-jre/bin/javaw.exe");
        }
    } else if (process.platform == "darwin") {
        if (useOfficialJRE) {
            javaPath = path.join(app.getPath("appData"), "minecraft/runtime/jre-legacy/mac-os/jre-legacy/jre.bundle/Contents/Home/bin/java");
        } else {
            javaPath = path.join(app.getPath("appData"), ".twicusslauncher/minecraft/runtime/jre-legacy/jdk8u362-b09-jre/Contents/Home/bin/java");
        }
    }

    if (javaPath) {
        exec(`${javaPath.replaceAll(" ", "\\ ")} ${args}`, (error, stdout, stderror) => {
            if (error) {
                dialog.showMessageBox(mainWindow, { type: "error", title: "Error", message: `Minecraftの起動に失敗しました\r\n${error}`});
            }
        });
    }
})