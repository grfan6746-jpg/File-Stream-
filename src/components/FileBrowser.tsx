import React, { useState } from 'react';
import {
  Folder,
  Film,
  Music,
  Image,
  FileText,
  Play,
  Copy,
  FolderOpen,
  Search,
  ListMusic,
  Check,
  Tv,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { MediaFile, StorageDevice } from '../types';

interface FileBrowserProps {
  currentStorage: StorageDevice | undefined;
  files: MediaFile[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onPlayMedia: (file: MediaFile) => void;
  onOpenVlcForFile: (file: MediaFile) => void;
  serverIp: string;
  serverPort: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  currentStorage,
  files,
  currentPath,
  onNavigate,
  onPlayMedia,
  onOpenVlcForFile,
  serverIp,
  serverPort,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!currentStorage) {
    return (
      <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
        یک حافظه را در بالا انتخاب کنید.
      </div>
    );
  }

  // Filter items in current path
  const currentItems = files.filter((f) => {
    if (f.storageId !== currentStorage.id) return false;
    // Direct child of currentPath
    if (!currentPath) {
      // Root level
      return !f.relativePath.includes('/');
    } else {
      // Inside folder
      if (!f.relativePath.startsWith(currentPath + '/')) return false;
      const sub = f.relativePath.slice(currentPath.length + 1);
      return !sub.includes('/');
    }
  });

  const filteredItems = currentItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Breadcrumbs
  const pathParts = currentPath ? currentPath.split('/') : [];

  const handleCopyStreamUrl = (file: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `http://${serverIp}:${serverPort}/media/${file.storageId}/${encodeURIComponent(
      file.relativePath
    )}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleExportM3U = () => {
    const m3uLines = ['#EXTM3U'];
    currentItems
      .filter((f) => f.category === 'video' || f.category === 'audio')
      .forEach((f) => {
        const streamUrl = `http://${serverIp}:${serverPort}/media/${f.storageId}/${encodeURIComponent(
          f.relativePath
        )}`;
        m3uLines.push(`#EXTINF:-1,${f.name}`);
        m3uLines.push(streamUrl);
      });

    const blob = new Blob([m3uLines.join('\n')], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentStorage.id}-${currentPath || 'root'}-playlist.m3u`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Explorer Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-800">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm flex-wrap text-slate-300">
          <button
            onClick={() => onNavigate('')}
            className={`font-semibold px-2 py-1 rounded-md transition cursor-pointer ${
              !currentPath
                ? 'text-sky-400 bg-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            ریشه ({currentStorage.name})
          </button>

          {pathParts.map((part, idx) => {
            const isLast = idx === pathParts.length - 1;
            const subPath = pathParts.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={subPath}>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                <button
                  onClick={() => onNavigate(subPath)}
                  className={`px-2 py-1 rounded-md transition cursor-pointer font-medium ${
                    isLast
                      ? 'text-sky-400 bg-sky-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Actions: Search & M3U */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی فایل در این پوشه..."
              className="bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleExportM3U}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="دانلود پلی‌لیست M3U برای پخش یکجای این پوشه در VLC"
          >
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">خروجی پلی‌لیست VLC (.m3u)</span>
          </button>
        </div>
      </div>

      {/* File List Grid */}
      <div className="mt-4">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <FolderOpen className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="text-sm">هیچ فایلی در این مسیر یافت نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const streamUrl = `http://${serverIp}:${serverPort}/media/${item.storageId}/${encodeURIComponent(
                item.relativePath
              )}`;
              const isCopied = copiedUrl === streamUrl;

              return (
                <div
                  key={item.relativePath}
                  onClick={() => {
                    if (item.isDir) {
                      onNavigate(item.relativePath);
                    } else if (item.category === 'video' || item.category === 'audio') {
                      onPlayMedia(item);
                    }
                  }}
                  className={`group p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    item.isDir
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer'
                      : 'bg-slate-950/80 border-slate-800/90 hover:border-sky-500/40 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.isDir
                          ? 'bg-amber-500/10 text-amber-400'
                          : item.category === 'video'
                          ? 'bg-sky-500/10 text-sky-400'
                          : item.category === 'audio'
                          ? 'bg-purple-500/10 text-purple-400'
                          : item.category === 'image'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.isDir ? (
                        <Folder className="w-5 h-5 fill-current" />
                      ) : item.category === 'video' ? (
                        <Film className="w-5 h-5" />
                      ) : item.category === 'audio' ? (
                        <Music className="w-5 h-5" />
                      ) : item.category === 'image' ? (
                        <Image className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs sm:text-sm font-semibold text-slate-200 truncate dir-ltr text-right"
                        title={item.name}
                      >
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span>
                          {item.isDir
                            ? 'پوشه (Directory)'
                            : `${item.extension.toUpperCase().replace('.', '')} • ${formatBytes(
                                item.size
                              )}`}
                        </span>
                        <span>{item.modifiedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Files */}
                  {!item.isDir && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenVlcForFile(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition cursor-pointer"
                        title="پخش در اپلیکیشن VLC گوشی"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        VLC گوشی
                      </button>

                      <div className="flex items-center gap-1">
                        {(item.category === 'video' || item.category === 'audio') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayMedia(item);
                            }}
                            className="p-1.5 rounded-md text-sky-400 hover:bg-sky-500/10 transition cursor-pointer"
                            title="پخش آزمایشی در مرورگر"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleCopyStreamUrl(item, e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                          title="کپی لینک مستقیم Stream"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Open Folder indicator */}
                  {item.isDir && (
                    <div className="mt-2 text-right">
                      <span className="text-[11px] text-amber-400 font-medium group-hover:underline inline-flex items-center gap-1">
                        ورود به پوشه <ChevronLeft className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
