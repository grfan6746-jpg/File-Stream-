import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StorageCards } from './components/StorageCards';
import { FileBrowser } from './components/FileBrowser';
import { ProjectViewer } from './components/ProjectViewer';
import { Documentation } from './components/Documentation';
import { VlcModal } from './components/VlcModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { SettingsModal } from './components/SettingsModal';
import { INITIAL_STORAGES, INITIAL_MEDIA_FILES } from './mockData';
import { StorageDevice, MediaFile, ServerConfig, ServerStatus } from './types';
import { PROJECT_FILES } from './projectTemplate';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'project' | 'docs' | 'settings'>('explorer');
  const [storages, setStorages] = useState<StorageDevice[]>(INITIAL_STORAGES);
  const [selectedStorageId, setSelectedStorageId] = useState<string>(INITIAL_STORAGES[1].id); // default to USB 1
  const [files, setFiles] = useState<MediaFile[]>(INITIAL_MEDIA_FILES);
  const [currentPath, setCurrentPath] = useState<string>('');

  // Modals state
  const [isVlcModalOpen, setIsVlcModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMediaForPlay, setSelectedMediaForPlay] = useState<MediaFile | null>(null);
  const [selectedMediaForVlc, setSelectedMediaForVlc] = useState<MediaFile | null>(null);

  // Server state
  const [config, setConfig] = useState<ServerConfig>({
    serverName: 'Android TV Media Server',
    host: '0.0.0.0',
    port: 8080,
    detectedIp: '192.168.1.105',
    authEnabled: false,
    username: 'admin',
    password: '',
    customStorages: [],
    maxChunkSizeKb: 128,
    allowPublicWan: false
  });

  const [status, setStatus] = useState<ServerStatus>({
    online: true,
    uptimeSeconds: 1420,
    activeStreams: 1,
    bytesServed: 2450000000,
    detectedIps: ['192.168.1.105', '192.168.1.200'],
    port: 8080,
    serverName: 'Android TV Media Server'
  });

  // Fetch live status from backend if available
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.primary_ip) {
          setConfig((prev) => ({
            ...prev,
            detectedIp: data.primary_ip,
            port: data.port || 8080,
            serverName: data.server_name || prev.serverName
          }));
          setStatus((prev) => ({
            ...prev,
            online: true,
            detectedIps: data.detected_ips || [data.primary_ip]
          }));
        }
      })
      .catch(() => {
        // Safe fallback in preview
      });
  }, []);

  const selectedStorage = storages.find((s) => s.id === selectedStorageId);

  // Handle ZIP download
  const handleDownloadZip = async () => {
    try {
      // First attempt backend zip route
      const res = await fetch('/api/download-zip');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'android-tv-vlc-server.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
    } catch (e) {
      console.warn('Backend zip endpoint fallback to client JSZip', e);
    }

    // Client-side fallback with JSZip
    const zip = new JSZip();
    for (const file of PROJECT_FILES) {
      zip.file(file.path, file.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'android-tv-vlc-server.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleOpenVlcForFile = (file: MediaFile) => {
    setSelectedMediaForVlc(file);
    setIsVlcModalOpen(true);
  };

  const handleOpenGeneralVlc = () => {
    setSelectedMediaForVlc(null);
    setIsVlcModalOpen(true);
  };

  const handleAddCustomStorage = (newDevice: StorageDevice) => {
    setStorages((prev) => [...prev, newDevice]);
    setSelectedStorageId(newDevice.id);
    setCurrentPath('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/20 selection:text-sky-300 font-sans">
      {/* Header Bar */}
      <Header
        status={status}
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVlcModal={handleOpenGeneralVlc}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownloadZip={handleDownloadZip}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Tab 1: Live Explorer */}
        {activeTab === 'explorer' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Storage Cards (Internal, USB 1, USB 2) */}
            <StorageCards
              storages={storages}
              selectedStorageId={selectedStorageId}
              onSelectStorage={(id) => {
                setSelectedStorageId(id);
                setCurrentPath('');
              }}
              onAddStorage={() => setIsSettingsOpen(true)}
            />

            {/* File Explorer */}
            <FileBrowser
              currentStorage={selectedStorage}
              files={files}
              currentPath={currentPath}
              onNavigate={(path) => setCurrentPath(path)}
              onPlayMedia={(file) => setSelectedMediaForPlay(file)}
              onOpenVlcForFile={handleOpenVlcForFile}
              serverIp={config.detectedIp}
              serverPort={config.port}
            />
          </div>
        )}

        {/* Tab 2: Project Files for Termux */}
        {activeTab === 'project' && (
          <div className="animate-in fade-in duration-200">
            <ProjectViewer onDownloadZip={handleDownloadZip} />
          </div>
        )}

        {/* Tab 3: Complete 14-Step Documentation */}
        {activeTab === 'docs' && (
          <div className="animate-in fade-in duration-200">
            <Documentation />
          </div>
        )}

        {/* Tab 4: Settings & Security */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-100">تنظیمات سرور محلی و امنیت</h2>
                <p className="text-xs text-slate-400 mt-1">
                  پیکربندی پورت گوش دادن (Listen Port)، رمز عبور شبکه محلی و مدیریت حافظه‌های متصل
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">نام سرور:</label>
                  <input
                    type="text"
                    value={config.serverName}
                    onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">IP تلویزیون:</label>
                    <input
                      type="text"
                      value={config.detectedIp}
                      onChange={(e) => setConfig({ ...config, detectedIp: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sky-300 dir-ltr text-left"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">پورت (Port):</label>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 8080 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-sky-300 dir-ltr text-left"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">احراز هویت رمز عبور (Basic Auth)</span>
                    <input
                      type="checkbox"
                      checked={config.authEnabled}
                      onChange={(e) => setConfig({ ...config, authEnabled: e.target.checked })}
                      className="rounded text-sky-500"
                    />
                  </div>
                  {config.authEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="نام کاربری"
                        value={config.username}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="password"
                        placeholder="رمز عبور"
                        value={config.password || ''}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => alert('تنظیمات در حافظه سرور ذخیره شد.')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition cursor-pointer"
                >
                  ذخیره تنظیمات
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <VlcModal
        isOpen={isVlcModalOpen}
        onClose={() => setIsVlcModalOpen(false)}
        selectedFile={selectedMediaForVlc}
        serverIp={config.detectedIp}
        serverPort={config.port}
      />

      <MediaPlayerModal
        isOpen={!!selectedMediaForPlay}
        onClose={() => setSelectedMediaForPlay(null)}
        file={selectedMediaForPlay}
        serverIp={config.detectedIp}
        serverPort={config.port}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(updated) => setConfig(updated)}
        onAddCustomStorage={handleAddCustomStorage}
      />
    </div>
  );
}
