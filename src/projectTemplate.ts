import { ProjectFile } from './types';

export const PROJECT_FILES: ProjectFile[] = [
  {
    path: 'server/main.py',
    name: 'main.py',
    language: 'python',
    category: 'server',
    description: 'سرور اصلی پایتون با مصرف رم ناچیز (~25MB) و پشتیبانی کامل از HTTP Range 206 جهت Stream مستقیم در VLC و مرورگر بدون نیاز به Transcode.',
    content: `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Android TV & Termux Local Media Server
Ultra-lightweight HTTP streaming server with HTTP Range (206 Partial Content)
Optimized for ARM/ARM64 Android TV devices with zero external pip dependencies.
"""

import os
import sys
import json
import socket
import mimetypes
import urllib.parse
import shutil
import base64
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Paths & Directories
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "config.json"
WEB_DIR = PROJECT_ROOT / "web"

# Load Configuration
DEFAULT_CONFIG = {
    "server_name": "Android TV Media Server",
    "host": "0.0.0.0",
    "port": 8080,
    "auth_enabled": False,
    "username": "admin",
    "password": "",
    "custom_storages": []
}

def load_config():
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                merged = DEFAULT_CONFIG.copy()
                merged.update(cfg)
                return merged
        except Exception as e:
            print(f"[!] Warning: Could not read config file: {e}")
    return DEFAULT_CONFIG.copy()

CONFIG = load_config()

# Supported Media Extensions
MEDIA_EXTENSIONS = {
    # Video
    ".mp4": ("video/mp4", "video"),
    ".mkv": ("video/x-matroska", "video"),
    ".avi": ("video/x-msvideo", "video"),
    ".mov": ("video/quicktime", "video"),
    ".webm": ("video/webm", "video"),
    ".ts": ("video/mp2t", "video"),
    ".m4v": ("video/x-m4v", "video"),
    ".flv": ("video/x-flv", "video"),
    ".3gp": ("video/3gpp", "video"),
    # Audio
    ".mp3": ("audio/mpeg", "audio"),
    ".flac": ("audio/flac", "audio"),
    ".wav": ("audio/wav", "audio"),
    ".m4a": ("audio/mp4", "audio"),
    ".aac": ("audio/aac", "audio"),
    ".ogg": ("audio/ogg", "audio"),
    ".opus": ("audio/opus", "audio"),
    # Images
    ".jpg": ("image/jpeg", "image"),
    ".jpeg": ("image/jpeg", "image"),
    ".png": ("image/png", "image"),
    ".webp": ("image/webp", "image"),
    ".gif": ("image/gif", "image"),
    ".svg": ("image/svg+xml", "image"),
    # Subtitles
    ".srt": ("text/plain", "subtitle"),
    ".vtt": ("text/vtt", "subtitle"),
    ".ass": ("text/plain", "subtitle")
}

def get_mime_and_category(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext in MEDIA_EXTENSIONS:
        return MEDIA_EXTENSIONS[ext]
    mime, _ = mimetypes.guess_type(file_path)
    return mime or "application/octet-stream", "other"

def get_local_ips():
    """Detects active local Wi-Fi / Ethernet LAN IP addresses on the Android TV"""
    ips = []
    # Method 1: Connect to a public dummy socket without sending data
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        if ip and not ip.startswith("127."):
            ips.append(ip)
        s.close()
    except Exception:
        pass

    # Method 2: Get all host addresses
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    return ips if ips else ["127.0.0.1"]

def detect_storages():
    """
    Auto-detects Internal Storage and connected USB drives (OTG flash/external HDD)
    Works on non-root Android TV by probing standard Android mount directories:
      1. /sdcard or /storage/emulated/0 (Internal)
      2. ~/storage/shared, ~/storage/external-* (from termux-setup-storage)
      3. /storage/????-???? (Standard Android external USB mount paths)
      4. /mnt/media_rw/* (if readable)
    """
    storages = []
    seen_paths = set()

    def add_storage(s_id, name, path_str, s_type):
        p = Path(path_str).resolve()
        p_str = str(p)
        if p.exists() and os.access(p_str, os.R_OK) and p_str not in seen_paths:
            seen_paths.add(p_str)
            try:
                usage = shutil.disk_usage(p_str)
                total = usage.total
                free = usage.free
            except Exception:
                total = 0
                free = 0

            storages.append({
                "id": s_id,
                "name": name,
                "path": p_str,
                "type": s_type,
                "total_space": total,
                "free_space": free,
                "is_mounted": True,
                "is_read_only": True
            })

    # 1. Internal Storage
    internal_candidates = [
        Path.home() / "storage" / "shared",
        Path("/storage/emulated/0"),
        Path("/sdcard")
    ]
    for cand in internal_candidates:
        if cand.exists():
            add_storage("internal", "حافظه داخلی تلویزیون (Internal Storage)", str(cand), "internal")
            break

    # 2. Termux-Setup-Storage external symbolic links
    termux_storage = Path.home() / "storage"
    if termux_storage.exists():
        for item in termux_storage.iterdir():
            if item.name.startswith("external-"):
                add_storage(f"usb_{item.name}", f"حافظه جانبی ({item.name})", str(item), "usb")

    # 3. Direct Android /storage inspection (USB / OTG)
    root_storage = Path("/storage")
    if root_storage.exists() and os.access("/storage", os.R_OK):
        try:
            for item in root_storage.iterdir():
                # Avoid emulated and self
                if item.name not in ["emulated", "self", "knox-emulated"] and item.is_dir():
                    # Common USB names like ABCD-1234
                    s_id = f"usb_{item.name.replace('-', '_')}"
                    add_storage(s_id, f"حافظه USB ({item.name})", str(item), "usb")
        except Exception as e:
            print(f"[*] Note: Reading /storage directory: {e}")

    # 4. Custom storages from config
    for idx, custom in enumerate(CONFIG.get("custom_storages", [])):
        c_id = custom.get("id", f"custom_{idx}")
        c_name = custom.get("name", f"Custom Storage {idx+1}")
        c_path = custom.get("path", "")
        if c_path:
            add_storage(c_id, c_name, c_path, "custom")

    # Fallback if in restricted container/PC testing
    if not storages:
        # Provide user's home or current dir as fallback
        add_storage("local_dir", "مسیر محلی (Testing Fallback)", str(PROJECT_ROOT), "internal")

    return storages

def get_storage_by_id(storage_id):
    for s in detect_storages():
        if s["id"] == storage_id:
            return s
    return None

def is_safe_path(base_dir, path):
    """Path traversal prevention: ensures requested path stays strictly within base directory"""
    try:
        base = os.path.realpath(base_dir)
        target = os.path.realpath(path)
        return target.startswith(base) and os.path.exists(target)
    except Exception:
        return False

class MediaHTTPRequestHandler(BaseHTTPRequestHandler):
    """
    HTTP Handler supporting:
      - Static Web UI (HTML/CSS/JS)
      - REST API (/api/status, /api/storages, /api/browse)
      - HTTP Range Requests (206 Partial Content) for VLC video seeking
      - Optional Basic Authentication
    """
    server_version = "AndroidTV-MediaServer/1.0"

    def check_auth(self):
        """Validates HTTP Basic Auth if enabled in config"""
        if not CONFIG.get("auth_enabled", False):
            return True

        auth_header = self.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Basic "):
            self.send_response(401)
            self.send_header("WWW-Authenticate", 'Basic realm="Android TV Media Server"')
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"Authentication required")
            return False

        try:
            encoded = auth_header.split(" ", 1)[1].strip()
            decoded = base64.b64decode(encoded).decode("utf-8")
            username, password = decoded.split(":", 1)
            if username == CONFIG.get("username", "admin") and password == CONFIG.get("password", ""):
                return True
        except Exception:
            pass

        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Android TV Media Server"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"Invalid username or password")
        return False

    def do_HEAD(self):
        if not self.check_auth():
            return
        self.handle_request(is_head=True)

    def do_GET(self):
        if not self.check_auth():
            return
        self.handle_request(is_head=False)

    def handle_request(self, is_head=False):
        parsed = urllib.parse.urlparse(self.path)
        raw_path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # CORS Headers for LAN apps & VLC
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Range, Content-Type, Authorization",
            "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
        }

        # Route 1: REST API
        if raw_path.startswith("/api/"):
            self.handle_api(raw_path, query, headers, is_head)
            return

        # Route 2: Media Streaming (/media/<storage_id>/<relative_path>)
        if raw_path.startswith("/media/"):
            self.handle_media_stream(raw_path, headers, is_head)
            return

        # Route 3: M3U Playlist generation for VLC
        if raw_path == "/playlist.m3u":
            self.handle_m3u_playlist(query, headers, is_head)
            return

        # Route 4: Static Web UI
        self.handle_static(raw_path, headers, is_head)

    def handle_api(self, path, query, headers, is_head):
        if path == "/api/status":
            ips = get_local_ips()
            data = {
                "online": True,
                "server_name": CONFIG.get("server_name", "Android TV Media Server"),
                "port": CONFIG.get("port", 8080),
                "host": CONFIG.get("host", "0.0.0.0"),
                "detected_ips": ips,
                "primary_ip": ips[0] if ips else "127.0.0.1",
                "auth_enabled": CONFIG.get("auth_enabled", False),
                "storages_count": len(detect_storages())
            }
            self.send_json(data, headers, is_head)

        elif path == "/api/storages":
            storages = detect_storages()
            self.send_json(storages, headers, is_head)

        elif path == "/api/browse":
            storage_id = query.get("storage", [""])[0]
            rel_dir = query.get("path", [""])[0].strip("/")

            storage = get_storage_by_id(storage_id)
            if not storage:
                self.send_error_json(404, f"Storage ID '{storage_id}' not found", headers)
                return

            base_path = storage["path"]
            target_dir = os.path.join(base_path, rel_dir) if rel_dir else base_path

            if not is_safe_path(base_path, target_dir) or not os.path.isdir(target_dir):
                self.send_error_json(403, "Access denied or directory not found", headers)
                return

            items = []
            try:
                with os.scandir(target_dir) as entries:
                    for entry in entries:
                        # Skip hidden files
                        if entry.name.startswith("."):
                            continue

                        is_dir = entry.is_dir(follow_symlinks=True)
                        rel_path = os.path.relpath(entry.path, base_path)

                        if is_dir:
                            items.append({
                                "name": entry.name,
                                "relative_path": rel_path.replace("\\\\", "/"),
                                "storage_id": storage_id,
                                "is_dir": True,
                                "size": 0,
                                "extension": "",
                                "mime_type": "inode/directory",
                                "category": "folder",
                                "modified_time": int(entry.stat().st_mtime)
                            })
                        else:
                            mime, cat = get_mime_and_category(entry.name)
                            stat = entry.stat()
                            items.append({
                                "name": entry.name,
                                "relative_path": rel_path.replace("\\\\", "/"),
                                "storage_id": storage_id,
                                "is_dir": False,
                                "size": stat.st_size,
                                "extension": os.path.splitext(entry.name)[1].lower(),
                                "mime_type": mime,
                                "category": cat,
                                "modified_time": int(stat.st_mtime)
                            })
            except Exception as e:
                self.send_error_json(500, f"Error reading directory: {str(e)}", headers)
                return

            # Sort: Folders first, then alphabetical
            items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
            self.send_json({
                "storage": storage,
                "current_path": rel_dir,
                "items": items
            }, headers, is_head)

        else:
            self.send_error_json(404, "API endpoint not found", headers)

    def handle_media_stream(self, path, headers, is_head):
        """
        Direct File Streaming with HTTP 206 Range Request support.
        Allows VLC Media Player and browsers to seek/jump to any point instantly.
        Zero transcoding = Zero CPU overhead.
        """
        # Path format: /media/<storage_id>/<relative_path...>
        parts = path[len("/media/"):].split("/", 1)
        if len(parts) < 2:
            self.send_error_response(400, "Invalid media path", headers)
            return

        storage_id = parts[0]
        rel_path = urllib.parse.unquote(parts[1])

        storage = get_storage_by_id(storage_id)
        if not storage:
            self.send_error_response(404, "Storage not found", headers)
            return

        base_path = storage["path"]
        file_path = os.path.join(base_path, rel_path)

        if not is_safe_path(base_path, file_path) or not os.path.isfile(file_path):
            self.send_error_response(404, "File not found or access forbidden", headers)
            return

        file_size = os.path.getsize(file_path)
        mime_type, _ = get_mime_and_category(file_path)

        # Parse Range header (e.g., "bytes=1048576-2097151" or "bytes=5000-")
        range_header = self.headers.get("Range")

        if range_header and range_header.startswith("bytes="):
            byte_range = range_header[6:].strip()
            start_str, _, end_str = byte_range.partition("-")

            try:
                start = int(start_str) if start_str else 0
                end = int(end_str) if end_str else file_size - 1

                if start >= file_size or end >= file_size or start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{file_size}")
                    self.end_headers()
                    return

                length = end - start + 1

                self.send_response(206)  # Partial Content
                self.send_header("Content-Type", mime_type)
                self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                for k, v in headers.items():
                    self.send_header(k, v)
                self.end_headers()

                if is_head:
                    return

                # Efficient streaming loop using 128KB chunks
                with open(file_path, "rb") as f:
                    f.seek(start)
                    remaining = length
                    chunk_size = 128 * 1024  # 128 KB
                    while remaining > 0:
                        to_read = min(remaining, chunk_size)
                        chunk = f.read(to_read)
                        if not chunk:
                            break
                        try:
                            self.wfile.write(chunk)
                        except (BrokenPipeError, ConnectionResetError):
                            # Client / VLC closed or skipped to another position
                            break
                        remaining -= len(chunk)

            except ValueError:
                self.send_error_response(400, "Invalid byte range", headers)
        else:
            # Full file request (200 OK)
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(file_size))
            self.send_header("Accept-Ranges", "bytes")
            for k, v in headers.items():
                self.send_header(k, v)
            self.end_headers()

            if is_head:
                return

            with open(file_path, "rb") as f:
                shutil.copyfileobj(f, self.wfile, length=128 * 1024)

    def handle_m3u_playlist(self, query, headers, is_head):
        """Generates an M3U playlist file for VLC to play all items in a folder"""
        storage_id = query.get("storage", [""])[0]
        rel_dir = query.get("path", [""])[0].strip("/")
        storage = get_storage_by_id(storage_id)

        if not storage:
            self.send_error_response(404, "Storage not found", headers)
            return

        base_path = storage["path"]
        target_dir = os.path.join(base_path, rel_dir) if rel_dir else base_path
        host_ip = get_local_ips()[0]
        port = CONFIG.get("port", 8080)

        lines = ["#EXTM3U"]
        if is_safe_path(base_path, target_dir) and os.path.isdir(target_dir):
            for root, _, files in os.walk(target_dir):
                for file in sorted(files):
                    ext = os.path.splitext(file)[1].lower()
                    if ext in MEDIA_EXTENSIONS and MEDIA_EXTENSIONS[ext][1] in ["video", "audio"]:
                        full = os.path.join(root, file)
                        rel = os.path.relpath(full, base_path).replace("\\\\", "/")
                        url = f"http://{host_ip}:{port}/media/{storage_id}/{urllib.parse.quote(rel)}"
                        lines.append(f"#EXTINF:-1,{file}")
                        lines.append(url)

        content = "\\n".join(lines).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "audio/x-mpegurl; charset=utf-8")
        self.send_header("Content-Disposition", 'attachment; filename="playlist.m3u"')
        self.send_header("Content-Length", str(len(content)))
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        if not is_head:
            self.wfile.write(content)

    def handle_static(self, raw_path, headers, is_head):
        if raw_path == "/" or raw_path == "":
            rel_file = "index.html"
        else:
            rel_file = raw_path.lstrip("/")

        target = (WEB_DIR / rel_file).resolve()
        if str(target).startswith(str(WEB_DIR)) and target.exists() and target.is_file():
            mime, _ = mimetypes.guess_type(str(target))
            mime = mime or "text/plain"
            if target.suffix == ".css":
                mime = "text/css"
            elif target.suffix == ".js":
                mime = "application/javascript"
            elif target.suffix == ".html":
                mime = "text/html; charset=utf-8"

            data = target.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            for k, v in headers.items():
                self.send_header(k, v)
            self.end_headers()
            if not is_head:
                self.wfile.write(data)
        else:
            self.send_error_response(404, "Page not found", headers)

    def send_json(self, data, headers, is_head=False):
        payload = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        if not is_head:
            self.wfile.write(payload)

    def send_error_json(self, code, msg, headers):
        payload = json.dumps({"error": True, "message": msg}, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(payload)

    def send_error_response(self, code, msg, headers):
        body = f"<h1>{code} {msg}</h1>".encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # Clean console log format
        sys.stderr.write("[%s] %s - %s\\n" % (self.log_date_time_string(), self.client_address[0], format % args))

def run():
    host = CONFIG.get("host", "0.0.0.0")
    port = int(CONFIG.get("port", 8080))

    server_address = (host, port)
    httpd = HTTPServer(server_address, MediaHTTPRequestHandler)

    ips = get_local_ips()
    print("=" * 60)
    print("  🎬 ANDROID TV & TERMUX LOCAL MEDIA SERVER")
    print(f"  ⚡ Status: ONLINE on port {port}")
    print(f"  📺 Server Name: {CONFIG.get('server_name')}")
    print(f"  🔒 Auth Protection: {'Enabled' if CONFIG.get('auth_enabled') else 'Disabled (LAN Direct)'}")
    print("-" * 60)
    print("  🌐 Access the Web UI or VLC Stream at:")
    for ip in ips:
        print(f"     👉 http://{ip}:{port}")
    print("=" * 60)
    print("  [!] Press Ctrl+C to stop the server.")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\n[!] Server shutting down gracefully...")
        httpd.server_close()

if __name__ == "__main__":
    run()
`
  },
  {
    path: 'server/server.js',
    name: 'server.js',
    language: 'javascript',
    category: 'server',
    description: 'نسخه جایگزین مبتنی بر Node.js با fs.createReadStream و پشتیبانی Range Request 206 برای کاربرانی که Node.js را روی Termux ترجیح می‌دهند.',
    content: `/**
 * Android TV / Termux Media Server (Node.js Alternative)
 * Install in Termux: pkg install nodejs
 * Run: node server/server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const url = require('url');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'config.json');
const WEB_DIR = path.join(__dirname, '..', 'web');

let config = {
  server_name: "Android TV Media Server (Node.js)",
  host: "0.0.0.0",
  port: 8080,
  auth_enabled: false,
  username: "admin",
  password: ""
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = Object.assign(config, JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')));
  } catch (e) {
    console.error('Failed to read config.json:', e.message);
  }
}

const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json'
};

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips.length ? ips : ['127.0.0.1'];
}

function detectStorages() {
  const storages = [];
  const homedir = os.homedir();
  
  // Internal
  const internalPaths = [
    path.join(homedir, 'storage', 'shared'),
    '/storage/emulated/0',
    '/sdcard'
  ];
  for (const p of internalPaths) {
    if (fs.existsSync(p)) {
      storages.push({
        id: 'internal',
        name: 'حافظه داخلی تلویزیون (Internal Storage)',
        path: p,
        type: 'internal',
        is_mounted: true,
        is_read_only: true
      });
      break;
    }
  }

  // USB / External
  const rootStorage = '/storage';
  if (fs.existsSync(rootStorage)) {
    try {
      const items = fs.readdirSync(rootStorage);
      for (const item of items) {
        if (!['emulated', 'self', 'knox-emulated'].includes(item)) {
          const itemPath = path.join(rootStorage, item);
          if (fs.statSync(itemPath).isDirectory()) {
            storages.push({
              id: 'usb_' + item.replace(/-/g, '_'),
              name: 'حافظه USB (' + item + ')',
              path: itemPath,
              type: 'usb',
              is_mounted: true,
              is_read_only: true
            });
          }
        }
      }
    } catch (e) {}
  }

  if (storages.length === 0) {
    storages.push({
      id: 'default',
      name: 'پوشه پیش‌فرض (Testing)',
      path: path.join(__dirname, '..'),
      type: 'internal',
      is_mounted: true,
      is_read_only: true
    });
  }

  return storages;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

  // API Status
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      online: true,
      server_name: config.server_name,
      port: config.port,
      detected_ips: getLocalIPs()
    }));
  }

  // API Storages
  if (pathname === '/api/storages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(detectStorages()));
  }

  // Media Streaming with Range Request
  if (pathname.startsWith('/media/')) {
    const parts = pathname.slice(7).split('/');
    const storageId = parts[0];
    const relPath = decodeURIComponent(parts.slice(1).join('/'));

    const storages = detectStorages();
    const storage = storages.find(s => s.id === storageId);
    if (!storage) {
      res.writeHead(404);
      return res.end('Storage not found');
    }

    const filePath = path.resolve(storage.path, relPath);
    if (!filePath.startsWith(path.resolve(storage.path)) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end('File not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.writeHead(416, { 'Content-Range': \`bytes */\${fileSize}\` });
        return res.end();
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': \`bytes \${start}-\${end}/\${fileSize}\`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filePath).pipe(res);
    }
    return;
  }

  // Serve Web UI
  let filePath = path.join(WEB_DIR, pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(config.port, config.host, () => {
  const ips = getLocalIPs();
  console.log(\`Server running at http://\${ips[0]}:\${config.port}\`);
});
`
  },
  {
    path: 'web/index.html',
    name: 'index.html',
    language: 'html',
    category: 'web',
    description: 'رابط کاربری مدرن، سبک و کاملاً آفلاین (بدون وابستگی اینترنتی) با پشتیبانی کامل از ریموت کنترل Android TV (D-Pad) و ریسپانسیو برای گوشی.',
    content: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Android TV Media Server</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="theme-dark">
  <!-- Header / Status Bar -->
  <header class="header">
    <div class="brand">
      <span class="icon-tv">📺</span>
      <div>
        <h1 id="serverName">Android TV Media Server</h1>
        <p class="server-desc">پخش مستقیم روی VLC و مرورگر از طریق شبکه محلی (LAN)</p>
      </div>
    </div>
    
    <div class="status-box">
      <div class="status-badge" id="statusBadge">
        <span class="pulse-dot"></span>
        <span id="statusText">Online</span>
      </div>
      <div class="ip-info" id="ipBadge" title="آدرس سرور روی تلویزیون">
        <span class="label">IP تلویزیون:</span>
        <strong id="tvIpDisplay">در حال بررسی...</strong>
      </div>
      <button id="btnVlcGuide" class="btn btn-accent focusable" tabindex="0">
        <span class="btn-icon">📶</span> اتصال به VLC
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="main-container">
    <!-- Storage Selectors -->
    <section class="section-storages">
      <div class="section-header">
        <h2>💾 لیست حافظه‌ها و درایوها (Storage)</h2>
        <span class="badge-hint">فقط خواندنی (امن)</span>
      </div>
      <div class="storage-grid" id="storageList">
        <!-- Injected via JavaScript -->
        <div class="skeleton-card">در حال بارگذاری درایوها...</div>
      </div>
    </section>

    <!-- Breadcrumb & Explorer Toolbar -->
    <section class="section-explorer">
      <div class="explorer-toolbar">
        <div class="breadcrumbs" id="breadcrumbs">
          <span class="crumb active">انتخاب حافظه</span>
        </div>
        <div class="search-box">
          <input type="text" id="searchInput" class="search-input focusable" placeholder="جستجوی فایل..." tabindex="0">
          <button id="btnRefresh" class="btn btn-icon-only focusable" title="بازخوانی" tabindex="0">🔄</button>
        </div>
      </div>

      <!-- File Grid -->
      <div class="file-grid" id="fileList">
        <div class="empty-state">
          <span class="empty-icon">📁</span>
          <p>لطفاً یکی از حافظه‌ها را در بالا انتخاب کنید.</p>
        </div>
      </div>
    </section>
  </main>

  <!-- VLC Connection Modal -->
  <div class="modal" id="vlcModal" role="dialog" aria-hidden="true">
    <div class="modal-content">
      <div class="modal-header">
        <h3>📶 اتصال به VLC Media Player گوشی</h3>
        <button class="btn-close focusable" id="btnCloseVlc" tabindex="0">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-intro">برای پخش مستقیم بدون دانلود، کافیست مراحل زیر را در اپلیکیشن VLC گوشی انجام دهید:</p>
        
        <div class="step-card">
          <span class="step-num">۱</span>
          <div>
            <strong>اتصال به Wi-Fi یکسان:</strong>
            <p>مطمئن شوید گوشی شما به همان مودم/وای‌فای تلویزیون متصل است.</p>
          </div>
        </div>

        <div class="step-card">
          <span class="step-num">۲</span>
          <div>
            <strong>باز کردن VLC روی گوشی:</strong>
            <p>برنامه VLC for Android را باز کنید و وارد تب <b>More</b> یا <b>Streams</b> شوید.</p>
          </div>
        </div>

        <div class="step-card">
          <span class="step-num">۳</span>
          <div>
            <strong>آدرس سرور را وارد کنید:</strong>
            <div class="copy-url-group">
              <input type="text" id="vlcServerUrl" readonly class="url-input">
              <button id="btnCopyUrl" class="btn btn-primary focusable" tabindex="0">📋 کپی آدرس</button>
            </div>
          </div>
        </div>

        <div class="step-card">
          <span class="step-num">۴</span>
          <div>
            <strong>کلیک روی دکمه «Open in VLC» کنار هر فایل:</strong>
            <p>می‌توانید مستقیماً روی دکمه VLC در کنار هر فیلم کلیک کنید تا خودکار در VLC گوشی باز شود.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- In-Browser Video Player Modal -->
  <div class="modal" id="playerModal" role="dialog" aria-hidden="true">
    <div class="modal-content player-modal-content">
      <div class="modal-header">
        <h3 id="playerTitle">پخش ویدیو</h3>
        <button class="btn-close focusable" id="btnClosePlayer" tabindex="0">✕</button>
      </div>
      <div class="player-wrapper">
        <video id="htmlVideoPlayer" controls playsinline preload="metadata">
          مرورگر شما از تگ ویدیو پشتیبانی نمی‌کند.
        </video>
      </div>
      <div class="player-footer">
        <a id="playerVlcDirect" href="#" class="btn btn-accent focusable" tabindex="0">🚀 پخش این ویدیو در VLC</a>
        <button id="playerCopyStream" class="btn btn-secondary focusable" tabindex="0">📋 کپی لینک Stream</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
`
  },
  {
    path: 'web/style.css',
    name: 'style.css',
    language: 'css',
    category: 'web',
    description: 'استایل سبک، سریع و تیره مناسب تلویزیون (OLED/LED) با فوکوس واضح روی المان‌ها برای ریموت کنترل Android TV و نمایشگر لمسی موبایل.',
    content: `/* Reset & Base Setup */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-main: #0f141c;
  --bg-card: #18202d;
  --bg-card-hover: #222c3d;
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --accent: #38bdf8;
  --accent-glow: rgba(56, 189, 248, 0.3);
  --success: #10b981;
  --danger: #ef4444;
  --border: #334155;
  --focus-ring: #f59e0b;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

body {
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-family);
  min-height: 100vh;
  line-height: 1.6;
  direction: rtl;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* TV Remote Focus Highlights */
.focusable:focus,
.focusable:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
  transform: scale(1.02);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-tv {
  font-size: 36px;
}

.brand h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-main);
}

