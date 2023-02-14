const fs = require("fs")

class JSONLoader {
    path
    file

    constructor(path) {
        this.path = path
    }

    load() {
        this.file = JSON.parse(fs.readFileSync(this.path))
    }

    getAssetIndex() {
        return this.file.assetIndex
    }

    getClientDownloadURL() {
        return this.file.downloads.client.url
    }

    getId() {
        return this.file.id
    }

    getJavaVersion() {
        return this.file.javaVersion.component
    }

    getLibraries() {
        return this.file.libraries
    }

    getLogging() {
        return this.file.logging.client
    }

    getMainClass() {
        return this.file.mainClass
    }

    getMinecraftArguments() {
        return this.file.minecraftArguments
    }

    getType() {
        return this.file.type
    }
}

module.exports = JSONLoader