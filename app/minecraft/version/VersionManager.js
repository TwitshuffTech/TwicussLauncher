const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const unzip = require("extract-zip");
const tar = require("tar");

const Downloader = require("../../util/Downloader.js");
const JSONLoader = require("./JSONLoader.js");

const { DIRECTORIES } = require("../../util/constants.js");

class VersionManager {
    constructor(serverJSON) {
        this.serverJSON = serverJSON;
        if (this.isForge()) {
            this.vanilaVersionManager = new VersionManager(this.getVanila());
        }
    }

    async downloadClient() {
        if (this.isForge()) {
            await this.vanilaVersionManager.downloadClient();
        }

        if (!this.doesClientExist()) {
            await Downloader.downloadAndSave(this.getJSONURL(), this.getJSONPath());
            await Downloader.downloadAndSave(this.getClientURL(), this.getClientPath());
        }

        await this.loadJSON();
    }

    async loadJSON() {
        this.jsonLoader = new JSONLoader(this.getJSONPath(), this.getType());
        await this.jsonLoader.load();
    }

    async downloadJava() {
        const javaComponent = this.getJavaVersion();
        if (!fs.existsSync(path.join(DIRECTORIES.LAUNCHER, "runtime/" + javaComponent))) {
            switch (javaComponent) {
                case "jre-legacy": {
                    let downloadUrl;
                    switch (process.platform) {
                        case "win32": {
                            downloadUrl = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u362-b09/OpenJDK8U-jre_x64_windows_hotspot_8u362b09.zip";
                            await Downloader.downloadAndSave(downloadUrl, path.join(DIRECTORIES.LAUNCHER, "runtime/" + downloadUrl.split('/').pop()));

                            fs.mkdirSync(path.join(DIRECTORIES.LAUNCHER, "runtime/" + javaComponent), { recursive: true });
                            await unzip(path.join(DIRECTORIES.LAUNCHER, "runtime/" + downloadUrl.split('/').pop()), { dir: path.join(DIRECTORIES.LAUNCHER, "runtime/" + javaComponent) });
                            break;
                        }
                        case "darwin": {
                            downloadUrl = "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u362-b09/OpenJDK8U-jre_x64_mac_hotspot_8u362b09.tar.gz";
                            await Downloader.downloadAndSave(downloadUrl, path.join(DIRECTORIES.LAUNCHER, "runtime/" + downloadUrl.split('/').pop()));

                            fs.mkdirSync(path.join(DIRECTORIES.LAUNCHER, "runtime/" + javaComponent), { recursive: true });
                            await tar.extract({ file: path.join(DIRECTORIES.LAUNCHER, "runtime/" + downloadUrl.split('/').pop()), cwd: path.join(DIRECTORIES.LAUNCHER, "runtime/" + javaComponent) });
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }

    async downloadLibraries(nativeDirectory) {
        if (this.vanilaVersionManager) {
            await this.vanilaVersionManager.downloadLibraries(nativeDirectory);
        }

        for (let library of this.getJSONLoader().getLibraries()) {
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

            if (!fs.existsSync(path.join(DIRECTORIES.MINECRAFT, "libraries/" + address))) {
                if (url) {
                    await Downloader.downloadAndSave(url, path.join(DIRECTORIES.MINECRAFT, "libraries/" + address));
                } else {
                    await Downloader.downloadAndSave(this.getPreClientURL(), path.join(DIRECTORIES.MINECRAFT, "libraries/" + address)); // urlが記載されてないのは現状ビルド前のforgeバージョン.jarだけのためとりあえずこの場合分けで
                }                
            }
        }
        
        // nativesファイルをnativeDirectoryに展開する
        if (!fs.existsSync(path.join(nativeDirectory, "META-INF"))) {
            fs.mkdirSync(nativeDirectory, { recursive: true });
            for (let library of this.getJSONLoader().getLibraries()) {
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
                    await unzip(`${path.join(DIRECTORIES.MINECRAFT, "libraries/" + address)}`, { dir: nativeDirectory });
                }
            }
        }
    }

    async downloadAssets() {
        if (this.isForge()) {
            this.vanilaVersionManager.downloadAssets();
        } else {
            if (!fs.existsSync(path.join(DIRECTORIES.MINECRAFT, `assets/indexes/${this.getJSONLoader().getAssetIndex().id}.json`))) {
                Downloader.downloadAndSave(this.getJSONLoader().getAssetIndex().url, path.join(DIRECTORIES.MINECRAFT, `assets/indexes/${this.getJSONLoader().getAssetIndex().id}.json`));
                const assetsJSON = await Downloader.downloadJSON(this.getJSONLoader().getAssetIndex().url);

                for (let name in assetsJSON.objects) {
                    const hashPath = assetsJSON.objects[name].hash.slice(0, 2) + "/" + assetsJSON.objects[name].hash;
                    await Downloader.downloadAndSave(`https://resources.download.minecraft.net/${hashPath}`, path.join(DIRECTORIES.MINECRAFT, `assets/objects/${hashPath}`));
                }
            }
        }
    }

    async donwloadFiles() {
        await this.downloadClient();
        await this.downloadJava();
        await this.downloadLibraries(this.getNativeDirectory());
        await this.downloadAssets();
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
            paths.push(path.join(DIRECTORIES.MINECRAFT, "libraries/" + address));
        }
        paths.push(this.getClientPath());

        return paths;
    }

    getType() {
        return this.serverJSON.type;
    }

    getVersion() {
        return this.serverJSON.version;
    }

    getJSONURL() {
        return this.serverJSON.jsonURL;
    }

    getClientURL() {
        return this.serverJSON.clientURL;
    }

    getPreClientURL() {
        if (this.isForge()) {
            return this.serverJSON.preClientURL;
        } else {
            return null;
        }
    }

    getVanila() {
        if (this.isForge()) {
            return this.serverJSON.vanila;
        } else {
            return null;
        }
    }

    getJSONPath() {
        return path.join(DIRECTORIES.MINECRAFT, "versions/" + this.getVersion() + "/" + this.getVersion() + ".json");
    }

    getClientPath() {
        return path.join(DIRECTORIES.MINECRAFT, "versions/" + this.getVersion() + "/" + this.getVersion() + ".jar");
    }

    getNativeDirectory() {
        return path.join(DIRECTORIES.LAUNCHER, "natives/" + this.getVersion());
    }

    getJavaVersion() {
        return (this.vanilaVersionManager) ? this.vanilaVersionManager.jsonLoader.getJavaVersion() : this.getJSONLoader().getJavaVersion();
    }

    getJavaPath(useOfficialJRE) {
        switch (this.getJavaVersion()) {
            case "jre-legacy": {
                switch (process.platform) {
                    case "win32": {
                        if (useOfficialJRE) {
                            return path.join(app.getPath("appData"), "../Local/Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/runtime/jre-legacy/windows-x64/jre-legacy/bin/javaw.exe");
                        } else {
                            return path.join(DIRECTORIES.LAUNCHER, "/runtime/jre-legacy/jdk8u362-b09-jre/bin/javaw.exe");
                        }
                    }
                    case "darwin": {
                        if (useOfficialJRE) {
                            return path.join(app.getPath("appData"), "minecraft/runtime/jre-legacy/mac-os/jre-legacy/jre.bundle/Contents/Home/bin/java");
                        } else {
                            return path.join(DIRECTORIES.LAUNCHER, "/runtime/jre-legacy/jdk8u362-b09-jre/Contents/Home/bin/java");
                        }
                    }
                }
                break;
            }
        }
    }

    getJSONLoader() {
        return this.jsonLoader;
    }

    isForge() {
        return this.getType() === "forge";
    }

    doesClientExist() {
        return fs.existsSync(this.getJSONPath()) && fs.existsSync(this.getClientPath());
    }
}

module.exports = VersionManager;