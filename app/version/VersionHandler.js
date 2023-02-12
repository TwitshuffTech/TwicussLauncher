const { app } = require("electron")
const path = require("path")
const fs = require("fs")

const downloader = require("../downloader.js")

const JSONLoader = require("./JSONLoader")
const ForgeJSONLoader = require("./ForgeJSONLoader")

const GAME_DIRECTORY = path.join(app.getPath("appData"), ".minecraft")

class VersionHandler {
    VERSION
    jsonPath
    clientPath

    json
    forgeJson

    vanilaVersionHandler

    jsonLoader

    constructor(VERSION) {
        this.VERSION = VERSION
        this.jsonPath = path.join(GAME_DIRECTORY, "versions/" + this.VERSION["version"] + "/" + this.VERSION["version"] + ".json")
        this.clientPath = path.join(GAME_DIRECTORY, "versions/" + this.VERSION["version"] + "/" + this.VERSION["version"] + ".jar")

        if (this.VERSION["type"] == "forge") {
            this.vanilaVersionHandler = new VersionHandler(this.VERSION["vanila"])
        }
    }

    exists() {
        return fs.existsSync(this.jsonPath) && fs.existsSync(this.clientPath)
    }

    async downloadFile() {
        if (this.vanilaVersionHandler) {
            await this.vanilaVersionHandler.downloadFile()
        }
        
        if (!this.exists()) {
            await downloader.downloadAndSave(this.VERSION["jsonURL"], this.jsonPath)
            await downloader.downloadAndSave(this.VERSION["clientURL"], this.clientPath)
        }

        if (this.VERSION["type"] == "forge") {
            this.jsonLoader = new ForgeJSONLoader(this.jsonPath)
            await this.jsonLoader.load()
        } else {
            this.jsonLoader = new JSONLoader(this.jsonPath)
            await this.jsonLoader.load()
        }
    }

    async downloadLibraries() {
        if (this.vanilaVersionHandler) {
            this.vanilaVersionHandler.downloadLibraries()
        }

        for (let library of this.jsonLoader.getLibraries()) {
            let address
            let url
            if ("natives" in library) {
                if (process.platform == "win32" && "windows" in library.natives) {
                    address = library.downloads.classifiers["natives-windows"].path
                    url = library.downloads.classifiers["natives-windows"].url
                } else if (process.platform == "darwin" && "osx" in library.natives) {
                    address = library.downloads.classifiers["natives-osx"].path
                    url = library.downloads.classifiers["natives-osx"].url
                } else if (process.platform == "linux" && "linux" in library.natives) {
                    address = library.downloads.classifiers["natives-linux"].path
                    url = library.downloads.classifiers["natives-linux"].url
                }
            } else {
                address = library.downloads.artifact.path
                url = library.downloads.artifact.url
            }

            if (address && !fs.existsSync(path.join(GAME_DIRECTORY, "libraries/" + address))) {
                await downloader.downloadAndSave(url, path.join(GAME_DIRECTORY, "libraries/" + address))
            }
        }
    }

