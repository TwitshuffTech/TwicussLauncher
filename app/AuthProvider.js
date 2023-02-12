const { PublicClientApplication, CryptoProvider } = require("@azure/msal-node")
const { app, shell } = require("electron")
const fs = require("fs")
const path = require("path")

const CACHE_PATH = path.join(app.getPath("userData"), "Cache/microsoft.json")

class AuthProvider {
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
        let accounts = this.cache.getAllAccounts()

        let response

        if (accounts.length > 0) {
            const silentRequest = {
                account: accounts[0],
                scopes: [],
            }

            try {
                response = await this.clientApplication.acquireTokenSilent(silentRequest)
                console.log("\nSuccessful silent token acquisition")
                console.log("\nResponse: \n", response)
            } catch (error) {
                console.log(error)
            }
        } else {
            const interactiveRequest = {
                scopes: [],
            }

            try {
                const openBrowser = async (url) => {
                    await shell.openExternal(url)
                }

                response = await this.clientApplication.acquireTokenInteractive({
                    ...interactiveRequest,
                    openBrowser,
                    successTemplete: "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
                    errorTemplate: "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
                })
                console.log("\nSuccessful interactive token acquisition")
                console.log("\nResponse: \n", response)
            } catch (error) {
                console.log(error)
            }
        }

        return response.account
    }

    async getAccount() {
        let accounts = this.cache.getAllAccounts()
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log(this.cache)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

        if (accounts.length > 0) {
            const silentRequest = {
                account: accounts[0],
                scopes: [],
            }

            try {
                response = await this.clientApplication.acquireTokenSilent(silentRequest)
                console.log("\nSuccessful silent token acquisition")
                console.log("\nResponse: \n", response)

                return response.account
            } catch (error) {
                console.log(error)
            }
        } else {
            return null
        }
    }
}

module.exports = AuthProvider