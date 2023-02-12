const fs = require("fs")

class ForgeJSONLoader {
    path
    file

    constructor(path) {
        this.path = path
    }

    load() {
        this.file = JSON.parse(fs.readFileSync(this.path))
    }

    getId() {
        return this.file.id
    }

    getLibraries() {
        return this.file.libraries
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

module.exports = ForgeJSONLoader