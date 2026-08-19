const ytb = require('./ytb');
const facebook = require('./facebook');
const tiktok = require('./tiktok');
const instagram = require('./instagram');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

function detectPlatform(url) {
    const patterns = {
        youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/i,
        facebook: /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com|fb\.watch|m\.facebook\.com|web\.facebook\.com|share\/r\/)/i,
        tiktok: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i,
        instagram: /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)/i
    };

    for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(url) && config.platforms && config.platforms[platform] === true) {
            return platform;
        }
    }
    return 'unknown';
}

async function ytbHandler(req, res) {
    try {
        const { url, format = '720' } = req.query;
        if (!url) {
            return res.json({ success: false, message: "URL parameter is required" });
        }
        
        const result = await ytb(url, format);
        if (!result || result.length === 0) {
            return res.json({ success: false, message: "No video found" });
        }
        
        res.json({
            success: true,
            url: result[0].url,
            type: result[0].type || 'video',
            dev: config.dev
        });
    } catch (error) {
        res.json({ success: false, message: error.message || "Failed to process" });
    }
}

async function facebookHandler(req, res) {
    try {
        const { url } = req.query;
        if (!url) {
            return res.json({ success: false, message: "URL parameter is required" });
        }
        
        const result = await facebook(url);
        if (!result || result.length === 0) {
            return res.json({ success: false, message: "No video found" });
        }
        
        res.json({
            success: true,
            url: result[0].url,
            type: result[0].type || 'video',
            dev: config.dev
        });
    } catch (error) {
        res.json({ success: false, message: error.message || "Failed to process" });
    }
}

async function tiktokHandler(req, res) {
    try {
        const { url } = req.query;
        if (!url) {
            return res.json({ success: false, message: "URL parameter is required" });
        }
        
        const result = await tiktok(url);
        if (!result || result.length === 0) {
            return res.json({ success: false, message: "No video found" });
        }
        
        res.json({
            success: true,
            url: result[0].url,
            type: result[0].type || 'video',
            dev: config.dev
        });
    } catch (error) {
        res.json({ success: false, message: error.message || "Failed to process" });
    }
}

async function instagramHandler(req, res) {
    try {
        const { url } = req.query;
        if (!url) {
            return res.json({ success: false, message: "URL parameter is required" });
        }
        
        const result = await instagram(url);
        if (!result || result.length === 0) {
            return res.json({ success: false, message: "No video found" });
        }
        
        res.json({
            success: true,
            url: result[0].url,
            type: result[0].type || 'video',
            dev: config.dev
        });
    } catch (error) {
        res.json({ success: false, message: error.message || "Failed to process" });
    }
}

async function alldlHandler(req, res) {
    try {
        const { url, format = '720' } = req.query;
        if (!url) {
            return res.json({ success: false, message: "URL parameter is required" });
        }

        const platform = detectPlatform(url);
        if (platform === 'unknown') {
            return res.json({ success: false, message: "Unsupported or disabled platform" });
        }

        let result = null;
        switch (platform) {
            case 'youtube':
                result = await ytb(url, format);
                break;
            case 'facebook':
                result = await facebook(url);
                break;
            case 'tiktok':
                result = await tiktok(url);
                break;
            case 'instagram':
                result = await instagram(url);
                break;
        }

        if (!result || result.length === 0) {
            return res.json({ success: false, message: "No video found" });
        }

        res.json({
            success: true,
            url: result[0].url,
            type: result[0].type || 'video',
            platform: platform,
            dev: config.dev
        });
    } catch (error) {
        res.json({ success: false, message: error.message || "Failed to process" });
    }
}

function rootHandler(req, res) {
    const enabledPlatforms = Object.keys(config.platforms || {}).filter(key => config.platforms[key] === true);
    
    res.json({
        status: 'ok',
        message: 'Alldl API is running',
        dev: config.dev,
        platforms: enabledPlatforms,
        
    });
}

module.exports = {
    ytb: ytbHandler,
    facebook: facebookHandler,
    tiktok: tiktokHandler,
    instagram: instagramHandler,
    alldl: alldlHandler,
    root: rootHandler
};
