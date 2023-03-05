const mainPage = document.getElementById("mainPage");
const landing = document.getElementById("landing");
const settingsPage = document.getElementById("settingsPage");

const playerName = document.getElementById("playerName");
const runStatus = document.getElementById("runStatus");
const skinViewer = document.getElementById("skinViewer");
const serverStatus = document.getElementById("serverStatus");
const serverName = document.getElementById("serverName");
const serverIcon = document.getElementById("serverIcon");
const serverPlayers = document.getElementById("serverPlayers");
const overlay = document.getElementById("overlay");

const signOutButton = document.getElementById("signOutButton");
const runMinecraftButton = document.getElementById("playButton");
const settingsButton = document.getElementById("settingsButton");

const settingsButtons = document.getElementsByName("settingsButtons");
const modsSettingsButton = document.getElementById("mods");
const settingPages = document.getElementsByClassName("setting-page");
const closeSettingsButton = document.getElementById("closeSettingsButton");

const playerNameSettings = document.getElementById("playerNameSettings");

const gameDirectory = document.getElementById("gameDirectory");
const gameDirectoryButton = document.getElementById("gameDirectoryButton");

const modList = document.getElementById("modList");

const useOfficialJRE = document.getElementById("useOfficialJRE");
const runMinecraftDirectly = document.getElementById("runMinecraftDirectly");

window.addEventListener("DOMContentLoaded", () => {
    if (JSON.parse(localStorage.getItem("useOfficialJRE"))) {
        useOfficialJRE.checked = JSON.parse(localStorage.getItem("useOfficialJRE"));
        window.renderer.sendIfUseOfficialJRE(true);
    }
});

window.renderer.showPlayerName((event, userName) => {
    if (userName) {
        playerName.innerHTML = userName;
        playerName.style.fontSize = "16px";

        playerNameSettings.innerHTML = userName;
    }
});

window.renderer.showSkinViewer((event, skinImage) => {
    if (skinImage) {
        skinViewer.src = `data:image/png;base64,${skinImage}`;
    }
});

window.renderer.showServerStatus((event, status) => {
    if (status) {
        if (status["isActive"] == true) {
            serverStatus.style.backgroundColor = "greenyellow";
        } else {
            serverStatus.style.backgroundColor = "orengered";
        }

        serverName.innerHTML = status["name"];

        serverIcon.src = status["icon"];

        serverPlayers.innerHTML = `${status["players"]["now"]}/${status["players"]["max"]}`;
        if (status["players"]["now"] === 0) {
            serverPlayers.style.color = "rgba(120, 120, 120, 0.8)";
        }
        serverPlayers.style.margin = "0 0 0 20px";
    }
});

window.renderer.showInstalledMods((event, mods) => {
    let html = "";
    for (let mod of mods) {
        html += `<div class="mod">`
        switch (mod.type) {
            case "REQUIRED":
                html += `<p class="required">${mod.name}</p>`;
                break;
            case "LEGACY":
                html += `<p class="legacy">${mod.name}</p>`;
                break;
            default:
                html += `<p>${mod.name}</p>`;
                break;
        }
        html += `<button type="button" class="delete-button">DELETE</button></div>`;
    }
    modList.innerHTML = html;

    const deleteButtons = document.getElementsByClassName("delete-button");

    for (let i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener("click", () => {
            let name = deleteButtons[i].parentElement.getElementsByTagName("p")[0].textContent;
            window.renderer.sendDeletingMod(name);
        })
    }
})

window.renderer.showGameDirectory((event, path) => {
    gameDirectory.innerHTML = path
})

signOutButton.addEventListener("click", () => {
    window.renderer.sendSignoutMessage();
});

runMinecraftButton.addEventListener("click", () => {
    window.renderer.sendRunMinecraftMessage();

    mainPage.style.filter = "blur(3px)";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
});

settingsButton.addEventListener("click", () => {
    landing.style.transitionDuration = "0";
    landing.style.pointerEvents = "none";
    landing.style.opacity = "0";

    settingsPage.style.transitionDuration = "0.3s";
    settingsPage.style.pointerEvents = "auto";
    settingsPage.style.opacity = "1";

    settingsButtons[0].checked = true;
    settingPages[0].style.transitionDuration = "0.3s";
    settingPages[0].style.pointerEvents = "auto";
    settingPages[0].style.opacity = "1";

    window.renderer.sendReloadingDirectories();
});

for (let i = 0; i < settingsButtons.length; i++) {
    settingsButtons[i].addEventListener("click", () => {
        for (let j = 0; j < settingPages.length; j++) {
            settingPages[j].style.transitionDuration = "0";
            settingPages[j].style.pointerEvents = "none";
            settingPages[j].style.opacity = "0";
        }
        const page = document.getElementById(`${settingsButtons[i].value}Page`);
        page.style.transitionDuration = "0.3s";
        page.style.pointerEvents = "auto";
        page.style.opacity = "1";
    });
}

modsSettingsButton.addEventListener("click", () => {
    window.renderer.sendReloadingMods();
});

closeSettingsButton.addEventListener("click", () => {
    for (let j = 0; j < settingPages.length; j++) {
        settingPages[j].style.transitionDuration = "0";
        settingPages[j].style.pointerEvents = "none";
        settingPages[j].style.opacity = "0";
    }
    
    settingsPage.style.transitionDuration = "0";
    settingsPage.style.pointerEvents = "none";
    settingsPage.style.opacity = "0";

    landing.style.transitionDuration = "0.3s";
    landing.style.pointerEvents = "auto";
    landing.style.opacity = "1";
});

gameDirectoryButton.addEventListener("click", () => {
    window.renderer.sendUpdateGameDirectory();
});

useOfficialJRE.addEventListener("change", () => {
    if (useOfficialJRE.checked) {
        window.renderer.sendIfUseOfficialJRE(true);
        localStorage.setItem("useOfficialJRE", JSON.stringify(useOfficialJRE.checked));
    } else {
        window.renderer.sendIfUseOfficialJRE(false);
        localStorage.setItem("useOfficialJRE", JSON.stringify(useOfficialJRE.checked));
    }
});