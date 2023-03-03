const axios = require("axios");
const path = require("path");
const fs = require("fs");

exports.downloadJSON = async (url) => {
    const response = await axios.get(url);
    // const serverData = await axios.get("https://mcapi.us/server/status?ip=twicusstumble.ddns.net")
    // console.log(serverData.data)
    return response.data;
}

exports.downloadAndSave = async (url, filePath) => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath.toString(), new Buffer.from(response.data), 'binary');
}