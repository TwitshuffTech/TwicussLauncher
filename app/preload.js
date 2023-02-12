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
    showWelcomeMessage: (func) => {
        ipcRenderer.on("SHOW_WELCOME_MESSAGE", (event, ...args) => func(event, ...args))
    },
})