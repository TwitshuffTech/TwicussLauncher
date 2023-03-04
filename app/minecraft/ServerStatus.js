const axios = require("axios");

class ServerStatus {
    constructor() {}

    async updateServerData() {
        const response = await axios.get("https://mcapi.us/server/status?ip=twicusstumble.ddns.net");
        this.serverData = JSON.parse(JSON.stringify(response.data));
    }

    isActive() {
        if (this.serverData.status === "success") {
            return true;
        } else {
            return false;
        }
    }

    getServerName() {
        return this.serverData.motd;
    }

    getIcon() {
        return this.serverData.favicon;
    }

    getNumberOfPlayers() {
        return {
            max: this.serverData.players.max,
            now: this.serverData.players.now
        };
    }

    async getServerStatus() {
        await this.updateServerData();
        return {
            isActive: this.isActive(),
            name: this.getServerName(),
            icon: this.getIcon(),
            players: this.getNumberOfPlayers()
        };
    }
}

module.exports = ServerStatus;