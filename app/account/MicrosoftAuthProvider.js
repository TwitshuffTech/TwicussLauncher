const { PublicClientApplication, CryptoProvider } = require("@azure/msal-node")
const { app } = require("electron")
const fs = require("fs")
const path = require("path")

const CACHE_PATH = path.join(app.getPath("appData"), ".twicusslauncher/cache")
const CACHE_FILE = "msal_cache.json"

const REDIRECT_URI = "https://login.microsoftonline.com/common/oauth2/nativeclient"
const SCOPE = ["XboxLive.SignIn"] // MicrosoftトークンからXboxLiveトークンを交換するときにこれがないとエラーが出る

class MicrosoftAuthProvider {
    constructor(msalConfig) {
        this.clientApplication = new PublicClientApplication(msalConfig);
        this.cryptoProvider = new CryptoProvider();
    }

    async autoLogin() {
        if (!this.cache) {
            await this.loadCacheFile();
        }
        const accounts = await this.cache.getAllAccounts();
        if (accounts[0]) {
            return await this.getTokenSilent(accounts[0]);
        } else {
            return null;
        }
    }

    async logout() {
        const accounts = await this.cache.getAllAccounts();
        await this.cache.removeAccount(accounts[0]);
        this.saveCacheFile();
    }

    async getAuthCodeUrl() {
        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();
        this.verifier = verifier;
        this.challenge = challenge;

        const params = {
            scopes: SCOPE,
            redirectUri: REDIRECT_URI,
            prompt: "select_account",
            codeChallenge: this.challenge,
            codeChallengeMethod: "S256"
        };

        return await this.clientApplication.getAuthCodeUrl(params);
    }

    async exchangeToken(authorizationCode) {
        const request = {
            code: authorizationCode,
            codeVerifier: this.verifier,
            redirectUri: REDIRECT_URI,
            scopes: SCOPE
        };

        const response = await this.clientApplication.acquireTokenByCode(request);
        this.saveCacheFile();
        return response.accessToken;
    }

    async getTokenSilent(account) {
        const request = {
            account: account,
            scopes: SCOPE
        };
        const response = await this.clientApplication.acquireTokenSilent(request);
        return response.accessToken;
    }

    async loadCacheFile() {
        this.cache = this.clientApplication.getTokenCache();
        if (fs.existsSync(path.join(CACHE_PATH, CACHE_FILE))) {
            this.cache.deserialize(await fs.readFileSync(path.join(CACHE_PATH, CACHE_FILE), "utf-8"));
            console.log("loaded login cache file");
        }
    }

    async saveCacheFile() {
        if (this.cache.hasChanged) {
            if (!fs.existsSync(CACHE_PATH)) {
                fs.mkdirSync(CACHE_PATH.toString(), { recursive: true });
            }
            await fs.writeFileSync(path.join(CACHE_PATH, CACHE_FILE), this.cache.serialize());
            console.log("saved login cache file");
        }
    }
}

module.exports = MicrosoftAuthProvider;