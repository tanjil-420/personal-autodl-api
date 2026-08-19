const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytDlp = require('yt-dlp-exec');

const router = express.Router();

function getCookiesPath() {
    const cookiesEnv = process.env.YT_COOKIES;
    if (!cookiesEnv) return null;
    
    if (cookiesEnv.includes('# Netscape')) {
        const cookiePath = path.join('/tmp', 'youtube_cookies.txt');
        fs.writeFileSync(cookiePath, cookiesEnv);
        return cookiePath;
    }

    try {
        const decoded = Buffer.from(cookiesEnv, 'base64').toString('utf-8');
        if (decoded.includes('# Netscape')) {
            const cookiePath = path.join('/tmp', 'youtube_cookies.txt');
            fs.writeFileSync(cookiePath, decoded);
            return cookiePath;
        }
    } catch (e) {
        console.error('Cookie decode error:', e.message);
    }

    console.warn('⚠️ YT_COOKIES format is invalid. Skipping cookies.');
    return null;
}

async function downloadWithCobalt(videoUrl) {
    const instances = [
        'https://api.cobalt.tools',
        'https://cobalt.api.scps.ltd'
    ];

    for (const baseUrl of instances) {
        try {
            const response = await axios.post(baseUrl, {
                url: videoUrl,
                videoQuality: '720'
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
                },
                timeout: 10000
            });

            if (response.data && (response.data.url || response.data.picker)) {
                return {
                    status: true,
                    provider: 'cobalt',
                    title: response.data.filename || 'Downloaded Video',
                    url: response.data.url || response.data.picker[0]?.url,
                    type: response.data.status
                };
            }
        } catch (err) {
            console.log(`Cobalt instance ${baseUrl} failed:`, err.message);
        }
    }
    throw new Error('Cobalt failed');
}

async function downloadWithInvidious(videoUrl) {
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    } else if (videoUrl.includes('v=')) {
        videoId = videoUrl.split('v=')[1].split('&')[0];
    } else if (videoUrl.includes('shorts/')) {
        videoId = videoUrl.split('shorts/')[1].split('?')[0];
    }

    if (!videoId) throw new Error('Not a valid YouTube URL');

    const instances = [
        'https://invidious.nerdvpn.de',
        'https://inv.tux.pizza',
        'https://vid.puffyan.us'
    ];

    for (const domain of instances) {
        try {
            const res = await axios.get(`${domain}/api/v1/videos/${videoId}`, { timeout: 8000 });
            if (res.data && res.data.formatStreams && res.data.formatStreams.length > 0) {
                const stream = res.data.formatStreams[res.data.formatStreams.length - 1];
                return {
                    status: true,
                    provider: 'invidious',
                    title: res.data.title,
                    url: stream.url,
                    thumbnail: res.data.videoThumbnails?.[0]?.url
                };
            }
        } catch (e) {
            console.log(`Invidious ${domain} failed`);
        }
    }
    throw new Error('Invidious failed');
}

router.get('/alldl', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ status: false, message: 'URL query parameter is required' });
    }

    try {
        const result = await downloadWithCobalt(videoUrl);
        return res.json(result);
    } catch (e) {
        console.log('Cobalt failed, trying Invidious...');
    }

    try {
        const result = await downloadWithInvidious(videoUrl);
        return res.json(result);
    } catch (e) {
        console.log('Invidious failed, trying yt-dlp...');
    }

    try {
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        };

        const cookiePath = getCookiesPath();
        if (cookiePath) {
            options.cookies = cookiePath;
        }

        const output = await ytDlp(videoUrl, options);

        return res.json({
            status: true,
            provider: 'yt-dlp',
            title: output.title,
            duration: output.duration,
            url: output.url || (output.formats && output.formats[output.formats.length - 1]?.url)
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to extract video from all available sources',
            error: error.message || error
        });
    }
});

module.exports = router;
