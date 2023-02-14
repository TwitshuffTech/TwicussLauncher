const { app } = require("electron")
const path = require("path")
const fs = require("fs")

const VersionHandler = require("./VersionHandler.js")
const downloader = require("../downloader.js")

const GAME_DIRECTORY = (process.platform == "darwin") ? path.join(app.getPath("appData"), "minecraft") : path.join(app.getPath("appData"), ".minecraft")
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
            "preClientURL": this.serverJSON.preClientURL,
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

    addLaunchProfile() {
        const propertiesJSON = JSON.parse(fs.readFileSync(path.join(GAME_DIRECTORY, "launcher_profiles.json")))
        const profileName = this.serverJSON.name
        if (!(profileName in Object.keys(propertiesJSON.profiles))) {
            propertiesJSON.profiles[`${profileName}`] = {
                "name": profileName,
                "type": "custom",
                "lastVersionId": this.serverJSON.version,
                "gameDir": path.join(LAUNCHER_DIRECTORY, this.serverJSON.version),
                "icon": this.serverJSON.icon
            }
            fs.writeFileSync(path.join(GAME_DIRECTORY, "launcher_profiles.json"), JSON.stringify(propertiesJSON))
        }
    }

    async prepareToRunMinecraft(userName, uuid, minecraftAuthToken) {
        await this.versionHandler.downloadFile()
        await this.versionHandler.downloadJava()
        await this.versionHandler.downloadLibraries(this.versionHandler.nativeDirectory)
        await this.versionHandler.downloadAssets()
        await this.downloadMods()
        await this.downloadServersDat()
        await this.addLaunchProfile()
        return this.versionHandler.getArgs(userName, uuid, minecraftAuthToken)
    }
}

module.exports = ServerListHandler