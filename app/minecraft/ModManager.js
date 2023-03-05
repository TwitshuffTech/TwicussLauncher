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
        }).map((dirent) => {
            return dirent.name
        });

        return mods;
    }

    getModType(name, modList, legacyModList) {
        for (let mod of modList) {
            if (name === mod.name) {
                return "REQUIRED";
            }
        }
        for (let modName of legacyModList) {
            if (name === modName) {
                return "LEGACY";
            }
        }
        return "";
    }

    removeLegacyMods(modList) {
        for (let mod of modList) {
            this.removeMod(mod);
        }
    }
    

    removeMod(fileName) {
        if (fs.existsSync(path.join(this.gameDirectory, "mods/" + fileName))) {
            fs.unlinkSync(path.join(this.gameDirectory, "mods/" + fileName));
            console.log(`removed ${fileName}`);
            return true;
        } else {
            return false;
        }
    }
}

module.exports = ModManager;