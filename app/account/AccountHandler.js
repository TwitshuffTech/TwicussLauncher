const { BrowserWindow } = require("electron");
const path = require("path");

const { msalConfig } = require("./authConfig.js");
const { IPC_MESSAGES } = require("../constants.js");

const MicrosoftAuthProvider = require("./MicrosoftAuthProvider");
const MinecraftAuthProvider = require("./MinecraftAuthProvider");
const ServerStatus = require("../ServerStatus.js");

const microsoftAuthProvider = new MicrosoftAuthProvider(msalConfig);
const minecraftAuthProvider = new MinecraftAuthProvider();

const serverStatus = new ServerStatus();

class AccountHandler {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    async autoLogin() {
        const token = await microsoftAuthProvider.autoLogin();
        if (token) {
            this.transiteToMain(token);
        } else {
            this.mainWindow.loadFile(path.join(__dirname, "../html/login.html"));
        }
    }

    async login() {
        const loginUrl = await microsoftAuthProvider.getAuthCodeUrl();
        const loginWindow = new BrowserWindow({
            width: 800,
            height: 600,
            frame: false
        });

        loginWindow.loadURL(loginUrl);

        loginWindow.webContents.on("will-redirect", async (event, redirectUrl) => {
            if (redirectUrl.startsWith("https://login.microsoftonline.com/common/oauth2/nativeclient?code=")) {
                const code = redirectUrl.substring(redirectUrl.indexOf("?code=") + 6, redirectUrl.indexOf("&"));
                const token = await microsoftAuthProvider.exchangeToken(code);

                if (token) {
                    this.transiteToMain(token);
                    loginWindow.close();
                }
            } else if (redirectUrl.startsWith("https://login.microsoftonline.com/common/oauth2/nativeclient?error=")) {
                console.log("Access denied.");
                loginWindow.close();
            }
        })
    }

    async transiteToMain(token) {
        this.mainWindow.loadFile(path.join(__dirname, "../html/loginTransition.html"));
        
        await minecraftAuthProvider.authMinecraft(token);
    
        if (!await minecraftAuthProvider.checkGameOwnership()) {
            dialog.showMessageBox(this.mainWindow, { type: "error", title: "Error", message: `Minecraftを所有していません`});

            await this.logout();
        } else {
            await this.mainWindow.loadFile(path.join(__dirname, "../html/index.html"));
    
            this.mainWindow.webContents.send(IPC_MESSAGES.SHOW_PLAYER_NAME, minecraftAuthProvider.userName);
            this.mainWindow.webContents.send(IPC_MESSAGES.SHOW_SKIN_VIEWER, await minecraftAuthProvider.get3DSkinImage());
    
            this.mainWindow.webContents.send(IPC_MESSAGES.SHOW_SERVER_STATUS, await serverStatus.getServerStatus());
        }
    }

    async logout() {
        await microsoftAuthProvider.logout();
        this.mainWindow.loadFile(path.join(__dirname, "../html/login.html"));
    }

    getUserName() {
        return minecraftAuthProvider.userName;
    }

    getUUID() {
        return minecraftAuthProvider.uuid;
    }

    getMinecraftAuthToken() {
        return minecraftAuthProvider.minecraftAuthToken;
    }
}

module.exports = AccountHandler;