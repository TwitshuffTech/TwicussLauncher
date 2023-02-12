const { net } = require("electron")

class MinecraftAuthProvider {
    
    constructor(microsoftAccessToken) {
        console.log("MinecraftAuth instance constructed")
        this.authXboxLive(microsoftAccessToken)
    }

    authXboxLive(microsoftAccessToken) {
        const request = net.request({
            method: "POST",
            url: "https://user.auth.xboxlive.com/user/authenticate",
            protocol: "https:",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        })
        const body = JSON.stringify({
            "Properties": {
                "AuthMethod": "RPS",
                "SiteName": "user.auth.xboxlive.com",
                "RpsTicket": `d=${microsoftAccessToken}`,
            },
            "RelyingParty": "http://auth.xboxlive.com",
            "TokenType": "JWT",
        })
        request.write(body)

        request.on("response", (response) => {
            console.log(`STATUS: ${response.statusCode}`)
            console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
            response.on("data", (chunk) => {
                console.log(`BODY: ${chunk}`)
            })
        })

        request.end()
        console.log("request transferred")
    }
}

module.exports = MinecraftAuthProvider