    getArgs(userName, uuid, minecraftAuthToken) {
        if (this.VERSION["type"] == "minecraft") {
            const libraries = []

            for (let library of this.jsonLoader.getLibraries()) {
                if ("extract" in library) {
                    continue
                }
                let address
                if ("natives" in library) {
                    if (process.platform == "win32" && "windows" in library.natives) {
                        address = library.downloads.classifiers["natives-windows"].path
                    } else if (process.platform == "darwin" && "osx" in library.natives) {
                        address = library.downloads.classifiers["natives-osx"].path
                    } else if (process.platform == "linux" && "linux" in library.natives) {
                        address = library.downloads.classifiers["natives-linux"].path
                    }
                } else {
                    address = library.downloads.artifact.path
                }
                libraries.push(path.join(GAME_DIRECTORY, "libraries/" + address))
            }
            libraries.push(this.clientPath)

            const JVM_ARGS = [
                `"-Dos.name=Windows 10" -Dos.version=10.0`,
                `-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump`,
                `-Djava.library.path=${path.join(GAME_DIRECTORY, "bin/664ffd52c57ab778a66525626e44d9d3545735fd")}`,
                `-Dminecraft.launcher.brand=${"TwicussLauncher"}`,
                `-Dminercaft.launcher.version=${"1.0"}`,
                `-Dminecraft.client.jar=${this.clientPath}`,
                `-cp ${libraries.join(';')}`,
                `-Xss1M`,
            ]
            const MAIN_CLASS = this.jsonLoader.getMainClass()
            const GAME_ARGS = [
                `--username ${userName}`,
                `--version ${this.jsonLoader.getId()}`,
                `--gameDir ${path.join(app.getPath("appData"), `.twicusslauncher/minecraft/${this.jsonLoader.getId()}`)}`,
                `--assetsDir ${path.join(GAME_DIRECTORY, "assets")}`,
                `--assetsIndex ${this.jsonLoader.getAssetIndex().id}`,
                `--uuid ${uuid}`,
                `--accessToken ${minecraftAuthToken}`,
                `--userType ${"msa"}`,
                `--versionType ${this.jsonLoader.getType()}`,
            ]

            return JVM_ARGS.join(' ') + " " + MAIN_CLASS + " " + GAME_ARGS.join(' ')

        } else if (this.VERSION["type"] == "forge") {
            const libraries = []

            for (let library of this.jsonLoader.getLibraries().concat(this.vanilaVersionHandler.jsonLoader.getLibraries())) {
                if ("extract" in library) {
                    continue
                }
                let address
                if ("natives" in library) {
                    if (process.platform == "win32" && "windows" in library.natives) {
                        address = library.downloads.classifiers["natives-windows"].path
                    } else if (process.platform == "darwin" && "osx" in library.natives) {
                        address = library.downloads.classifiers["natives-osx"].path
                    } else if (process.platform == "linux" && "linux" in library.natives) {
                        address = library.downloads.classifiers["natives-linux"].path
                    }
                } else {
                    address = library.downloads.artifact.path
                }
                libraries.push(path.join(GAME_DIRECTORY, "libraries/" + address))
            }
            libraries.push(this.clientPath)

            const JVM_ARGS = [
                `"-Dos.name=Windows 10" -Dos.version=10.0`,
                `-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump`,
                `-Djava.library.path=${path.join(GAME_DIRECTORY, "bin/536f782a83ade8b9ff4452bf096fb20f6817f2bf")}`,
                `-Dminecraft.launcher.brand=${"TwicussLauncher"}`,
                `-Dminercaft.launcher.version=${"1.0"}`,
                `-Dminecraft.client.jar=${this.clientPath}`,
                `-cp ${libraries.join(';')}`,
                `-Xss1M`,
            ]
            const MAIN_CLASS = this.jsonLoader.getMainClass()
            const GAME_ARGS = [
                `--username ${userName}`,
                `--version ${this.jsonLoader.getId()}`,
                `--gameDir ${path.join(app.getPath("appData"), `.twicusslauncher/minecraft/${this.jsonLoader.getId()}`)}`,
                `--assetsDir ${path.join(GAME_DIRECTORY, "assets")}`,
                `--assetsIndex ${this.vanilaVersionHandler.jsonLoader.getAssetIndex().id}`,
                `--uuid ${uuid}`,
                `--accessToken ${minecraftAuthToken}`,
                `--userType ${"msa"}`,
                `--tweakClass ${"net.minecraftforge.fml.common.launcher.FMLTweaker"}`,
                `--versionType ${"Forge"}`,
            ]

            return JVM_ARGS.join(' ') + " " + MAIN_CLASS + " " + GAME_ARGS.join(' ')
        }
    }
}

module.exports = VersionHandler