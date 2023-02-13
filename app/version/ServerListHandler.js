const { app } = require("electron")
const path = require("path")
const fs = require("fs")

const VersionHandler = require("./VersionHandler.js")
const downloader = require("../downloader.js")

const LAUNCHER_DIRECTORY = path.join(app.getPath("appData"), ".twicusslauncher/minecraft")

class ServerListHandler {
    serverJSON
    versionHandler

    constructor() {

    }

    async loadServerJSON(url) {
        this.serverJSON = await downloader.downloadJSON(url)
        this.createVersionHandler()
    }

    createVersionHandler() {
        const serverInfo = {
            "type": this.serverJSON.type,
            "version": this.serverJSON.version,
            "jsonURL": this.serverJSON.jsonURL,
            "clientURL": this.serverJSON.clientURL,
            "vanila": this.serverJSON.vanila,
        }
        this.versionHandler = new VersionHandler(serverInfo)
    }


    async downloadMods() {
        for (let mod of this.serverJSON.mods) {
            if (!fs.existsSync(path.join(LAUNCHER_DIRECTORY, this.serverJSON.version + "/mods/" + mod.name))) {
                console.log(`Downloading ${mod.name} from ${mod.url} ...`)
                await downloader.downloadAndSave(mod.url, path.join(LAUNCHER_DIRECTORY, this.serverJSON.version + "/mods/" + mod.name))
            }
        }
    }

    downloadServersDat() {
        if (!fs.existsSync(path.join(LAUNCHER_DIRECTORY, this.serverJSON.version + "/servers.dat"))) {
            downloader.downloadAndSave(this.serverJSON.servers_dat, path.join(LAUNCHER_DIRECTORY, this.serverJSON.version + "/servers.dat"))
        }
    }

    async prepareToRunMinecraft(userName, uuid, minecraftAuthToken) {
        await this.versionHandler.downloadFile()
        await this.versionHandler.downloadLibraries(this.versionHandler.nativeDirectory)
        await this.downloadMods()
        await this.downloadServersDat()
        return await this.versionHandler.getArgs(userName, uuid, minecraftAuthToken)
    }
}

module.exports = ServerListHandler