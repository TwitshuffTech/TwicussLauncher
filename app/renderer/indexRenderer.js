const mainPage = document.getElementById("mainPage")
const landing = document.getElementById("landing")
const settingsPage = document.getElementById("settingsPage")

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
const settingsButton = document.getElementById("settingsButton")

const settingsButtons = document.getElementsByName("settingsButtons")
const settingPages = document.getElementsByClassName("setting-page")
const closeSettingsButton = document.getElementById("closeSettingsButton")

const playerNameSettings = document.getElementById("playerNameSettings")

const useOfficialJRE = document.getElementById("useOfficialJRE")
const runMinecraftDirectly = document.getElementById("runMinecraftDirectly")

window.renderer.showPlayerName((event, userName) => {
    if (userName) {
        playerName.innerHTML = userName
        playerName.style.fontSize = "16px"

        playerNameSettings.innerHTML = userName
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

settingsButton.addEventListener("click", () => {
    landing.style.transitionDuration = "0"
    landing.style.pointerEvents = "none"
    landing.style.opacity = "0"

    settingsPage.style.transitionDuration = "0.3s"
    settingsPage.style.pointerEvents = "auto"
    settingsPage.style.opacity = "1"
})

for (let i = 0; i < settingsButtons.length; i++) {
    settingsButtons[i].addEventListener("click", () => {
        for (let j = 0; j < settingPages.length; j++) {
            settingPages[j].style.transitionDuration = "0"
            settingPages[j].style.pointerEvents = "none"
            settingPages[j].style.opacity = "0"
        }
        const page = document.getElementById(`${settingsButtons[i].value}Page`)
        page.style.transitionDuration = "0.3s"
        page.style.pointerEvents = "auto"
        page.style.opacity = "1"
    })
}

closeSettingsButton.addEventListener("click", () => {
    settingsPage.style.transitionDuration = "0"
    settingsPage.style.pointerEvents = "none"
    settingsPage.style.opacity = "0"

    landing.style.transitionDuration = "0.3s"
    landing.style.pointerEvents = "auto"
    landing.style.opacity = "1"
})

useOfficialJRE.addEventListener("change", () => {
    if (useOfficialJRE.checked) {
        window.renderer.sendIfUseOfficialJRE(true)
    } else {
        runMinecraftDirectly.checked = false;
        window.renderer.sendIfRunMinecraftDirectly(false)
        window.renderer.sendIfUseOfficialJRE(false)
    }
})

runMinecraftDirectly.addEventListener("change", () => {
    if (runMinecraftDirectly.checked) {
        useOfficialJRE.checked = true;
        window.renderer.sendIfUseOfficialJRE(true)
        window.renderer.sendIfRunMinecraftDirectly(true)
    } else {
        window.renderer.sendIfRunMinecraftDirectly(false)
    }
})