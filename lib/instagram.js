const axios = require('axios');

module.exports = async function getInstagramVideo(videoUrl) {
    try {
        const config = {
            method: 'post',
            url: 'https://bff.listnr.tech/backend/user/getinfoYT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Origin': 'https://listnr.ai',
                'Referer': 'https://listnr.ai/'
            },
            data: {
                url: videoUrl,
                platform: "instagram",
                type: "video"
            }
        };

        const response = await axios(config);
        
        if (response.data && response.data.url) {
            return [{
                url: response.data.url,
                type: 'video',
                quality: 'HD'
            }];
        }
        return null;
    } catch (error) {
        return null;
    }
};
