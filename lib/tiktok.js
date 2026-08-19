const axios = require('axios');

module.exports = async function getTikTokVideo(videoUrl) {
    try {
        const cleanUrl = videoUrl.split('?')[0].split('&')[0];
        
        const payload = new URLSearchParams();
        payload.append('url', cleanUrl);
        payload.append('count', '12');
        payload.append('cursor', '0');
        payload.append('web', '1');
        payload.append('hd', '1');

        const response = await axios.post('https://www.tikwm.com/api/', payload, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://www.tikwm.com',
                'Referer': 'https://www.tikwm.com/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.data.code === 0 && response.data.data) {
            const data = response.data.data;
            
            let videoUrl = data.hdplay || data.play || data.wmplay || data.hd_video_url;
            
            if (videoUrl) {
                if (videoUrl.startsWith('/')) {
                    videoUrl = `https://www.tikwm.com${videoUrl}`;
                }
                
                return [{
                    url: videoUrl,
                    type: 'video',
                    quality: data.hdplay ? 'HD' : 'SD'
                }];
            }
        }
        return null;
    } catch (error) {
        return null;
    }
};
