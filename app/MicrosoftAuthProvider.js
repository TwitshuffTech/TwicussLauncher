const { PublicClientApplication, CryptoProvider } = require("@azure/msal-node")
const { app, shell } = require("electron")
const fs = require("fs")
const path = require("path")

const CACHE_PATH = path.join(app.getPath("appData"), ".twicusslauncher/cache")
const CACHE_FILE = "microsoft.json"
const SCOPE = ["XboxLive.SignIn"] // MicrosoftトークンからXboxLiveトークンを交換するときにこれがないとエラーが出る

class MicrosoftAuthProvider {
    msalConfig
    clientApplication
    cryptoProvider
    account
    cache

    constructor(msalConfig) {
        this.msalConfig = msalConfig
        this.clientApplication = new PublicClientApplication(this.msalConfig)
        this.cryptoProvider = new CryptoProvider()
    }

    // キャッシュファイルからMicrosoftアカウント情報を読み込む
    async initializeCache() {
        this.cache = this.clientApplication.getTokenCache()

        await this.loadCacheFile()
        const accounts = await this.cache.getAllAccounts()
        
        if (accounts) {
            this.account = accounts[0]
        } else {
            this.account = null
        }
    }

    async login() {
        // if (!this.cache) {
        //     await this.initializeCache()
        // }

        // let response = await this.getTokenSilent()

        // if (response) {
        //     return response
        // } else {
        //     response = await this.getTokenInteractive()
        //     this.saveCacheFile()
        //     this.account = response.account
        //     return response
        // }
        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes()

        const authCodeUrlParams = {
            scopes: SCOPE,
            redirectUri: "https://login.microsoftonline.com/common/oauth2/nativeclient",
            codeChallenge: challenge,
            codeChallengeMethod: "S256"
        }

        const response = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams)
        console.log(response)

        const tokenRequest = {
            code: "M.R3_BAY.a25e53b8-9595-7bad-efb3-15e3dee9ef49",
            codeVerifier: verifier,
            redirectUri: "https://login.microsoftonline.com/common/oauth2/nativeclient",
            scopes: SCOPE
        }

        const tokenResponse = await this.clientApplication.acquireTokenByCode(tokenRequest)
        console.log("\nResponse: \n:", tokenResponse)
    }

    async logout() {
        if (!this.account) {
            return
        }

        try {
            await this.cache.removeAccount(this.account)
            this.saveCacheFile()
            this.account = null
        } catch (error) {
            console.log(error)
        }
    }

    // （メモリ上の）キャッシュのアカウント情報からクライアントの操作なしにMicrosoftトークンを得る
    async getTokenSilent() {
        if (!this.cache) {
            await this.initializeCache()
        }
        
        try {
            if (!this.account) {
                return null
            }
            const silentRequest = {
                account: this.account,
                scopes: SCOPE,
            }
            const response = await this.clientApplication.acquireTokenSilent(silentRequest)
            console.log("\nSuccessful silent token acquisition")

            return response
        } catch (error) {
            console.log(error)
        }
    }

    async getTokenInteractive() {
        try {
            const interactiveRequest = {
                scopes: SCOPE,
            }
            const openBrowser = async (url) => {
                await shell.openExternal(url)
            }

            const response = await this.clientApplication.acquireTokenInteractive({
                ...interactiveRequest,
                openBrowser,
                successTemplete: "<p>サインインが完了しました。このウィンドウを閉じてください。</p>", // なぜかうまく表示されない
                errorTemplate: "<p>サインインに失敗しました。</p>",
            })
            console.log("\nSuccessful interactive token acquisition")

            return response
        } catch (error) {
            console.log(error)
        }
    }

    async loadCacheFile() {
        if (fs.existsSync(path.join(CACHE_PATH, CACHE_FILE))) {
            this.cache.deserialize(await fs.readFileSync(path.join(CACHE_PATH, CACHE_FILE), "utf-8"))
            console.log("loaded login cache file")
        }
    }

    async saveCacheFile() {
        if (this.cache.hasChanged) {
            if (!fs.existsSync(CACHE_PATH)) {
                fs.mkdirSync(CACHE_PATH.toString(), { recursive: true })
            }
            await fs.writeFileSync(path.join(CACHE_PATH, CACHE_FILE), this.cache.serialize())
        }
    }
}

module.exports = MicrosoftAuthProvider