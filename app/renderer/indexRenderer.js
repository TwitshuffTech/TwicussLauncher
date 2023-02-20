const mainPage = document.getElementById("mainPage")
const playerName = document.getElementById("playerName")
const runStatus = document.getElementById("runStatus")
const skinViewer = document.getElementById("skinViewer")
const serverStatus = document.getElementById("serverStatus")
const serverName = document.getElementById("serverName")
const serverIcon = document.getElementById("serverIcon")
const serverPlayers = document.getElementById("serverPlayers")
const overlay = document.getElementById("overlay")
const signOutButton = document.getElementById("signOutButton")
const runMinecraftButton = document.getElementById("playButton")

window.renderer.showPlayerName((event, userName) => {
    if (userName) {
        playerName.innerHTML = userName
        playerName.style.fontSize = "16px"
    }
})

window.renderer.showSkinViewer((event, skinImage) => {
    if (skinImage) {
        skinViewer.src = `data:image/png;base64,${skinImage}`
    }
})

window.renderer.showServerStatus((event, status) => {
    if (status) {
        if (status["isActive"] == true) {
            serverStatus.style.backgroundColor = "greenyellow"
        } else {
            serverStatus.style.backgroundColor = "orengered"
        }

        serverName.innerHTML = status["name"]

        serverIcon.src = status["icon"]

        serverPlayers.innerHTML = `${status["players"]["now"]}/${status["players"]["max"]}`
        if (status["players"]["now"] === 0) {
            serverPlayers.style.color = "rgba(120, 120, 120, 0.8)"
        }
        serverPlayers.style.margin = "0 0 0 20px";
    }
})

signOutButton.addEventListener("click", () => {
    window.renderer.sendSignoutMessage()
})

runMinecraftButton.addEventListener("click", () => {
    window.renderer.sendRunMinecraftMessage()

    mainPage.style.filter = "blur(3px)"
    overlay.style.opacity = "1"
    overlay.style.pointerEvents = "auto"
})