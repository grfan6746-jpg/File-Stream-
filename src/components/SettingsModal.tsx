import React, { useState } from 'react';
import { X, ShieldCheck, Save, Plus, Trash2, KeyRound, Server, HardDrive } from 'lucide-react';
import { ServerConfig, StorageDevice } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ServerConfig;
  onSaveConfig: (updated: ServerConfig) => void;
  onAddCustomStorage: (device: StorageDevice) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onAddCustomStorage,
}) => {
  const [form, setForm] = useState<ServerConfig>({ ...config });
  const [newStorageName, setNewStorageName] = useState('');
  const [newStoragePath, setNewStoragePath] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  const handleAddStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStorageName.trim() || !newStoragePath.trim()) return;

    const newDevice: StorageDevice = {
      id: `custom_${Date.now()}`,
      name: newStorageName.trim(),
      type: 'custom',
      path: newStoragePath.trim(),
      totalSpace: 128 * 1024 * 1024 * 1024,
      freeSpace: 85 * 1024 * 1024 * 1024,
      isMounted: true,
      isReadOnly: true,
    };

    onAddCustomStorage(newDevice);
    setNewStorageName('');
    setNewStoragePath('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-slate-100">
              تنظیمات سرور و امنیت (Server & Security Config)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs sm:text-sm">
          {/* Server Name */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">نام نمایشی سرور روی شبکه:</label>
            <input
              type="text"
              value={form.serverName}
              onChange={(e) => setForm({ ...form, serverName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Network IP & Port */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">
                IP تلویزیون (جهت شبیه‌سازی یا آدرس محلی):
              </label>
              <input
                type="text"
                value={form.detectedIp}
                onChange={(e) => setForm({ ...form, detectedIp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sky-300 dir-ltr text-left focus:outline-none focus:border-sky-500"
                placeholder="192.168.1.100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium block">پورت سرور (Port):</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 8080 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sky-300 dir-ltr text-left focus:outline-none focus:border-sky-500"
                placeholder="8080"
              />
            </div>
          </div>

          {/* Security & Password Protection */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">
                  رمز عبور امنیتی (HTTP Basic Auth)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.authEnabled}
                  onChange={(e) => setForm({ ...form, authEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {form.authEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs">نام کاربری (Username):</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs">رمز عبور (Password):</span>
                  <input
                    type="password"
                    value={form.password || ''}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    placeholder="رمز ورود..."
                  />
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              در حالت غیرفعال، تمامی دستگاه‌های متصل به وای‌فای داخلی می‌توانند بدون رمز فایل‌ها را در VLC پخش کنند.
            </p>
          </div>

          {/* Add Custom Storage Section */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200">
                افزودن مسیر حافظه دستی یا USB خاص
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newStorageName}
                onChange={(e) => setNewStorageName(e.target.value)}
                placeholder="نام (مثلاً: هارد اکسترنال فیلم‌ها)"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
              />
              <input
                type="text"
                value={newStoragePath}
                onChange={(e) => setNewStoragePath(e.target.value)}
                placeholder="مسیر (مثلاً: /storage/ABCD-1234)"
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-sky-300 font-mono dir-ltr text-left"
              />
            </div>
            <button
              onClick={handleAddStorage}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن این درایو به لیست
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            ذخیره تنظیمات
          </button>
        </div>
      </div>
    </div>
  );
};
