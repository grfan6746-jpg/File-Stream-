import React, { useState } from 'react';
import { X, Play, Copy, Check, Smartphone, Film, Music, ShieldCheck, Zap } from 'lucide-react';
import { MediaFile } from '../types';

interface MediaPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: MediaFile | null;
  serverIp: string;
  serverPort: number;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  isOpen,
  onClose,
  file,
  serverIp,
  serverPort,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const streamUrl = `http://${serverIp}:${serverPort}/media/${file.storageId}/${encodeURIComponent(
    file.relativePath
  )}`;
  const vlcDeepLink = `vlc://${streamUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
              {file.category === 'video' ? (
                <Film className="w-5 h-5" />
              ) : (
                <Music className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate dir-ltr text-right">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>فرمت: {file.extension.toUpperCase().replace('.', '')}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  پشتیبانی از HTTP Range 206 Seeking
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Audio Player Stage */}
        <div className="mt-4 rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center min-h-[260px] max-h-[440px]">
          {file.category === 'video' ? (
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[440px] object-contain focus:outline-none"
            >
              مرورگر شما از تگ HTML5 video پشتیبانی نمی‌کند.
            </video>
          ) : (
            <div className="p-8 text-center space-y-4 w-full">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
                <Music className="w-8 h-8" />
              </div>
              <audio
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                controls
                className="w-full max-w-md mx-auto"
              />
            </div>
          )}
        </div>

        {/* Range Request & Zero-Transcoding Explanation Note */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>عدم بارگذاری پردازنده تلویزیون:</strong> فایل‌ها مستقیماً بدون ترنسکد با بایت‌استریم ارسال می‌شوند.
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[11px] dir-ltr">
            Status: 206 Partial Content
          </span>
        </div>

        {/* Direct Link & Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              readOnly
              value={streamUrl}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-sky-300 dir-ltr text-left select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'کپی شد!' : 'کپی لینک'}
            </button>
          </div>

          <a
            href={vlcDeepLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
          >
            <Smartphone className="w-4 h-4" />
            انتقال به VLC گوشی
          </a>
        </div>
      </div>
    </div>
  );
};
