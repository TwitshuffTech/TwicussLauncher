const playerName = document.getElementById("PlayerName")
const runStatus = document.getElementById("RunStatus")
const skinViewer = document.getElementById("SkinViewer")
const serverStatus = document.getElementById("ServerStatus")
const serverName = document.getElementById("ServerName")
const serverIcon = document.getElementById("ServerIcon")
const serverPlayers = document.getElementById("ServerPlayers")
const overlay = document.getElementById("Overlay")
const signOutButton = document.getElementById("signOut")
const runMinecraftButton = document.getElementById("runMinecraft")

window.renderer.showPlayerName((event, userName) => {
    if (userName) {
        playerName.innerHTML = userName
        playerName.style.fontSize = "16px"
    }
})

window.renderer.showRunStatus((event, text) => {
    overlay.style.display = "flex"
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
})