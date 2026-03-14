/**
 * Video Optimization Script
 * Converts login.mp4 and background.gif to optimized WebM + poster images
 * Uses fluent-ffmpeg + ffmpeg-static (already installed)
 */
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const ASSETS = path.join(__dirname, '..', 'src', 'assets');
let completed = 0;
const TOTAL = 5;

function done(name) {
    completed++;
    console.log(`✅ [${completed}/${TOTAL}] ${name}`);
    if (completed === TOTAL) {
        console.log('\n🎉 All video optimizations complete!');
    }
}

function fail(name, err) {
    console.error(`❌ ${name} failed:`, err.message);
}

console.log('🎬 Starting video optimization...\n');

// 1. login.mp4 → login.webm (VP9, ~1-2 MB)
ffmpeg(path.join(ASSETS, 'vids', 'login.mp4'))
    .outputOptions(['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '1M', '-an'])
    .output(path.join(ASSETS, 'vids', 'login.webm'))
    .on('end', () => done('login.webm'))
    .on('error', (err) => fail('login.webm', err))
    .run();

// 2. login.mp4 → login-optimized.mp4 (H.264 re-encoded, ~2-3 MB, faststart)
ffmpeg(path.join(ASSETS, 'vids', 'login.mp4'))
    .outputOptions(['-c:v', 'libx264', '-crf', '28', '-preset', 'slow', '-movflags', '+faststart', '-an'])
    .output(path.join(ASSETS, 'vids', 'login-optimized.mp4'))
    .on('end', () => done('login-optimized.mp4'))
    .on('error', (err) => fail('login-optimized.mp4', err))
    .run();

// 3. login.mp4 → login-poster.webp (last frame as poster)
ffmpeg(path.join(ASSETS, 'vids', 'login.mp4'))
    .inputOptions(['-sseof', '-1'])
    .outputOptions(['-vframes', '1', '-q:v', '2'])
    .output(path.join(ASSETS, 'vids', 'login-poster.webp'))
    .on('end', () => done('login-poster.webp'))
    .on('error', (err) => fail('login-poster.webp', err))
    .run();

// 4. background.gif → background.webm (VP9, ~200-500 KB)
ffmpeg(path.join(ASSETS, "landing", "gif's", 'background.gif'))
    .outputOptions(['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-an'])
    .output(path.join(ASSETS, "landing", "gif's", 'background.webm'))
    .on('end', () => done('background.webm'))
    .on('error', (err) => fail('background.webm', err))
    .run();

// 5. background.gif → background-poster.webp (first frame)
ffmpeg(path.join(ASSETS, "landing", "gif's", 'background.gif'))
    .outputOptions(['-vframes', '1'])
    .output(path.join(ASSETS, "landing", "gif's", 'background-poster.webp'))
    .on('end', () => done('background-poster.webp'))
    .on('error', (err) => fail('background-poster.webp', err))
    .run();
