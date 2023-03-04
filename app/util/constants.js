const { app } = require("electron");
const path = require("path");

const IPC_MESSAGES = {
    SHOW_PLAYER_NAME: "SHOW_PLAYER_NAME",
    SHOW_SKIN_VIEWER: "SHOW_SKIN_VIEWER",
    SHOW_SERVER_STATUS: "SHOW_SERVER_STATUS",
    SHOW_INSTALLED_MODS: "SHOW_INSTALLED_MODS",
    USE_OFFICIAL_JRE: "USE_OFFICIAL_JRE",
    RELOAD_MODS: "RELOAD_MODS",
    DELETE_MOD: "DELETE_MOD",
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    RUN_MINECRAFT: "RUN_MINECRAFT"
};

const DIRECTORIES = {
    MINECRAFT: (process.platform === "darwin") ? path.join(app.getPath("appData"), "minecraft") : path.join(app.getPath("appData"), ".minecraft"),
    LAUNCHER: path.join(app.getPath("appData"), ".twicusslauncher/minecraft")
}

module.exports = {
    IPC_MESSAGES: IPC_MESSAGES,
    DIRECTORIES: DIRECTORIES
};