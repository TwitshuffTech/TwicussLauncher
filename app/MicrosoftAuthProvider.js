const { PublicClientApplication, CryptoProvider } = require("@azure/msal-node")
const { app, shell } = require("electron")
const fs = require("fs")
const path = require("path")

const CACHE_PATH = path.join(app.getPath("appData"), ".twicusslauncher/cache")
const CACHE_FILE = "microsoft.json"
const SCOPE = ["XboxLive.SignIn"]

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
        this.cache = this.clientApplication.getTokenCache()
        this.account = null
    }

    async login() {
        let response = await this.getTokenFromCache()
        if (response) {
            return response
        } else {
            const interactiveRequest = {
                scopes: SCOPE,
            }

            response = await this.getTokenInteractive(interactiveRequest)
            this.saveCacheFile()
            this.account = response.account
            return response
        }
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

    async getTokenFromCache() {
        await this.loadCacheFile()
        const accounts = await this.cache.getAllAccounts()

        if (accounts.length > 0) {
            const silentRequest = {
                account: accounts[0],
                scopes: SCOPE,
            }

            const response = await this.getTokenSilent(silentRequest)
            this.saveCacheFile()
            this.account = response.account
            return response
        } else {
            return null
        }
    }

    async getTokenSilent(request) {
        try {
            const response = await this.clientApplication.acquireTokenSilent(request)
            console.log("\nSuccessful silent token acquisition")
            console.log("\nResponse: \n", response)

            return response
        } catch (error) {
            console.log(error)
        }
    }

    async getTokenInteractive(request) {
        try {
            const openBrowser = async (url) => {
                await shell.openExternal(url)
            }

            const response = await this.clientApplication.acquireTokenInteractive({
                ...request,
                openBrowser,
                successTemplete: "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
                errorTemplate: "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
            })
            console.log("\nSuccessful interactive token acquisition")
            console.log("\nResponse: \n", response)

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