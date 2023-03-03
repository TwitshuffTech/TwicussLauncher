const { app } = require("electron")
const path = require("path")
const fs = require("fs")
const axios = require("axios")
const unzip = require("extract-zip")
const tar = require("tar")

const downloader = require("../downloader.js")

const JSONLoader = require("./JSONLoader")
const ForgeJSONLoader = require("./ForgeJSONLoader");

const GAME_DIRECTORY = (process.platform === "darwin") ? path.join(app.getPath("appData"), "minecraft") : path.join(app.getPath("appData"), ".minecraft");
const LAUNCHER_DIRECTORY = path.join(app.getPath("appData"), ".twicusslauncher/minecraft");

class VersionHandler {
    // 引数について
    // serverInfo = {
    //     "type": "minecraft" or "forge",
    //     "version": "{バージョン（バージョン.jsonのid）}",
    //     "jsonURL": "{バージョン.jsonのづアンロードURL}",
    //     "clientURL": "{バージョン.jarのダウンロードURL}",
    //     "preClientURL": "{ビルド前のforgeバージョン.jarのダウンロードURL（typeがforgeの場合のみ）}",
    //     "vanila": "{再帰的にVersionHandlerに渡す引数（typeがforgeの場合のみ）}"
    // }
    constructor(serverInfo) {
        this.serverInfo = serverInfo;
        this.jsonPath = path.join(GAME_DIRECTORY, "versions/" + this.serverInfo["version"] + "/" + this.serverInfo["version"] + ".json");
        this.clientPath = path.join(GAME_DIRECTORY, "versions/" + this.serverInfo["version"] + "/" + this.serverInfo["version"] + ".jar");

        this.nativeDirectory = path.join(app.getPath("appData"), ".twicusslauncher/minecraft/" + this.serverInfo["version"] + "/natives");
        if (!fs.existsSync(this.nativeDirectory)) {
            fs.mkdirSync(this.nativeDirectory, { recursive: true });
        }

        if (this.serverInfo["type"] === "forge") {
            this.vanilaVersionHandler = new VersionHandler(this.serverInfo["vanila"]);
        }
    }

    // バージョン.jsonと.jarが存在するか確認
    versionExists() {
        return fs.existsSync(this.jsonPath) && fs.existsSync(this.clientPath);
    }

    // バージョン.jsonと.jar（forgeバージョンの場合はforgeも）をダウンロードする
    async downloadFile() {
        if (this.vanilaVersionHandler) {
            await this.vanilaVersionHandler.downloadFile();
        }
        
        if (!this.versionExists()) {
            await downloader.downloadAndSave(this.serverInfo["jsonURL"], this.jsonPath);
            await downloader.downloadAndSave(this.serverInfo["clientURL"], this.clientPath);
        }

        if (this.serverInfo["type"] === "forge") {
            this.jsonLoader = new ForgeJSONLoader(this.jsonPath);
            await this.jsonLoader.load();
        } else {
            this.jsonLoader = new JSONLoader(this.jsonPath);
            await this.jsonLoader.load();
        }
    }

    // バージョンに合わせてjavaランタイムをダウンロードする
    async downloadJava() {
        const javaComponent = (this.vanilaVersionHandler) ? this.vanilaVersionHandler.jsonLoader.getJavaVersion() : this.jsonLoader.getJavaVersion()
        if (!fs.existsSync(path.join(LAUNCHER_DIRECTORY, "runtime/" + javaComponent))) {;
            if (javaComponent === "jre-legacy") {
                let url;
                if (process.platform === "win32") {
                    url = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u362-b09/OpenJDK8U-jre_x64_windows_hotspot_8u362b09.zip";
                    await downloader.downloadAndSave(url, path.join(LAUNCHER_DIRECTORY, "runtime/" + url.split('/').pop()));

                    fs.mkdirSync(path.join(LAUNCHER_DIRECTORY, "runtime/" + javaComponent), { recursive: true });
                    await unzip(path.join(LAUNCHER_DIRECTORY, "runtime/" + url.split('/').pop()), { dir: path.join(LAUNCHER_DIRECTORY, "runtime/" + javaComponent) });
                } else if (process.platform === "darwin") {
                    url = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u362-b09/OpenJDK8U-jre_x64_mac_hotspot_8u362b09.tar.gz";
                    await downloader.downloadAndSave(url, path.join(LAUNCHER_DIRECTORY, "runtime/" + url.split('/').pop()));

                    fs.mkdirSync(path.join(LAUNCHER_DIRECTORY, "runtime/" + javaComponent), { recursive: true });
                    await tar.extract({ file: path.join(LAUNCHER_DIRECTORY, "runtime/" + url.split('/').pop()), cwd: path.join(LAUNCHER_DIRECTORY, "runtime/" + javaComponent) });
                }
            }
        }
    }

