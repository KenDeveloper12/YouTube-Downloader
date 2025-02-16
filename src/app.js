const express = require('express');
const cors = require('cors');
const path = require('path');
const youtubeDl = require('youtube-dl-exec');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

function isValidYoutubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
}

app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('Received URL:', url);
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL video tidak ditemukan' 
            });
        }

        if (!isValidYoutubeUrl(url)) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL tidak valid' 
            });
        }

        const videoInfo = await youtubeDl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true
        });

        // Filter format yang tersedia
        const formats = videoInfo.formats.filter(format => {
            return format.ext === 'mp4' && format.acodec !== 'none' && format.vcodec !== 'none';
        });

        const videoData = formats.map(format => ({
            quality: format.height ? `${format.height}p` : 'unknown',
            filesize: format.filesize,
            format_id: format.format_id
        }));

        res.json({
            success: true,
            data: {
                title: videoInfo.title,
                thumbnail: videoInfo.thumbnail,
                duration: videoInfo.duration,
                formats: videoData
            }
        });

    } catch (error) {
        console.error('Video Info Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan saat memproses video',
            details: error.message
        });
    }
});

app.get('/api/download', async (req, res) => {
    try {
        const { url, quality } = req.query;

        if (!url || !isValidYoutubeUrl(url)) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL tidak valid' 
            });
        }

        // Mendapatkan informasi video
        const videoInfo = await youtubeDl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true
        });

        // Mengunduh video
        const downloadProcess = youtubeDl.exec(url, {
            format: quality ? `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]` : 'best',
            output: `${videoInfo.title}.mp4`,
            mergeOutputFormat: 'mp4'
        });

        // Set header untuk download
        res.header('Content-Disposition', `attachment; filename="${videoInfo.title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Pipe output ke response
        downloadProcess.stdout.pipe(res);

        downloadProcess.on('error', (error) => {
            console.error('Download Error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan saat mengunduh video'
                });
            }
        });

    } catch (error) {
        console.error('Download Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: 'Terjadi kesalahan saat mengunduh video',
                details: error.message
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});