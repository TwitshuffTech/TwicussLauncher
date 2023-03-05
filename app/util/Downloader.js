const axios = require("axios");
const path = require("path");
const fs = require("fs");

class Downloader {
    static async downloadJSON(url) {
        const response = await axios.get(url);
        return response.data;
    }
    
    static async downloadAndSave(url, filePath) {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
    
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        fs.writeFileSync(filePath.toString(), new Buffer.from(response.data), 'binary');
    }
}

module.exports = Downloader;