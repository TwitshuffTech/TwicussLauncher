const { LogLevel } = require("@azure/msal-node")

const AAD_ENDPOINT_HOST = "https://login.microsoftonline.com/"

const msalConfig = {
    auth: {
        clientId: "68951ffd-e315-4b5d-97f8-bef191538b44",
        authority: `${AAD_ENDPOINT_HOST}consumers`,
    },
    system: {
        loggerOptions: { 
            loggerCallback(loglevel, message, containsPii) {
                console.log(message)
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        },
    },
}

module.exports = {
    msalConfig: msalConfig,
}