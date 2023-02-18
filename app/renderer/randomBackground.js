const background = document.getElementById("Background")

images = []

images[0] = "../resources/background/01.png"
images[1] = "../resources/background/02.png"
images[2] = "../resources/background/03.png"
images[3] = "../resources/background/04.png"
images[4] = "../resources/background/05.png"

let n = Math.floor(Math.random() * images.length)
background.style.backgroundImage = `url(${images[n]})`