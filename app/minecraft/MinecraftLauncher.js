const { app } = require("electron");
const path = require("path");
const util = require("util");
const childProcess = require("child_process");

const ServerListHandler = require("./version/ServerListHandler.js");
const VersionManager = require("./version/VersionManager");
const ModManager = require("./ModManager");

GAME_DIRECTORY = (process.platform === "darwin") ? path.join(app.getPath("appData"), "minecraft") : path.join(app.getPath("appData"), ".minecraft");

class MinecraftLauncher {
    constructor(server) {
        this.server = server;
        this.gameDirectory = server;
        this.serverListHandler = new ServerListHandler(this.server);
    }

    async setup() {
        let serverJSON = await this.serverListHandler.loadServerJSON();
        this.versionManager = new VersionManager(serverJSON);
        this.modManager = new ModManager();

        await this.serverListHandler.downloadServersDat(this.gameDirectory);
        await this.serverListHandler.addLaunchProfile();

        await this.versionManager.donwloadFiles();
        await this.modManager.downloadMods(this.serverListHandler.getModList(), this.gameDirectory);
    }

    async launchGame(userName, uuid, minecraftAuthToken, useOfficialJRE) {
        console.log("launching minecraft...");
        const args = await this.getArgs(this.gameDirectory, userName, uuid, minecraftAuthToken);

        const exec = util.promisify(childProcess.exec);
        const javaPath = this.versionManager.getJavaPath(useOfficialJRE);

        console.log(`${javaPath.replaceAll(" ", "\\ ")} ${args}`);
        if (javaPath) {
            exec(`${javaPath.replaceAll(" ", "\\ ")} ${args}`, (error, stdout, stderror) => {
                if (error) {
                    return error;
                }
            });
        }
    }

    getArgs(directory, userName, uuid, minecraftAuthToken) {
        let libraries;
        if (this.versionManager.isForge()) {
            libraries = this.versionManager.getLibraryPaths(this.versionManager.getJSONLoader().getLibraries().concat(this.versionManager.vanilaVersionManager.getJSONLoader().getLibraries()));
        } else {
            libraries = this.versionManager.getLibraryPaths(this.versionManager.getJSONLoader().getLibraries());
        }

        let jvmArgs = [
            `-Djava.library.path=${this.versionManager.getNativeDirectory().replaceAll(" ", "\\ ")}`,
            `-Dminecraft.launcher.brand=${"TwicussLauncher"}`,
            `-Dminercaft.launcher.version=${"1.1"}`,
            `-Dminecraft.client.jar=${this.versionManager.getClientPath().replaceAll(" ", "\\ ")}`,
            `-cp ${((process.platform === "win32") ? libraries.join(';') : libraries.join(':')).replaceAll(" ", "\\ ")}`,
            `-Xss1M`,
        ];

        switch (process.platform) {
            case "win32":
                jvmArgs.push(`"-Dos.name=Windows 10" -Dos.version=10.0`);
                jvmArgs.push(`-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump`);
                break;
            case "darwin":
                jvmArgs.push(`-Xdock:name=Minecraft`);
                jvmArgs.push(`-Xdock:icon=${path.join(app.getPath("appData"), "minecraft/assets/objects/99/991b421dfd401f115241601b2b373140a8d78572").replaceAll(" ", "\\ ")}`);
                break;
        }

        let mainClass = this.versionManager.jsonLoader.getMainClass();

        let gameArgs = [
            `--username ${userName}`,
            `--version ${this.versionManager.jsonLoader.getId()}`,
            `--gameDir ${path.join(app.getPath("appData"), `.twicusslauncher/minecraft/${directory}`).replaceAll(" ", "\\ ")}`,
            `--assetsDir ${path.join(GAME_DIRECTORY, "assets").replaceAll(" ", "\\ ")}`,
            `--assetIndex ${this.versionManager.isForge() ? this.versionManager.vanilaVersionManager.jsonLoader.getAssetIndex().id : this.versionManager.jsonLoader.getAssetIndex().id}`,
            `--uuid ${uuid}`,
            `--accessToken ${minecraftAuthToken}`,
            `--userType ${"msa"}`,
            `--versionType ${this.versionManager.jsonLoader.getType()}`,
        ];

        if (this.versionManager.isForge()) {
            gameArgs.push(`--tweakClass ${"net.minecraftforge.fml.common.launcher.FMLTweaker"}`);
        }

        return jvmArgs.join(' ') + " " + mainClass + " " + gameArgs.join(' ');
    }
}

module.exports = MinecraftLauncher;