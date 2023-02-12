const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("renderer", {
    sendLoginMessage: () => {
        ipcRenderer.send("LOGIN")
    },
    sendSignoutMessage: () => {
        ipcRenderer.send("LOGOUT")
    },
    showWelcomeMessage: (func) => {
        ipcRenderer.on("SHOW_WELCOME_MESSAGE", (event, ...args) => func(event, ...args))
    }
})