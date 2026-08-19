const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '../cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

module.exports = async function streamHandler(req, res) {
    try {
        const fcdnId = req.params.id;
        const filePath = path.join(cacheDir, fcdnId);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found or expired"
            });
        }

        const stat = fs.statSync(filePath);
        const ext = path.extname(filePath);
        let contentType = 'application/octet-stream';

        if (ext === '.mp4') contentType = 'video/mp4';
        else if (ext === '.mp3') contentType = 'audio/mpeg';
        else if (ext === '.mp4') contentType = 'video/mp4';
        else if (ext === '.webm') contentType = 'video/webm';
        else if (ext === '.mkv') contentType = 'video/x-matroska';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);

        stream.on('end', () => {
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to stream file"
        });
    }
};

module.exports.downloadAndCache = async function(fcdnId, url) {
    const filePath = path.join(cacheDir, fcdnId);
    
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
            },
            timeout: 120000
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Failed to download: ${error.message}`);
    }
};
