import React from 'react';
import { Tv, Wifi, Download, Play, BookOpen, Code2, Settings, ShieldCheck } from 'lucide-react';
import { ServerConfig, ServerStatus } from '../types';

interface HeaderProps {
  status: ServerStatus;
  config: ServerConfig;
  activeTab: 'explorer' | 'project' | 'docs' | 'settings';
  setActiveTab: (tab: 'explorer' | 'project' | 'docs' | 'settings') => void;
  onOpenVlcModal: () => void;
  onOpenSettings: () => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  config,
  activeTab,
  setActiveTab,
  onOpenVlcModal,
  onOpenSettings,
  onDownloadZip,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/20">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {config.serverName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {status.online ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                اشتراک‌گذاری و پخش بدون دانلود فایلهای تلویزیون و USB در VLC گوشی روی شبکه Wi-Fi / LAN
              </p>
            </div>
          </div>

          {/* Status Indicators & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* TV IP Banner */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Wifi className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400 font-medium">IP سرور تلویزیون:</span>
              <code className="text-sky-300 font-mono font-bold text-xs dir-ltr">
                {config.detectedIp}:{config.port}
              </code>
            </div>

            {/* VLC Button */}
            <button
              id="btn-vlc-header"
              onClick={onOpenVlcModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              اتصال به VLC گوشی
            </button>

            {/* Download Project ZIP */}
            <button
              id="btn-download-zip"
              onClick={onDownloadZip}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="دانلود فایل‌های کامل سرور برای Termux"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">دانلود سورس Termux (ZIP)</span>
            </button>

            {/* Settings */}
            <button
              id="btn-settings"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="تنظیمات پورت و IP"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/80 overflow-x-auto pb-1 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'explorer'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-4 h-4" />
            کاوشگر رسانه و تست پخش
          </button>

          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'project'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            فایل‌های کامل پروژه Termux
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            راهنمای جامع ۱۴ مرحله‌ای (بدون روت)
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            تنظیمات و امنیت
          </button>
        </div>
      </div>
    </header>
  );
};
