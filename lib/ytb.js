const axios = require('axios');

module.exports = async function getYouTubeVideo(videoUrl, format = '720') {
    try {
        const config = {
            method: 'GET',
            url: 'https://p.savenow.to/api/v2/download',
            params: {
                format: format,
                url: videoUrl,
                apikey: 'dfcb6d76f2fea98949kgjkege8a4ab232222'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Accept': '*/*',
                'Origin': 'https://y2mate.yt',
                'Referer': 'https://y2mate.yt/'
            },
            timeout: 30000
        };
        
        const response = await axios(config);
        const progressUrl = response.data.progress_url;
        
        if (!progressUrl) return null;
        
        let attempts = 0;
        const maxAttempts = 30;
        
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    attempts++;
                    const progressResponse = await axios.get(progressUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
                        },
                        timeout: 10000
                    });
                    
                    if (progressResponse.data.download_url) {
                        clearInterval(interval);
                        resolve([{
                            url: progressResponse.data.download_url,
                            type: 'video',
                            quality: format
                        }]);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('Timeout'));
                    }
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('Failed'));
                    }
                }
            }, 2000);
        });
    } catch (error) {
        return null;
    }
};
