const VERSIONS = {
    MINECRAFT1_12_2: { 
        type: "minecraft",
        version: "1.12.2",
        jsonURL: "https://launchermeta.mojang.com/v1/packages/cfd75871c03119093d7c96a6a99f21137d00c855/1.12.2.json",
        clientURL: "https://launcher.mojang.com/v1/objects/0f275bc1547d01fa5f56ba34bdc87d981ee12daf/client.jar",
    },
    FORGE1_12_2: {
        type: "forge",
        version: "1.12.2-forge-14.23.5.2859",
        vanila: {
            type: "minecraft",
            version: "1.12.2",
            jsonURL: "https://launchermeta.mojang.com/v1/packages/cfd75871c03119093d7c96a6a99f21137d00c855/1.12.2.json",
            clientURL: "https://launcher.mojang.com/v1/objects/0f275bc1547d01fa5f56ba34bdc87d981ee12daf/client.jar",
        }
    },
}

module.exports = {
    VERSIONS: VERSIONS
}