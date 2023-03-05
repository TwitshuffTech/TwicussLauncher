const fs = require("fs");

class JSONLoader {
    constructor(path, type) {
        this.path = path;

        if (type === "minecraft") {
            this.isForge = false;
        } else if (type === "forge") {
            this.isForge = true;
        }
    }

    load() {
        this.file = JSON.parse(fs.readFileSync(this.path));
    }

    getAssetIndex() {
        if (this.isForge) {
            return null;
        } else {
            return this.file.assetIndex;
        }
    }

    getClientDownloadURL() {
        if (this.isForge) {
            return null;
        } else {
            return this.file.downloads.client.url;
        }
    }

    getId() {
        return this.file.id;
    }

    getJavaVersion() {
        if (this.isForge) {
            return null;
        } else {
            return this.file.javaVersion.component;
        }
    }

    getLibraries() {
        return this.file.libraries;
    }

    getLogging() {
        if (this.isForge) {
            return null;
        } else {
            return this.file.logging.client;
        }
    }

    getMainClass() {
        return this.file.mainClass;
    }

    getMinecraftArguments() {
        return this.file.minecraftArguments;
    }

    getType() {
        return this.file.type;
    }
}

module.exports = JSONLoader;