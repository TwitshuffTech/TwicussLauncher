const { app } = require("electron");
const path = require("path");
const fs = require("fs");

const Downloader = require("../util/Downloader");

class ModManager {
    constructor(gameDirectory) {
        this.gameDirectory = gameDirectory;
    }

    setGameDirectory(gameDirectory) {
        this.gameDirectory = gameDirectory;
    }

    async downloadMods(modList) {
        for (let mod of modList) {
            if (!fs.existsSync(path.join(this.gameDirectory, "mods/" + mod.name))) {
                console.log(`Downloading ${mod.name} from ${mod.url}...`);
                await Downloader.downloadAndSave(mod.url, path.join(this.gameDirectory, "mods/" + mod.name));
            }
        }
    }

    getInstalledMods() {
        if (!fs.existsSync(path.join(this.gameDirectory, "mods"))) {
            return [];
        }

        const dirents = fs.readdirSync(path.join(this.gameDirectory, "mods"), { withFileTypes: true });
        const mods = dirents.filter((dirent) => {
            return dirent.name.endsWith(".jar") || dirent.name.endsWith(".zip");
        }).map(dirent => dirent.name);

        return mods;
    }

    removeMod(fileName) {
        fs.unlinkSync(path.join(this.gameDirectory, "mods/" + fileName));
    }
}

module.exports = ModManager;