    async downloadLibraries(nativeDirectory) {
        if (this.vanilaVersionHandler) {
            await this.vanilaVersionHandler.downloadLibraries(this.nativeDirectory);
        }

        for (let library of this.jsonLoader.getLibraries()) {
            let address;
            let url;
            
            if ("natives" in library) {
                if (process.platform === "win32" && "windows" in library.natives) {
                    address = library.downloads.classifiers["natives-windows"].path;
                    url = library.downloads.classifiers["natives-windows"].url;
                } else if (process.platform === "darwin" && "osx" in library.natives) {
                    address = library.downloads.classifiers["natives-osx"].path;
                    url = library.downloads.classifiers["natives-osx"].url;
                } else if (process.platform === "linux" && "linux" in library.natives) {
                    address = library.downloads.classifiers["natives-linux"].path;
                    url = library.downloads.classifiers["natives-linux"].url;
                }
            }
            if (!address) {
                address = library.downloads.artifact.path;
            }
            if (!url) {
                url = library.downloads.artifact.url;
            }

            if (!fs.existsSync(path.join(GAME_DIRECTORY, "libraries/" + address))) {
                if (url) {
                    await downloader.downloadAndSave(url, path.join(GAME_DIRECTORY, "libraries/" + address));
                } else {
                    await downloader.downloadAndSave(this.serverInfo["preClientURL"], path.join(GAME_DIRECTORY, "libraries/" + address)); // urlが記載されてないのは現状ビルド前のforgeバージョン.jarだけのためとりあえずこの場合分けで
                }                
            }
        }
        
        // nativesファイルをnativeDirectoryに展開する
        if (!fs.existsSync(path.join(nativeDirectory, "META-INF"))) {
            for (let library of this.jsonLoader.getLibraries()) {
                let address;
                let isNative = false;

                if ("natives" in library) {
                    if (process.platform === "win32" && "windows" in library.natives) {
                        address = library.downloads.classifiers["natives-windows"].path;
                        isNative = true;
                    } else if (process.platform === "darwin" && "osx" in library.natives) {
                        address = library.downloads.classifiers["natives-osx"].path;
                        isNative = true;
                    } else if (process.platform === "linux" && "linux" in library.natives) {
                        address = library.downloads.classifiers["natives-linux"].path;
                        isNative = true;
                    }
                }

                if (isNative) {
                    await unzip(`${path.join(GAME_DIRECTORY, "libraries/" + address)}`, { dir: nativeDirectory });
                }
            }
        }
    }

    async downloadAssets() {
        if (this.vanilaVersionHandler) {
            this.vanilaVersionHandler.downloadAssets();
        } else {
            if (!fs.existsSync(path.join(GAME_DIRECTORY, `assets/indexes/${this.jsonLoader.getAssetIndex().id}.json`))) {
                downloader.downloadAndSave(this.jsonLoader.getAssetIndex().url, path.join(GAME_DIRECTORY, `assets/indexes/${this.jsonLoader.getAssetIndex().id}.json`));
                const assetsJSON = await downloader.downloadJSON(this.jsonLoader.getAssetIndex().url);

                for (let name in assetsJSON.objects) {
                    const hashPath = assetsJSON.objects[name].hash.slice(0, 2) + "/" + assetsJSON.objects[name].hash;
                    await downloader.downloadAndSave(`https://resources.download.minecraft.net/${hashPath}`, path.join(GAME_DIRECTORY, `assets/objects/${hashPath}`));
                }
            }
        }
    }

    getLibraryPaths(libraries) {
        const paths = [];
        
        for (let library of libraries) {
            if ("extract" in library) {
                continue;
            }
            let address;
            if ("natives" in library) {
                if (process.platform === "win32" && "windows" in library.natives) {
                    address = library.downloads.classifiers["natives-windows"].path;
                } else if (process.platform === "darwin" && "osx" in library.natives) {
                    address = library.downloads.classifiers["natives-osx"].path;
                } else if (process.platform === "linux" && "linux" in library.natives) {
                    address = library.downloads.classifiers["natives-linux"].path;
                }
            } else {
                address = library.downloads.artifact.path;
            }
            paths.push(path.join(GAME_DIRECTORY, "libraries/" + address));
        }
        paths.push(this.clientPath);

        return paths;
    }

