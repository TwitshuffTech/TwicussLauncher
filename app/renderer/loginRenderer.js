const signInButton = document.getElementById("signIn")

signInButton.addEventListener("click", () => {
    window.renderer.sendLoginMessage()
})