const axios = require("axios")
const path = require("path")
const fs = require("fs")

exports.donwloadJSON = async (url) => {
    const request = await axios.get(url)
    return request.data
}

exports.downloadAndSave = async (url, filePath) => {
    const request = await axios.get(url, { responseType: 'arraybuffer' })

    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
    }
    fs.writeFileSync(filePath.toString(), new Buffer.from(request.data), 'binary')
}