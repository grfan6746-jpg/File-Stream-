import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import { PROJECT_FILES } from './src/projectTemplate.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for LAN testing and VLC requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  next();
});

// Helper to get local IP addresses
function getLocalIps(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const iface of netList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
  }
  return ips.length > 0 ? ips : ['192.168.1.105', '127.0.0.1'];
}

// 1. API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. API: Server Status & IP detection
app.get('/api/status', (req, res) => {
  const ips = getLocalIps();
  res.json({
    online: true,
    server_name: 'Android TV Media Server',
    host: '0.0.0.0',
    port: 8080,
    detected_ips: ips,
    primary_ip: ips[0] || '192.168.1.105',
    active_streams: 1,
    uptime_seconds: Math.floor(process.uptime()),
    auth_enabled: false
  });
});

// 3. API: Project Files List
app.get('/api/project-files', (req, res) => {
  res.json({ files: PROJECT_FILES });
});

// 4. API: Download Complete Project ZIP
app.get('/api/download-zip', async (req, res) => {
  try {
    const zip = new JSZip();

    // Add all project files
    for (const file of PROJECT_FILES) {
      zip.file(file.path, file.content);
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="android-tv-vlc-server.zip"');
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Error generating zip:', err);
    res.status(500).json({ error: 'Failed to generate ZIP archive', details: err.message });
  }
});

// 5. API: Direct Raw File Serving & One-Liner Installer
app.get('/install.sh', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (req.protocol === 'https' ? 'https' : 'http');
  const base = `${proto}://${host}`;

  const script = `#!/data/data/com.termux/files/usr/bin/bash
set -e
echo "================================================="
echo "   نصب‌کننده خودکار سرور رسانه Android TV & Termux"
echo "================================================="

echo "[1/4] بررسی و نصب پکیج‌های پایتون و ابزارها..."
pkg update -y && pkg install -y python curl unzip

echo "[2/4] ایجاد پوشه کاری و تنظیم مجوزهای حافظه..."
termux-setup-storage || true
mkdir -p ~/android-tv-vlc-server
cd ~/android-tv-vlc-server

echo "[3/4] دانلود کدهای سرور..."
curl -sL "${base}/api/download-zip" -o server.zip
unzip -o server.zip
rm -f server.zip
chmod +x scripts/*.sh 2>/dev/null || true

echo "[4/4] راه‌اندازی سرور پایتون..."
echo "سرور با موفقیت راه‌اندازی شد!"
python3 server/main.py
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(script);
});

app.get(['/raw/*', '/server/main.py'], (req, res) => {
  let reqPath = req.params[0] || 'server/main.py';
  if (req.path === '/server/main.py') {
    reqPath = 'server/main.py';
  }
  const file = PROJECT_FILES.find((f) => f.path === reqPath || f.name === reqPath || f.path.endsWith(reqPath));
  if (file) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(file.content);
  } else {
    res.status(404).send('File not found in project template');
  }
});

// 6. API: VLC Stream endpoint with HTTP 206 Partial Content (Range Request) Demonstration
app.get('/api/stream/demo-video', (req, res) => {
  // Generates a mock MP4 or serves sample byte stream for VLC testing
  // We provide a realistic Range Request handler
  const sampleSize = 10 * 1024 * 1024; // 10MB simulated media stream
  const range = req.headers.range;

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : sampleSize - 1;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${sampleSize}`);
    res.setHeader('Content-Length', chunkSize.toString());

    // Send dummy chunk buffer
    const buffer = Buffer.alloc(Math.min(chunkSize, 64 * 1024));
    res.end(buffer);
  } else {
    res.status(200);
    res.setHeader('Content-Length', sampleSize.toString());
    const buffer = Buffer.alloc(Math.min(sampleSize, 64 * 1024));
    res.end(buffer);
  }
});

// 6. API: Generate M3U Playlist for VLC
app.get('/api/playlist.m3u', (req, res) => {
  const hostIp = getLocalIps()[0] || '192.168.1.105';
  const port = 8080;

  const m3uContent = `#EXTM3U
#EXTINF:-1,Inception (2010) [1080p BluRay]
http://${hostIp}:${port}/media/usb_sandisk_64g/Movies/Inception.2010.1080p.BluRay.mkv
#EXTINF:-1,Interstellar (2014) [4K HDR]
http://${hostIp}:${port}/media/usb_sandisk_64g/Movies/Interstellar.2014.2160p.HDR.mp4
#EXTINF:-1,Hans Zimmer - Time (Live FLAC)
http://${hostIp}:${port}/media/usb_sandisk_64g/Music/Hans_Zimmer_Time_Live.flac
#EXTINF:-1,Shajarian - Rastan Album (MP3)
http://${hostIp}:${port}/media/usb_sandisk_64g/Music/Shajarian_Rastan_Album.mp3
`;

  res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="android-tv-vlc-playlist.m3u"');
  res.send(m3uContent);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
