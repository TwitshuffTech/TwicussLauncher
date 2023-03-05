const signInButton = document.getElementById("signInButton");

signInButton.addEventListener("click", () => {
    window.renderer.sendLoginMessage();
})