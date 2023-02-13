const welcomeDiv = document.getElementById("WelcomeMessage")
const runStatus = document.getElementById("runStatus")
const signOutButton = document.getElementById("signOut")
const runMinecraftButton = document.getElementById("runMinecraft")

window.renderer.showWelcomeMessage((event, userName) => {
    if (!userName) {
        return
    }
    welcomeDiv.innerHTML = `ログイン中: ${userName}`
})

window.renderer.showRunStatus((event, text) => {
    if (text) {
        runStatus.innerHTML = text
    }
})

signOutButton.addEventListener("click", () => {
    window.renderer.sendSignoutMessage()
})

runMinecraftButton.addEventListener("click", () => {
    window.renderer.sendRunMinecraftMessage()
})