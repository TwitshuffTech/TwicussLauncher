const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("renderer", {
    sendLoginMessage: () => {
        ipcRenderer.send("LOGIN")
    },
    sendSignoutMessage: () => {
        ipcRenderer.send("LOGOUT")
    },
    sendRunMinecraftMessage: () => {
        ipcRenderer.send("RUN_MINECRAFT")
    },
    sendIfUseOfficialJRE: (bool) => {
        ipcRenderer.send("USE_OFFICIAL_JRE", bool)
    },
    showPlayerName: (func) => {
        ipcRenderer.on("SHOW_PLAYER_NAME", (event, ...args) => func(event, ...args))
    },
    showSkinViewer: (func) => {
        ipcRenderer.on("SHOW_SKIN_VIEWER", (event, ...args) => func(event, ...args))
    },
    showServerStatus: (func) => {
        ipcRenderer.on("SHOW_SERVER_STATUS", (event, ...args) => func(event, ...args))
    },
})