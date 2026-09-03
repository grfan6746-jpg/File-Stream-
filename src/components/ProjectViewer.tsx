import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  Download,
  Copy,
  Check,
  Terminal,
  FileText,
  Settings,
  Layers
} from 'lucide-react';
import { PROJECT_FILES } from '../projectTemplate';
import { ProjectFile } from '../types';

interface ProjectViewerProps {
  onDownloadZip: () => void;
}

export const ProjectViewer: React.FC<ProjectViewerProps> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const oneLinerCommand = `curl -sL ${origin}/install.sh | bash`;
  const stepByStepCommand = `pkg install -y python curl unzip && termux-setup-storage && curl -sL ${origin}/api/download-zip -o server.zip && unzip -o server.zip && python3 server/main.py`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySpecific = (cmd: string, key: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(key);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Troubleshooting Warning & Quick Fix */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <span>⚠️</span>
          <span>راهنمای رفع خطای: "python3: can't open file 'server/main.py': No such file or directory"</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs">
          ترموکس به صورت پیش‌فرض خالی است و هنوز فایل‌های سرور روی حافظه تلویزیون دانلود یا کپی نشده‌اند. برای رفع این موضوع و اجرای فوری سرور، یکی از دستورات زیر را در محیط ترموکس کپی و اجرا کنید:
        </p>
      </div>

      {/* Quick Terminal Command Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>دستور تک‌خطی خودکار جهت دانلود و اجرای فوری در ترموکس</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-normal">توصیه شده</span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1 dir-ltr text-right select-all bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
              {oneLinerCommand}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleCopySpecific(oneLinerCommand, 'oneliner')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copiedCommand === 'oneliner' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCommand === 'oneliner' ? 'کپی شد!' : 'کپی دستور خودکار'}
          </button>
          <button
            onClick={onDownloadZip}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            دانلود کل پروژه (ZIP)
          </button>
        </div>
      </div>

      {/* Explorer + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / File Tree */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              ساختار فایل‌های پروژه Termux
            </span>
            <span className="text-[11px] text-slate-500">
              {PROJECT_FILES.length} فایل آماده اجرا
            </span>
          </div>

          <div className="space-y-1">
            {PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {file.category === 'server' ? (
                      <FileCode className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    ) : file.category === 'web' ? (
                      <FileCode className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    ) : file.category === 'scripts' ? (
                      <Terminal className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : file.category === 'config' ? (
                      <Settings className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="font-mono text-[11px] dir-ltr truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-600">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right / Code Preview */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header of viewer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-100 dir-ltr">
                    {selectedFile.path}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {selectedFile.language.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'کپی شد!' : 'کپی سورس کد'}
                </button>
                <button
                  onClick={handleDownloadSingleFile}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="دانلود این فایل"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  دانلود
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="mt-3 relative rounded-xl bg-slate-950 border border-slate-800/80 p-4 max-h-[560px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed dir-ltr text-left overflow-x-auto selection:bg-sky-500/30">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