    // Minecraftの実行時引数を返す
    getArgs(userName, uuid, minecraftAuthToken) {
        if (this.serverInfo["type"] === "minecraft") {
            const libraries = this.getLibraryPaths(this.jsonLoader.getLibraries());

            const JVM_ARGS = [
                `-Djava.library.path=${this.nativeDirectory.replaceAll(" ", "\\ ")}`,
                `-Dminecraft.launcher.brand=${"TwicussLauncher"}`,
                `-Dminercaft.launcher.version=${"1.1"}`,
                `-Dminecraft.client.jar=${this.clientPath.replaceAll(" ", "\\ ")}`,
                `-cp ${((process.platform === "win32") ? libraries.join(';') : libraries.join(':')).replaceAll(" ", "\\ ")}`,
                `-Xss1M`,
            ];
            if (process.platform === "win32") {
                JVM_ARGS.push(`"-Dos.name=Windows 10" -Dos.version=10.0`);
                JVM_ARGS.push(`-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump`);
            } else if (process.platform === "darwin") {
                JVM_ARGS.push(`-Xdock:name=Minecraft`);
                JVM_ARGS.push(`-Xdock:icon=${path.join(app.getPath("appData"), "minecraft/assets/objects/99/991b421dfd401f115241601b2b373140a8d78572").replaceAll(" ", "\\ ")}`);
            }

            const MAIN_CLASS = this.jsonLoader.getMainClass();
            const GAME_ARGS = [
                `--username ${userName}`,
                `--version ${this.jsonLoader.getId()}`,
                `--gameDir ${path.join(app.getPath("appData"), `.twicusslauncher/minecraft/${this.jsonLoader.getId()}`).replaceAll(" ", "\\ ")}`,
                `--assetsDir ${path.join(GAME_DIRECTORY, "assets").replaceAll(" ", "\\ ")}`,
                `--assetIndex ${this.jsonLoader.getAssetIndex().id}`,
                `--uuid ${uuid}`,
                `--accessToken ${minecraftAuthToken}`,
                `--userType ${"msa"}`,
                `--versionType ${this.jsonLoader.getType()}`,
            ];

            return JVM_ARGS.join(' ') + " " + MAIN_CLASS + " " + GAME_ARGS.join(' ');

        } else if (this.serverInfo["type"] === "forge") {
            const libraries = this.getLibraryPaths(this.jsonLoader.getLibraries().concat(this.vanilaVersionHandler.jsonLoader.getLibraries()));

            const JVM_ARGS = [
                `-Djava.library.path=${this.nativeDirectory.replaceAll(" ", "\\ ")}`,
                `-Dminecraft.launcher.brand=${"TwicussLauncher"}`,
                `-Dminercaft.launcher.version=${"1.1"}`,
                `-Dminecraft.client.jar=${this.clientPath.replaceAll(" ", "\\ ")}`,
                `-cp ${((process.platform === "win32") ? libraries.join(';') : libraries.join(':')).replaceAll(" ", "\\ ")}`,
                `-Xss1M`,
            ];
            if (process.platform === "win32") {
                JVM_ARGS.push(`"-Dos.name=Windows 10" -Dos.version=10.0`);
                JVM_ARGS.push(`-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump`);
            } else if (process.platform === "darwin") {
                JVM_ARGS.push(`-Xdock:name=Minecraft`);
                JVM_ARGS.push(`-Xdock:icon=${path.join(app.getPath("appData"), "minecraft/assets/objects/99/991b421dfd401f115241601b2b373140a8d78572").replaceAll(" ", "\\ ")}`);
            }

            const MAIN_CLASS = this.jsonLoader.getMainClass();
            const GAME_ARGS = [
                `--username ${userName}`,
                `--version ${this.jsonLoader.getId()}`,
                `--gameDir ${path.join(app.getPath("appData"), `.twicusslauncher/minecraft/${this.jsonLoader.getId()}`).replaceAll(" ", "\\ ")}`,
                `--assetsDir ${path.join(GAME_DIRECTORY, "assets").replaceAll(" ", "\\ ")}`,
                `--assetIndex ${this.vanilaVersionHandler.jsonLoader.getAssetIndex().id}`,
                `--uuid ${uuid}`,
                `--accessToken ${minecraftAuthToken}`,
                `--userType ${"msa"}`,
                `--tweakClass ${"net.minecraftforge.fml.common.launcher.FMLTweaker"}`,
                `--versionType ${"Forge"}`,
            ];

            return JVM_ARGS.join(' ') + " " + MAIN_CLASS + " " + GAME_ARGS.join(' ');
        }
    }
}

module.exports = VersionHandler;