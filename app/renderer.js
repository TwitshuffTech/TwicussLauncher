const welcomeDiv = document.getElementById("WelcomeMessage")
const signInButton = document.getElementById("signIn")
const signOutButton = document.getElementById("signOut")

window.renderer.showWelcomeMessage((event, account) => {
    if (!account) {
        return
    }

    welcomeDiv.innerHTML = `Welcome ${account.name}`
    signInButton.hidden = true
    signOutButton.hidden = false
})

signInButton.addEventListener("click", () => {
    window.renderer.sendLoginMessage()
})

signOutButton.addEventListener("click", () => {
    window.renderer.sendSignoutMessage()
})