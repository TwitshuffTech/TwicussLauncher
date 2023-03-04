const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("renderer", {
    sendLoginMessage: () => {
        ipcRenderer.send("LOGIN");
    },
    sendSignoutMessage: () => {
        ipcRenderer.send("LOGOUT");
    },
    sendRunMinecraftMessage: () => {
        ipcRenderer.send("RUN_MINECRAFT");
    },
    sendIfUseOfficialJRE: (bool) => {
        ipcRenderer.send("USE_OFFICIAL_JRE", bool);
    },
    sendReloadingMods: () => {
        ipcRenderer.send("RELOAD_MODS");
    },
    sendDeletingMods: () => {
        ipcRenderer.send("DELETE_MOD", mod);
    },
    showPlayerName: (func) => {
        ipcRenderer.on("SHOW_PLAYER_NAME", (event, ...args) => func(event, ...args));
    },
    showSkinViewer: (func) => {
        ipcRenderer.on("SHOW_SKIN_VIEWER", (event, ...args) => func(event, ...args));
    },
    showServerStatus: (func) => {
        ipcRenderer.on("SHOW_SERVER_STATUS", (event, ...args) => func(event, ...args));
    },
    showInstalledMods: (func) => {
        ipcRenderer.on("SHOW_INSTALLED_MODS", (event, ...args) => func(event, ...args));
    }
});