.server-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.status-box {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
}

.ip-info {
  background: #0b0f15;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-size: 14px;
}

.ip-info .label {
  color: var(--text-muted);
  margin-left: 6px;
}

.ip-info strong {
  color: var(--accent);
  font-family: monospace;
}

/* Buttons */
.btn {
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s, transform 0.15s;
  color: #fff;
  text-decoration: none;
}

.btn-primary {
  background: #2563eb;
}
.btn-primary:hover {
  background: #1d4ed8;
}

.btn-accent {
  background: #0284c7;
}
.btn-accent:hover {
  background: #0369a1;
}

.btn-secondary {
  background: #334155;
}
.btn-secondary:hover {
  background: #475569;
}

.btn-icon-only {
  padding: 10px;
  background: #1e293b;
}

/* Main Container */
.main-container {
  max-width: 1350px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Storage Cards */
.section-storages {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.badge-hint {
  font-size: 12px;
  background: rgba(56, 189, 248, 0.1);
  color: var(--accent);
  padding: 4px 10px;
  border-radius: 12px;
}

.storage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.storage-card {
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.storage-card:hover {
  background: var(--bg-card-hover);
}

.storage-card.active {
  border-color: var(--accent);
  background: rgba(56, 189, 248, 0.08);
  box-shadow: 0 0 12px var(--accent-glow);
}

.storage-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.storage-icon {
  font-size: 28px;
}

.storage-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
}

.storage-type-badge {
  font-size: 11px;
  color: var(--text-muted);
}

.usage-bar-bg {
  background: #0b0f15;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.usage-bar-fill {
  background: var(--accent);
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.usage-text {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}

/* Explorer Section */
.section-explorer {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.explorer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  flex-wrap: wrap;
}

.crumb {
  color: var(--accent);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
.crumb:hover {
  background: rgba(56, 189, 248, 0.1);
}
.crumb.active {
  color: var(--text-main);
  font-weight: 600;
  cursor: default;
}
.crumb-separator {
  color: var(--text-muted);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  background: #0b0f15;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: #fff;
  padding: 8px 14px;
  font-size: 14px;
  width: 220px;
}
.search-input:focus {
  border-color: var(--accent);
  outline: none;
}

/* File Grid */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  min-height: 250px;
}

.file-card {
  background: #111722;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.file-card:hover {
  background: #1a2333;
  border-color: #475569;
}

.file-icon-box {
  font-size: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  background: #090d14;
  border-radius: var(--radius-sm);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: ltr;
  text-align: right;
}

.file-meta {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}

.file-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
}

.file-actions .btn {
  padding: 6px 10px;
  font-size: 12px;
  flex: 1;
  justify-content: center;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 12px;
}
.empty-icon {
  font-size: 48px;
}

/* Modals */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.player-modal-content {
  max-width: 850px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-card {
  display: flex;
  gap: 14px;
  background: #0e141f;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.step-num {
  background: var(--accent);
  color: #000;
  font-weight: 700;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.copy-url-group {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.url-input {
  flex: 1;
  background: #000;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--accent);
  padding: 8px 12px;
  font-family: monospace;
  font-size: 13px;
  direction: ltr;
}

.player-wrapper {
  background: #000;
  border-radius: var(--radius-sm);
  overflow: hidden;
  max-height: 480px;
  display: flex;
  justify-content: center;
}

#htmlVideoPlayer {
  width: 100%;
  max-height: 480px;
}

.player-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .header {
    padding: 14px;
  }
  .main-container {
    padding: 14px;
  }
  .search-input {
    width: 100%;
  }
  .file-grid {
    grid-template-columns: 1fr;
  }
}
`
  },
  {
    path: 'web/app.js',
    name: 'app.js',
    language: 'javascript',
    category: 'web',
    description: 'کلاینت جاوااسکریپت خالص برای تعامل با سرور، ناوبری D-Pad ریموت تلویزیون، تولید لینک عمیق vlc:// و استریم بدون واسطه.',
    content: `/**
 * Android TV Media Server - Client Controller
 * Pure Vanilla JS with zero external dependencies
 */

let state = {
  currentStorage: null,
  currentPath: '',
  storages: [],
  items: [],
  serverIp: window.location.hostname,
  serverPort: window.location.port || '8080',
};

// Elements
const serverNameEl = document.getElementById('serverName');
const tvIpDisplay = document.getElementById('tvIpDisplay');
const storageListEl = document.getElementById('storageList');
const fileListEl = document.getElementById('fileList');
const breadcrumbsEl = document.getElementById('breadcrumbs');
const searchInput = document.getElementById('searchInput');
const btnRefresh = document.getElementById('btnRefresh');

const vlcModal = document.getElementById('vlcModal');
const btnVlcGuide = document.getElementById('btnVlcGuide');
const btnCloseVlc = document.getElementById('btnCloseVlc');
const vlcServerUrl = document.getElementById('vlcServerUrl');
const btnCopyUrl = document.getElementById('btnCopyUrl');

const playerModal = document.getElementById('playerModal');
const btnClosePlayer = document.getElementById('btnClosePlayer');
const htmlVideoPlayer = document.getElementById('htmlVideoPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerVlcDirect = document.getElementById('playerVlcDirect');
const playerCopyStream = document.getElementById('playerCopyStream');

// Format Bytes
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Fetch Server Status
async function loadServerStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.server_name) serverNameEl.textContent = data.server_name;
    if (data.primary_ip) {
      state.serverIp = data.primary_ip;
      tvIpDisplay.textContent = \`\${data.primary_ip}:\${data.port}\`;
      vlcServerUrl.value = \`http://\${data.primary_ip}:\${data.port}\`;
    }
  } catch (err) {
    console.warn('Status fetch fallback:', err);
    tvIpDisplay.textContent = \`\${window.location.hostname}:\${state.serverPort}\`;
    vlcServerUrl.value = window.location.origin;
  }
}

// Fetch Storage List
async function loadStorages() {
  try {
    const res = await fetch('/api/storages');
    const storages = await res.json();
    state.storages = storages;
    renderStorages(storages);

    if (storages.length > 0 && !state.currentStorage) {
      selectStorage(storages[0].id);
    }
  } catch (err) {
    storageListEl.innerHTML = '<div class="empty-state">خطا در دریافت حافظه‌ها</div>';
  }
}

// Render Storages
function renderStorages(storages) {
  storageListEl.innerHTML = '';
  storages.forEach(s => {
    const card = document.createElement('div');
    card.className = \`storage-card focusable \${state.currentStorage === s.id ? 'active' : ''}\`;
    card.tabIndex = 0;
    
    const icon = s.type === 'usb' ? '🔌' : s.type === 'sdcard' ? '💽' : '📺';
    const usedBytes = s.total_space > 0 ? (s.total_space - s.free_space) : 0;
    const usedPercent = s.total_space > 0 ? Math.round((usedBytes / s.total_space) * 100) : 0;

    card.innerHTML = \`
      <div class="storage-card-header">
        <span class="storage-icon">\${icon}</span>
        <div>
          <div class="storage-title">\${s.name}</div>
          <div class="storage-type-badge">\${s.type.toUpperCase()} • \${s.is_read_only ? 'فقط خواندنی' : ''}</div>
        </div>
      </div>
      \${s.total_space > 0 ? \`
        <div class="usage-bar-bg">
          <div class="usage-bar-fill" style="width: \${usedPercent}%"></div>
        </div>
        <div class="usage-text">
          <span>آزاد: \${formatSize(s.free_space)}</span>
          <span>کل: \${formatSize(s.total_space)}</span>
        </div>
      \` : '<div class="usage-text"><span>آماده خواندن</span></div>'}
    \`;

    card.onclick = () => selectStorage(s.id);
    card.onkeydown = (e) => {
      if (e.key === 'Enter') selectStorage(s.id);
    };
    storageListEl.appendChild(card);
  });
}

// Select Storage
function selectStorage(storageId) {
  state.currentStorage = storageId;
  state.currentPath = '';
  renderStorages(state.storages);
  browseDirectory(storageId, '');
}

// Browse Directory
async function browseDirectory(storageId, relPath) {
  fileListEl.innerHTML = '<div class="empty-state"><span class="empty-icon">⏳</span><p>در حال بارگذاری فایل‌ها...</p></div>';
  updateBreadcrumbs(relPath);

  try {
    const url = \`/api/browse?storage=\${encodeURIComponent(storageId)}&path=\${encodeURIComponent(relPath)}\`;
    const res = await fetch(url);
    const data = await res.json();
    state.items = data.items || [];
    renderFiles(state.items);
  } catch (err) {
    fileListEl.innerHTML = '<div class="empty-state">خطا در خواندن فایل‌ها</div>';
  }
}

// Render Files
function renderFiles(items) {
  const query = (searchInput.value || '').trim().toLowerCase();
  const filtered = items.filter(it => it.name.toLowerCase().includes(query));

  fileListEl.innerHTML = '';
  if (filtered.length === 0) {
    fileListEl.innerHTML = '<div class="empty-state"><span class="empty-icon">🔍</span><p>هیچ فایلی یافت نشد.</p></div>';
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'file-card focusable';
    card.tabIndex = 0;

    let icon = '📄';
    if (item.is_dir) icon = '📁';
    else if (item.category === 'video') icon = '🎬';
    else if (item.category === 'audio') icon = '🎵';
    else if (item.category === 'image') icon = '🖼️';

    const streamUrl = \`http://\${state.serverIp}:\${state.serverPort}/media/\${item.storage_id}/\${encodeURIComponent(item.relative_path)}\`;
    const vlcSchemeUrl = \`vlc://\${streamUrl}\`;

    card.innerHTML = \`
      <div class="file-icon-box">\${icon}</div>
      <div class="file-info">
        <div class="file-name" title="\${item.name}">\${item.name}</div>
        <div class="file-meta">
          <span>\${item.is_dir ? 'پوشه' : (item.extension || '').toUpperCase()}</span>
          <span>\${item.is_dir ? '' : formatSize(item.size)}</span>
        </div>
      </div>
      <div class="file-actions">
        \${item.is_dir ? \`
          <button class="btn btn-secondary btn-open-folder focusable" tabindex="0">باز کردن 📂</button>
        \` : \`
          <button class="btn btn-accent btn-vlc focusable" title="پخش مستقیم در VLC" tabindex="0">VLC 🚀</button>
          \${item.category === 'video' || item.category === 'audio' ? \`
            <button class="btn btn-secondary btn-play-browser focusable" title="پخش در مرورگر" tabindex="0">پخش ▶️</button>
          \` : ''}
        \`}
      </div>
    \`;

    if (item.is_dir) {
      card.onclick = () => {
        state.currentPath = item.relative_path;
        browseDirectory(state.currentStorage, item.relative_path);
      };
      card.onkeydown = (e) => {
        if (e.key === 'Enter') {
          state.currentPath = item.relative_path;
          browseDirectory(state.currentStorage, item.relative_path);
        }
      };
    } else {
      const btnVlc = card.querySelector('.btn-vlc');
      if (btnVlc) {
        btnVlc.onclick = (e) => {
          e.stopPropagation();
          // Attempt deep link to VLC app or copy
          window.location.href = vlcSchemeUrl;
          setTimeout(() => {
            navigator.clipboard.writeText(streamUrl);
            alert('لینک مستقیم استریم کپی شد و در VLC باز شد:\\n' + streamUrl);
          }, 300);
        };
      }

      const btnPlay = card.querySelector('.btn-play-browser');
      if (btnPlay) {
        btnPlay.onclick = (e) => {
          e.stopPropagation();
          openPlayer(item, streamUrl, vlcSchemeUrl);
        };
      }
    }

    fileListEl.appendChild(card);
  });
}

// Update Breadcrumbs
function updateBreadcrumbs(relPath) {
  breadcrumbsEl.innerHTML = '';
  const rootCrumb = document.createElement('span');
  rootCrumb.className = 'crumb focusable';
  rootCrumb.tabIndex = 0;
  rootCrumb.textContent = 'ریشه حافظه 🏠';
  rootCrumb.onclick = () => {
    state.currentPath = '';
    browseDirectory(state.currentStorage, '');
  };
  breadcrumbsEl.appendChild(rootCrumb);

  if (relPath) {
    const parts = relPath.split('/');
    let accum = '';
    parts.forEach((p, idx) => {
      accum += (idx === 0 ? '' : '/') + p;
      const sep = document.createElement('span');
      sep.className = 'crumb-separator';
      sep.textContent = ' / ';
      breadcrumbsEl.appendChild(sep);

      const crumb = document.createElement('span');
      const isLast = idx === parts.length - 1;
      crumb.className = \`crumb \${isLast ? 'active' : 'focusable'}\`;
      if (!isLast) crumb.tabIndex = 0;
      crumb.textContent = p;
      const targetPath = accum;
      if (!isLast) {
        crumb.onclick = () => {
          state.currentPath = targetPath;
          browseDirectory(state.currentStorage, targetPath);
        };
      }
      breadcrumbsEl.appendChild(crumb);
    });
  }
}

// Open HTML5 Player Modal
function openPlayer(item, streamUrl, vlcUrl) {
  playerTitle.textContent = item.name;
  htmlVideoPlayer.src = streamUrl;
  playerVlcDirect.href = vlcUrl;
  playerCopyStream.onclick = () => {
    navigator.clipboard.writeText(streamUrl);
    alert('لینک استریم در کلیپ‌بورد کپی شد.');
  };
  playerModal.classList.add('active');
  htmlVideoPlayer.play().catch(() => {});
}

function closePlayer() {
  htmlVideoPlayer.pause();
  htmlVideoPlayer.src = '';
  playerModal.classList.remove('active');
}

// Modal Handlers
btnVlcGuide.onclick = () => vlcModal.classList.add('active');
btnCloseVlc.onclick = () => vlcModal.classList.remove('active');
btnCopyUrl.onclick = () => {
  navigator.clipboard.writeText(vlcServerUrl.value);
  btnCopyUrl.textContent = 'کپی شد! ✅';
  setTimeout(() => { btnCopyUrl.textContent = '📋 کپی آدرس'; }, 2000);
};

btnClosePlayer.onclick = closePlayer;

// Search & Refresh
searchInput.oninput = () => renderFiles(state.items);
btnRefresh.onclick = () => browseDirectory(state.currentStorage, state.currentPath);

// TV Remote D-Pad Navigation Listener
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Back' || e.key === 'Backspace') {
    if (playerModal.classList.contains('active')) {
      closePlayer();
      e.preventDefault();
    } else if (vlcModal.classList.contains('active')) {
      vlcModal.classList.remove('active');
      e.preventDefault();
    } else if (state.currentPath) {
      // Go up one directory
      const parts = state.currentPath.split('/');
      parts.pop();
      state.currentPath = parts.join('/');
      browseDirectory(state.currentStorage, state.currentPath);
      e.preventDefault();
    }
  }
});

// Init
window.addEventListener('DOMContentLoaded', () => {
  loadServerStatus();
  loadStorages();
});
`
  },
  {
    path: 'config/config.json',
    name: 'config.json',
    language: 'json',
    category: 'config',
    description: 'فایل تنظیمات سرور: نام، پورت، هاست، فعال‌سازی رمز عبور و افزودن مسیرهای دلخواه حافظه.',
    content: `{
  "server_name": "Android TV Media Server",
  "host": "0.0.0.0",
  "port": 8080,
  "auth_enabled": false,
  "username": "admin",
  "password": "",
  "custom_storages": []
}
`
  },
  {
    path: 'scripts/install.sh',
    name: 'install.sh',
    language: 'bash',
    category: 'scripts',
    description: 'اسکریپت خودکار نصب پکیج‌های پیش‌نیاز روی Termux و دریافت مجوز Storage بدون روت.',
    content: `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Android TV Media Server - Termux Installation Script
# Architecture: ARM / ARM64 Compatible (No root required)
# ==============================================================================

set -e

echo "========================================================"
echo "  🚀 شروع نصب Android TV Media Server روی Termux"
echo "========================================================"

# 1. بروزرسانی مخازن ترموکس
echo "[1/4] در حال بروزرسانی پکیج‌های Termux..."
pkg update -y && pkg upgrade -y

# 2. نصب پایتون و ابزارهای مورد نیاز
echo "[2/4] در حال نصب Python و Git..."
pkg install -y python git curl

# 3. دریافت دسترسی به فایل‌ها (Storage Permission)
echo "[3/4] بررسی مجوز دسترسی به حافظه (Storage Permission)..."
if [ ! -d "$HOME/storage" ]; then
    echo "  ⚠️ لطفاً پنجره مجوز Android TV را تأیید کنید (Allow Storage Permission)..."
    termux-setup-storage
    sleep 3
fi

# 4. آماده‌سازی مجوزهای اجرایی اسکریپت‌ها
echo "[4/4] تنظیم مجوز فایل‌های اجرایی..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x server/main.py 2>/dev/null || true

echo "========================================================"
echo "  ✅ نصب با موفقیت به پایان رسید!"
echo "  جهت اجرای سرور، دستور زیر را اجرا کنید:"
echo "     bash scripts/start.sh"
echo "========================================================"
`
  },
  {
    path: 'scripts/start.sh',
    name: 'start.sh',
    language: 'bash',
    category: 'scripts',
    description: 'اسکریپت اجرای سرور در پس‌زمینه (Background) به همراه ذخیره لاگ و نمایش IP تلویزیون.',
    content: `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Start Script for Android TV Media Server
# Runs in background using nohup, logs to server.log
# ==============================================================================

DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$DIR"

PID_FILE="$DIR/server.pid"
LOG_FILE="$DIR/server.log"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "⚠️ سرور در حال حاضر با PID $PID در حال اجراست!"
        echo "برای متوقف کردن از: bash scripts/stop.sh استفاده کنید."
        exit 1
    else
        rm -f "$PID_FILE"
    fi
fi

echo "🎬 در حال راه‌اندازی Android TV Media Server..."
nohup python3 server/main.py > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

sleep 1

if kill -0 "$NEW_PID" 2>/dev/null; then
    echo "========================================================"
    echo "  ✅ سرور با موفقیت در پس‌زمینه اجرا شد (PID: $NEW_PID)"
    echo "  📄 مشاهده لاگ زنده:"
    echo "     tail -f $LOG_FILE"
    echo "========================================================"
    # استخراج و نمایش IPها
    python3 -c "import socket; print('  🌐 آدرس‌های دسترسی:'); [print(f'     👉 http://{ip}:8080') for ip in socket.gethostbyname_ex(socket.gethostname())[2] if not ip.startswith('127.')]" 2>/dev/null || true
    echo "========================================================"
else
    echo "❌ خطا در اجرای سرور. لطفاً محتوای $LOG_FILE را بررسی کنید:"
    cat "$LOG_FILE"
fi
`
  },
  {
    path: 'scripts/stop.sh',
    name: 'stop.sh',
    language: 'bash',
    category: 'scripts',
    description: 'اسکریپت توقف تمیز و ایمن سرور با کشتن پروسه به کمک PID.',
    content: `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Stop Script for Android TV Media Server
# Gracefully stops the running server process
# ==============================================================================

DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
PID_FILE="$DIR/server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 در حال توقف سرور (PID: $PID)..."
        kill "$PID"
        sleep 1
        if kill -0 "$PID" 2>/dev/null; then
            kill -9 "$PID"
        fi
        echo "✅ سرور با موفقیت متوقف شد."
    else
        echo "⚠️ پروسه‌ای با PID $PID یافت نشد."
    fi
    rm -f "$PID_FILE"
else
    # Fallback search by process name
    PIDS=$(pgrep -f "server/main.py" || true)
    if [ -n "$PIDS" ]; then
        echo "🛑 متوقف‌سازی پروسه‌های سرور ($PIDS)..."
        kill $PIDS
        echo "✅ سرور متوقف شد."
    else
        echo "ℹ️ سرور در حال حاضر اجرا نیست."
    fi
fi
`
  },
  {
    path: 'scripts/restart.sh',
    name: 'restart.sh',
    language: 'bash',
    category: 'scripts',
    description: 'اسکریپت راه‌اندازی مجدد (Restart) تمیز سرور.',
    content: `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Restart Script for Android TV Media Server
# ==============================================================================

DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"

echo "🔄 در حال ری‌استارت سرور..."
bash "$DIR/scripts/stop.sh"
sleep 1
bash "$DIR/scripts/start.sh"
`
  },
  {
    path: 'scripts/boot.sh',
    name: 'boot.sh',
    language: 'bash',
    category: 'scripts',
    description: 'اسکریپت اجرای خودکار هنگام روشن شدن تلویزیون (Start on Boot) با افزونه Termux:Boot.',
    content: `#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Termux:Boot Auto-Start Script for Android TV Media Server
# Place this file in: ~/.termux/boot/media-server.sh
# Requires Termux:Boot add-on installed on Android TV
# ==============================================================================

# Wait for Android TV Wi-Fi / Network stack to initialize
sleep 10

PROJECT_DIR="$HOME/android-tv-vlc-server"

if [ -d "$PROJECT_DIR" ]; then
    bash "$PROJECT_DIR/scripts/start.sh"
fi
`
  },
  {
    path: 'install.sh',
    name: 'install.sh',
    language: 'bash',
    category: 'scripts',
    description: 'اسکریپت ورودی سریع ریشه پروژه جهت نصب با یک دستور.',
    content: `#!/data/data/com.termux/files/usr/bin/bash
# Quick Entry Installer
bash scripts/install.sh
`
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    category: 'doc',
    description: 'راهنمای جامع، مصور و گام‌به‌گام به زبان فارسی شامل تمام ۱۴ سرفصل الزامی و راهکارهای دور زدن محدودیت‌های USB بدون نیاز به روت.',
    content: `# 🎬 Android TV & Termux Local Media Server
## اشتراک‌گذاری و استریم فایلهای تلویزیون و USB به VLC گوشی روی شبکه محلی (LAN / Wi-Fi)

این پروژه یک **Local Media Server** اختصاصی، فوق‌العاده کم‌مصرف و مستقل است که روی **Android TV** (از طریق محیط امن **Termux**) اجرا می‌شود و امکان دسترسی و پخش سریع ویدئوها، موزیک‌ها و تصاویر موجود در حافظه داخلی تلویزیون و فلش‌ها/هاردهای اکسترنال متصل به USB را روی گوشی‌های متصل به همان شبکه محلی از طریق **VLC Media Player** یا مرورگر فراهم می‌آورد.

---

### 🌟 ویژگی‌های برجسته
- **سازگاری کامل با معماری ARM و ARM64**: بهینه‌سازی شده برای پردازنده‌های Amlogic, Realtek, MediaTek تلویزیون‌های هوشمند.
- **استریم با Range Request (HTTP 206 Partial Content)**: به VLC اجازه می‌دهد بلافاصله هر نقطه از فیلم (حتی فایل‌های سنگین 4K MKV) را جلو و عقب ببرد، بدون نیاز به دانلود کل فایل!
- **عدم مصرف اینترنت (۱۰۰٪ آفلاین)**: تمامی فایل‌ها با حداکثر سرعت شبکه Wi-Fi / LAN انتقال می‌یابند.
- **بدون Transcoding (مصرف پردازنده و رم نزدیک به صفر)**: تلویزیون فقط فایل را مستقیم می‌خواند و به سوکت می‌فرستد؛ بنابراین داغ نمی‌کند و افت فریم ندارد.
- **پشتیبانی از چندین USB همزمان**: شناسایی خودکار فلش‌ها و هاردها با نام و حجم مجزا.
- **کاملاً بدون نیاز به روت (No Root Needed)**.
- **رابط کاربری سازگار با ریموت تلویزیون (D-Pad Navigation)** و کامپیوتر/موبایل.

---

## 📑 فهرست راهنما (۱۴ بخش کامل)

### ۱. نصب Termux روی Android TV
برای نصب پایدار روی تلویزیون‌های هوشمند:
- **نکته بسیار مهم**: از نسخه موجود در Google Play Store استفاده **نکنید** (قدیمی و منسوخ است).
- نسخه رسمی و بروز را از **F-Droid** یا صفحه **GitHub Termux** دانلود کنید:
  - فایل APK با معماری \`arm64-v8a\` یا \`armeabi-v7a\` متناسب با پردازنده تلویزیون.
  - می‌توانید APK را روی فلش ریخته و با برنامه File Commander یا FX File Explorer روی تلویزیون نصب کنید.

### ۲. نصب وابستگی‌ها
پس از باز کردن Termux در تلویزیون، دستورات زیر را وارد کنید:
\`\`\`bash
pkg update -y && pkg upgrade -y
pkg install -y python git
\`\`\`
*(پروژه طوری طراحی شده که به هیچ کتابخانه کامپایلری حجیم خارجی نیاز ندارد و با پایتون استاندارد با نهایت سرعت کار می‌کند).*

### ۳. گرفتن مجوز دسترسی به حافظه (Storage Permission)
برای اینکه ترموکس بتواند به فایل‌های حافظه دسترسی داشته باشد، دستور زیر را در ترموکس بزنید:
\`\`\`bash
termux-setup-storage
\`\`\`
روی صفحه تلویزیون پیامی با عنوان **"Allow Termux to access photos, media, and files on your device?"** ظاهر می‌شود. گزینه **Allow** را با ریموت انتخاب کنید.
با این کار، پوشه \`~/storage/shared\` و پوشه‌های اکسترنال ساخته می‌شوند.

---

### ۴. اتصال فلش / هارد اکسترنال و نحوه عملکرد بدون روت
#### تحلیل محدودیت‌های Android TV و Scoped Storage:
1. در اندروید ۸ تا ۱۴، وقتی فلش یا هارد USB به تلویزیون وصل می‌شود، سیستم‌عامل اندروید آن را در مسیر:
   \`\`\`
   /storage/XXXX-XXXX
   \`\`\`
   (که در آن \`XXXX-XXXX\` شناسه Volume ID درایو است، مثلاً \`4F2A-18D9\`) مانت می‌کند.
2. با دستور \`termux-setup-storage\`، ترموکس به صورت خودکار به درایوهای خارجی دسترسی خواندن پیدا کرده و نمادهای میانبر در مسیر:
   \`\`\`
   ~/storage/external-1
   ~/storage/external-2
   \`\`\`
   ایجاد می‌کند.
3. سرور ما به صورت خودکار هر دو مسیر را اسکن کرده و تمام حافظه‌ها را در UI نمایش می‌دهد.
4. **چرا روت لازم نیست؟** روت تنها زمانی نیاز است که بخواهید درایوهای فرمت شده با فایل‌سیستم‌های اختصاصی لینوکس (مثل ext4 بدون ماژول هسته) را دستی مانت کنید یا مستقیماً سکتورهای خام دیسک را دستکاری کنید. برای خواندن فایل‌های ویدئویی و رسانه‌ای فرمت‌های FAT32, exFAT و NTFS که توسط سیستم‌عامل تلویزیون شناخته شده‌اند، دسترسی استاندارد خواندن کاملاً کافی و امن است.

---

### ۵. دانلود و اضافه کردن سرور
برای کلون کردن پروژه:
\`\`\`bash
git clone https://github.com/your-repo/android-tv-vlc-server.git
cd android-tv-vlc-server
bash scripts/install.sh
\`\`\`

---

### ۶. اجرای Server
برای اجرای سرور در پس‌زمینه (Background):
\`\`\`bash
bash scripts/start.sh
\`\`\`
برای اجرای در حالت تستی (پیش‌زمینه و مشاهده لاگ زنده):
\`\`\`bash
python3 server/main.py
\`\`\`

---

### ۷. پیدا کردن IP تلویزیون
هنگام اجرای سرور، برنامه به طور خودکار IP محلی تلویزیون را تشخیص داده و چاپ می‌کند. همچنین در تنظیمات تلویزیون:
- **Settings -> Network & Internet -> Wi-Fi Name -> IP Address**
مثال: \`192.168.1.100\`

سرور به صورت پیش‌فرض روی پورت \`8080\` آماده به کار است:
\`\`\`
http://192.168.1.100:8080
\`\`\`

---

### ۸. اتصال گوشی به همان Wi-Fi
مطمئن شوید گوشی موبایل شما به همان اکسس پوینت یا مودم وای‌فایی وصل است که تلویزیون به آن متصل است. نیازی به اتصال به اینترنت نیست؛ حتی یک روتر بدون اینترنت هم کار می‌کند.

---

### ۹. اتصال VLC گوشی به Server
دو راه آسان وجود دارد:
1. **روش مستقیم Web UI**:
   - در مرورگر گوشی آدرس \`http://192.168.1.100:8080\` را باز کنید.
   - پوشه‌ها و فیلم‌ها را مشاهده کنید.
   - کنار هر ویدیو روی دکمه **Open in VLC 🚀** بزنید تا مستقیم در VLC باز شود.
2. **روش دستی در VLC**:
   - برنامه VLC را در اندروید یا آیفون باز کنید.
   - به بخش **More -> New Stream (یا Network Stream)** بروید.
   - آدرس فایل را وارد کنید.

---

### ۱۰. باز کردن و Stream کردن فیلم (با Seek و Range Request)
آدرس فایل‌ها ساختاری منظم دارند:
\`\`\`
http://192.168.1.100:8080/media/<storage_id>/Movies/Movie.mkv
\`\`\`
چون سرور از هدر \`Accept-Ranges: bytes\` و وضعیت \`206 Partial Content\` پشتیبانی می‌کند:
- می‌توانید هر زمان نوار زمان VLC را جلو ببرید و در ۱ ثانیه ادامه فیلم را ببینید.
- فرمت‌های MKV, MP4, AVI, MOV, TS, MP3, FLAC بدون افت کیفیت و بدون فشار به پردازنده تلویزیون پخش می‌شوند.

---

### ۱۱. تنظیمات امنیتی
در فایل \`config/config.json\`:
\`\`\`json
{
  "server_name": "Android TV Media Server",
  "host": "0.0.0.0",
  "port": 8080,
  "auth_enabled": false,
  "username": "admin",
  "password": "MySecretPassword"
}
\`\`\`
- اگر \`auth_enabled\` را \`true\` کنید، از احراز هویت HTTP Basic Auth استفاده می‌شود.
- **جلوگیری از Path Traversal**: سرور اجازه خروج از دایرکتوری درایو تعریف شده را با \`os.path.realpath\` فیلتر می‌کند.
- سرور کاملاً **Read-Only** است و هیچ دستوری برای نوشتن، حذف یا تغییر فایل‌ها ندارد.

---

### ۱۲. رفع خطاهای رایج
- **خطای Permission Denied**:
  دوباره دستور \`termux-setup-storage\` را اجرا کنید و در تلویزیون تأیید کنید.
- **قطع شدن سرور هنگام خاموش شدن صفحه تلویزیون**:
  در تنظیمات اندروید تی‌وی به بخش Apps -> Termux -> Battery رفته و آن را روی **Unrestricted** (بدون محدودیت) قرار دهید. همچنین در ترموکس دستور:
  \`\`\`bash
  termux-wake-lock
  \`\`\`
  را بزنید تا CPU تلویزیون در حالت خواب سرور را نبندد.
- **خطای Port already in use**:
  پورت 8080 توسط برنامه دیگری اشغال شده است. در \`config/config.json\` پورت را به \`8090\` یا \`9000\` تغییر دهید.

---

### ۱۳. اجرای خودکار هنگام روشن شدن تلویزیون (Start on Boot)
با افزونه رایگان **Termux:Boot**:
1. برنامه **Termux:Boot** را نصب کنید و یک بار باز کنید تا مجوز خودکار بگیرد.
2. پوشه بوت را بسازید:
   \`\`\`bash
   mkdir -p ~/.termux/boot
   cp scripts/boot.sh ~/.termux/boot/media-server.sh
   chmod +x ~/.termux/boot/media-server.sh
   \`\`\`
با روشن شدن تلویزیون، سرور در پس‌زمینه به طور خودکار فعال خواهد شد!

---

### ۱۴. نحوه Stop و Restart کردن
- متوقف کردن:
  \`\`\`bash
  bash scripts/stop.sh
  \`\`\`
- راه‌اندازی مجدد:
  \`\`\`bash
  bash scripts/restart.sh
  \`\`\`
`
  }
];
