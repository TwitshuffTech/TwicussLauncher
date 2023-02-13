const { net } = require("electron")
const axios = require("axios")

class MinecraftAuthProvider {
    microsoftAccessToken
    xboxLiveToken
    minecraftToken
    userHash
    minecraftAuthToken
    uuid
    userName
    
    constructor(microsoftAccessToken) {
        console.log("MinecraftAuth instance constructed")
        this.microsoftAccessToken = microsoftAccessToken
    }

    async getXboxLiveToken() {
        const config = {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        }
        const data = {
            "Properties": {
                "AuthMethod": "RPS",
                "SiteName": "user.auth.xboxlive.com",
                "RpsTicket": `d=${this.microsoftAccessToken}`,
            },
            "RelyingParty": "http://auth.xboxlive.com",
            "TokenType": "JWT",
        }
        const request = await axios.post("https://user.auth.xboxlive.com/user/authenticate", data, config)
        this.xboxLiveToken = request.data.Token
    }

    async getMinecraftToken() {
        const config = {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        }
        const data = {
            "Properties": {
                "SandboxId": "RETAIL",
                "UserTokens": [
                    this.xboxLiveToken
                ],
            },
            "RelyingParty": "rp://api.minecraftservices.com/",
            "TokenType": "JWT",
        }
        const request = await axios.post("https://xsts.auth.xboxlive.com/xsts/authorize", data, config)
        this.minecraftToken = request.data.Token
        this.userHash = request.data.DisplayClaims.xui[0].uhs
    }

    async authMinecraft() {
        const data = {
            "identityToken": `XBL3.0 x=${this.userHash};${this.minecraftToken}`,
        }
        const request = await axios.post("https://api.minecraftservices.com/authentication/login_with_xbox", data)
        this.minecraftAuthToken = request.data.access_token
        console.log(`Minecraft Token: ${this.minecraftAuthToken}`)
    }

    async checkGameOwnership() {
        const config = {
            headers: {
                "Authorization": `Bearer ${this.minecraftAuthToken}`,
            }
        }
        const request = await axios.get("https://api.minecraftservices.com/entitlements/mcstore", config)
        return request.data.items.length
    }

    async getProfile() {
        if (this.checkGameOwnership()) {
            const config = {
                headers: {
                    "Authorization": `Bearer ${this.minecraftAuthToken}`,
                }
            }
            const request = await axios.get("https://api.minecraftservices.com/minecraft/profile", config)
            this.uuid = request.data.id
            this.userName = request.data.name
        }
    }
}

module.exports = MinecraftAuthProvider