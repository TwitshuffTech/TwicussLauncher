const welcomeDiv = document.getElementById("WelcomeMessage")
const signOutButton = document.getElementById("signOut")
const runMinecraftButton = document.getElementById("runMinecraft")

window.renderer.showWelcomeMessage((event, account) => {
    if (!account) {
        return
    }
    welcomeDiv.innerHTML = `Welcome ${account.name}`
})

signOutButton.addEventListener("click", () => {
    window.renderer.sendSignoutMessage()
})

runMinecraftButton.addEventListener("click", () => {
    window.renderer.sendRunMinecraftMessage()
})