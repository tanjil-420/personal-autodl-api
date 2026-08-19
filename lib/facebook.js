const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function getFacebookVideo(videoUrl) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://snapsave.io',
            'Referer': 'https://snapsave.io/en/home',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const data = new URLSearchParams();
        data.append('p', 'home');
        data.append('q', videoUrl);
        data.append('lang', 'en');
        data.append('w', '');

        const response = await axios.post('https://snapsave.io/api/ajaxSearch', data, { headers });

        if (response.data.status === 'ok') {
            const $ = cheerio.load(response.data.data);
            const results = [];

            $('a.download-link-fb').each((index, element) => {
                const url = $(element).attr('href');
                const title = $(element).attr('title') || '';
                
                if (title.includes('720p') || title.includes('1080p') || title.includes('HD')) {
                    results.unshift({
                        url: url,
                        type: 'video',
                        quality: title.match(/\d+p/)?.[0] || 'HD'
                    });
                } else {
                    results.push({
                        url: url,
                        type: 'video',
                        quality: 'SD'
                    });
                }
            });

            if (results.length === 0) {
                $('video source, iframe').each((index, element) => {
                    const src = $(element).attr('src');
                    if (src && src.includes('video')) {
                        results.push({
                            url: src,
                            type: 'video',
                            quality: 'SD'
                        });
                    }
                });
            }

            return results.length > 0 ? results : null;
        }
        return null;
    } catch (error) {
        return null;
    }
};
