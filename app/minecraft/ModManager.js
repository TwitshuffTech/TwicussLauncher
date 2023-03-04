const { app } = require("electron");
const path = require("path");
const fs = require("fs");

const Downloader = require("../Downloader");

LAUNCHER_DIRECTORY = path.join(app.getPath("appData"), ".twicusslauncher/minecraft");

class ModManager {
    constructor() {}

    async downloadMods(modList, gameDirectory) {
        for (let mod of modList) {
            if (!fs.existsSync(path.join(LAUNCHER_DIRECTORY, gameDirectory + "/mods/" + mod.name))) {
                console.log(`Downloading ${mod.name} from ${mod.url}...`);
                await Downloader.downloadAndSave(mod.url, path.join(LAUNCHER_DIRECTORY, gameDirectory + "/mods/" + mod.name));
            }
        }
    }
}

module.exports = ModManager;