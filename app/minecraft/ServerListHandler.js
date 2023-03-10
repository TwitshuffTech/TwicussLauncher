const { app } = require("electron");
const path = require("path");
const fs = require("fs");

const Downloader = require("../util/Downloader.js");
const Server = require("./EnumServer.js");

const { DIRECTORIES } = require("../util/constants.js");

class ServerListHandler {
    constructor(server) {
        this.server = server;
    }

    async loadServerJSON() {
        // server.jsonについて
        // {
        //     "type": "minecraft" or "forge",
        //     "version": "{バージョン（バージョン.jsonのid）}",
        //     "jsonURL": "{バージョン.jsonのづアンロードURL}",
        //     "clientURL": "{バージョン.jarのダウンロードURL}",
        //     "preClientURL": "{ビルド前のforgeバージョン.jarのダウンロードURL（typeがforgeの場合のみ}",
        //     "vanila": { 再帰的にVersionHandlerに渡す引数（typeがforgeの場合のみ）
        //         "type": "minecraft",
        //         "version": "{バニラのバージョン}",
        //         "jsonURL": "{バニラバージョン.jsonのダウンロードURL}",
        //         "clientURL": "{バニラバージョン.jarのダウンロードURL}"
        //     },
        //     "servers.dat": "{ゲームディレクトリに加えるservers.datのダウンロードURL}",
        //     "mods": [
        //         {
        //             "name": "{modのファイル名（拡張子込み）}",
        //             "url": "{modのダウンロードURL}",
        //         },
        //         {

        //         },
        //         ...
        //     ],
        //     "icon": "{server_profilesに加える画像データ（Base64 encoded）}"
        // }
        let jsonUrl;
        switch (this.server) {
            case Server["1.12.2-forge-14.23.5.2859"]:
                jsonUrl = "http://twicusstumble.ddns.net/mods/twicuss1.12.2.json"
                break;
        }
        this.serverJSON = await Downloader.downloadJSON(jsonUrl);

        return this.serverJSON;
    }

    downloadServersDat(gameDirectory) {
        if (!fs.existsSync(path.join(gameDirectory, "servers.dat"))) {
            Downloader.downloadAndSave(this.getServersDat(), path.join(gameDirectory, "servers.dat"));
        }
    }

    addLaunchProfile() {
        const propertiesJSON = JSON.parse(fs.readFileSync(path.join(DIRECTORIES.MINECRAFT, "launcher_profiles.json")));
        const profileName = this.getName();
        if (!(profileName in Object.keys(propertiesJSON.profiles))) {
            propertiesJSON.profiles[`${profileName}`] = {
                "name": profileName,
                "type": "custom",
                "lastVersionId": this.getVersion(),
                "gameDir": path.join(DIRECTORIES.LAUNCHER, this.getVersion()),
                "icon": this.getIcon()
            };
            fs.writeFileSync(path.join(DIRECTORIES.MINECRAFT, "launcher_profiles.json"), JSON.stringify(propertiesJSON));
        }
    }

    getName() {
        return this.serverJSON.name;
    }

    getVersion() {
        return this.serverJSON.version;
    }

    getServersDat() {
        return this.serverJSON.servers_dat;
    }

    getModList() {
        return this.serverJSON.mods;
    }

    getLegacyModList() {
        return this.serverJSON.legacy_mods;
    }

    getIcon() {
        return this.serverJSON.icon;
    }
}

module.exports = ServerListHandler;