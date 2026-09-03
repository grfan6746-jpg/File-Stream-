import React from 'react';
import { HardDrive, Usb, Plus, ShieldCheck, Check } from 'lucide-react';
import { StorageDevice } from '../types';

interface StorageCardsProps {
  storages: StorageDevice[];
  selectedStorageId: string;
  onSelectStorage: (id: string) => void;
  onAddStorage: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const StorageCards: React.FC<StorageCardsProps> = ({
  storages,
  selectedStorageId,
  onSelectStorage,
  onAddStorage,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            حافظه‌ها و درایوهای متصل (Storage Devices)
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            فقط خواندنی (امن در برابر حذف)
          </span>
        </div>
        <button
          onClick={onAddStorage}
          className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن مسیر USB یا پوشه دستی
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {storages.map((storage) => {
          const isSelected = selectedStorageId === storage.id;
          const usedBytes = storage.totalSpace > 0 ? storage.totalSpace - storage.freeSpace : 0;
          const usedPercent =
            storage.totalSpace > 0 ? Math.round((usedBytes / storage.totalSpace) * 100) : 0;

          return (
            <div
              key={storage.id}
              onClick={() => onSelectStorage(storage.id)}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        storage.type === 'usb'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {storage.type === 'usb' ? (
                        <Usb className="w-5 h-5" />
                      ) : (
                        <HardDrive className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">
                        {storage.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 dir-ltr text-right">
                        {storage.path}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {storage.totalSpace > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          usedPercent > 90 ? 'bg-rose-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>فضای آزاد: {formatBytes(storage.freeSpace)}</span>
                      <span>کل: {formatBytes(storage.totalSpace)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  نوع:{' '}
                  <span className="text-slate-300 font-medium">
                    {storage.type === 'internal'
                      ? 'حافظه داخلی'
                      : storage.type === 'usb'
                      ? 'فلش / هارد اکسترنال'
                      : 'سفارشی'}
                  </span>
                </span>
                <span className="text-sky-400 font-medium">
                  {isSelected ? 'انتخاب شده' : 'کلیک جهت مرور'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
