import React, { useState } from 'react';
import { X, Play, Copy, Check, QrCode, Wifi, ExternalLink, Download, Smartphone } from 'lucide-react';
import { MediaFile } from '../types';
import { QRCodeCanvas } from './QRCodeCanvas';

interface VlcModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFile: MediaFile | null;
  serverIp: string;
  serverPort: number;
}

export const VlcModal: React.FC<VlcModalProps> = ({
  isOpen,
  onClose,
  selectedFile,
  serverIp,
  serverPort,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'details' | 'qr'>('details');

  if (!isOpen) return null;

  const baseUrl = `http://${serverIp}:${serverPort}`;
  const streamUrl = selectedFile
    ? `${baseUrl}/media/${selectedFile.storageId}/${encodeURIComponent(selectedFile.relativePath)}`
    : baseUrl;

  // VLC Deep link scheme
  const vlcDeepLink = `vlc://${streamUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPlaylist = () => {
    window.location.href = '/api/playlist.m3u';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                اتصال به VLC Media Player گوشی
              </h3>
              <p className="text-xs text-slate-400">
                پخش مستقیم روی گوشی با سرعت حداکثری شبکه محلی بدون نیاز به دانلود
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected File / Target URL */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {selectedFile ? 'آدرس مستقیم استریم فایل:' : 'آدرس سراسری سرور تلویزیون:'}
            </span>
            {selectedFile && (
              <span className="text-amber-400 font-semibold truncate max-w-[200px]">
                {selectedFile.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={streamUrl}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-sky-300 select-all focus:outline-none focus:border-sky-500 dir-ltr text-left"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'کپی شد!' : 'کپی'}
            </button>
          </div>
        </div>

        {/* Action Toggle: Instructions vs QR Code */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveView('details')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              activeView === 'details'
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            راهنمای ۴ مرحله‌ای VLC
          </button>
          <button
            onClick={() => setActiveView('qr')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeView === 'qr'
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            اسکن بارکد QR با گوشی
          </button>
        </div>

        {/* View 1: Step by Step Guide */}
        {activeView === 'details' ? (
          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                ۱
              </span>
              <div>
                <strong className="text-slate-200 block">اتصال به Wi-Fi یکسان:</strong>
                <p className="text-slate-400 mt-0.5">
                  گوشی و تلویزیون باید به یک مودم یا هات‌اسپات متصل باشند (اینترنت نیاز نیست).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                ۲
              </span>
              <div>
                <strong className="text-slate-200 block">باز کردن مستقیم در VLC:</strong>
                <p className="text-slate-400 mt-0.5">
                  اگر اپلیکیشن VLC روی گوشی شما نصب است، روی دکمه نارنجی زیر کلیک کنید تا خودکار باز شود.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                ۳
              </span>
              <div>
                <strong className="text-slate-200 block">روش دستی در VLC:</strong>
                <p className="text-slate-400 mt-0.5">
                  برنامه VLC را در گوشی باز کنید ➔ تب <strong>More</strong> ➔ گزینه{' '}
                  <strong>New Stream (جریان جدید)</strong> ➔ آدرس بالا را Paste کنید.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                ۴
              </span>
              <div>
                <strong className="text-slate-200 block">پشتیبانی از جلو/عقب زدن (Range 206):</strong>
                <p className="text-slate-400 mt-0.5">
                  سرور از پروتکل HTTP Range Request پشتیبانی می‌کند؛ نوار زمان فیلم را آزادانه به هر نقطه ببرید.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: QR Code */
          <div className="mt-4 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <QRCodeCanvas text={streamUrl} size={180} />
            <p className="text-xs text-slate-400 mt-3 text-center">
              دوربین گوشی متصل به وای‌فای را روی این کد بگیرید تا لینک مستقیم باز شود.
            </p>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleDownloadPlaylist}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            دریافت فایل پلی‌لیست (.m3u)
          </button>

          <a
            href={vlcDeepLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-md"
          >
            <Smartphone className="w-4 h-4" />
            اجرا در VLC گوشی (Launch App)
          </a>
        </div>
      </div>
    </div>
  );
};
