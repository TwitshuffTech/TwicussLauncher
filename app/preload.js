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