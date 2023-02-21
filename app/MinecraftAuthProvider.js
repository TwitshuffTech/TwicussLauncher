const axios = require("axios")

class MinecraftAuthProvider {
    microsoftAccessToken
    xboxLiveToken
    minecraftToken
    userHash
    minecraftAuthToken
    uuid
    userName
    
    constructor() {

    }

    // XboxLiveトークン（XBL Token）の取得
    async getXBLToken() {
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
        const response = await axios.post("https://user.auth.xboxlive.com/user/authenticate", data, config)
        this.xboxLiveToken = response.data.Token
    }

    // XboxLiveのゲームトークン（XSTS Token）の取得
    async getXSTSToken() {
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
        const response = await axios.post("https://xsts.auth.xboxlive.com/xsts/authorize", data, config)
        this.minecraftToken = response.data.Token
        this.userHash = response.data.DisplayClaims.xui[0].uhs
    }


    // Minecraftトークン（Minecraft Access Token）の取得
    async getMinecraftToken() {
        const data = {
            "identityToken": `XBL3.0 x=${this.userHash};${this.minecraftToken}`,
        }
        const response = await axios.post("https://api.minecraftservices.com/authentication/login_with_xbox", data)
        this.minecraftAuthToken = response.data.access_token
    }

    async checkGameOwnership() {
        const config = {
            headers: {
                "Authorization": `Bearer ${this.minecraftAuthToken}`,
            }
        }
        const response = await axios.get("https://api.minecraftservices.com/entitlements/mcstore", config)
        return response.data.items.length // MicrosoftアカウントにMinecraftを所有していない場合、0を返す
    }

    async getMinecraftProfile() {
        if (await this.checkGameOwnership()) {
            const config = {
                headers: {
                    "Authorization": `Bearer ${this.minecraftAuthToken}`,
                }
            }
            const response = await axios.get("https://api.minecraftservices.com/minecraft/profile", config)
            this.uuid = response.data.id
            this.userName = response.data.name
        }
    }

    async authMinecraft(microsoftAccessToken) {
        this.microsoftAccessToken = microsoftAccessToken
        await this.getXBLToken()
        await this.getXSTSToken()
        await this.getMinecraftToken()
        await this.getMinecraftProfile()
    }

    async get3DSkinImage() {
        const config = {
            responseType: "arraybuffer",
            params: {
                scale: 3,
                default: "MHF_Steve",
                overlay: "true",
            }
        }
        const response = await axios.get(`https://crafatar.com/renders/body/${this.uuid}`, config)
        return Buffer.from(response.data, 'binary').toString("base64")
    }
}

module.exports = MinecraftAuthProvider