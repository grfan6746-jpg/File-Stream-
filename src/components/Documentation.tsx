import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Usb,
  ShieldCheck,
  Wifi,
  Play,
  Terminal,
  AlertTriangle,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface DocSection {
  id: number;
  title: string;
  icon: string;
  badge?: string;
  content: string;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 1,
    title: '۱. نصب Termux روی Android TV',
    icon: '📺',
    badge: 'مهم',
    content: `برای اجرای پایدار روی تلویزیون‌های هوشمند (Android TV / Google TV):
- **نکته حیاتی**: نسخه موجود در Google Play Store بسیار قدیمی و از کار افتاده است. هرگز آن را نصب نکنید!
- آخرین نسخه را از مخزن رسمی **F-Droid** یا **GitHub Releases** دانلود کنید.
- فایل APK با معماری **arm64-v8a** (برای تلویزیون‌های جدیدتر ۶۴ بیتی) یا **armeabi-v7a** (برای تلویزیون‌های ۳۲ بیتی قدیمی‌تر) را دریافت کنید.
- فایل را روی یک فلش مموری کپی کرده و با برنامه‌ای مثل File Commander روی تلویزیون نصب کنید.`
  },
  {
    id: 2,
    title: '۲. نصب وابستگی‌ها (Python و ابزارهای لازم)',
    icon: '⚡',
    content: `پس از باز کردن ترموکس با کیبورد یا ریموت تلویزیون، دستورات زیر را برای نصب پایتون وارد کنید:
\`\`\`bash
pkg update -y && pkg upgrade -y
pkg install -y python git curl
\`\`\`
پروژه ما به گونه‌ای طراحی شده که با پایتون استاندارد بدون نیاز به هیچ کامپایلر یا پکیج سنگین خارجی با حداکثر سرعت اجرا می‌شود و کمتر از ۳۰ مگابایت رم مصرف می‌کند.`
  },
  {
    id: 3,
    title: '۳. گرفتن مجوز دسترسی به فایل‌ها (Storage Permission)',
    icon: '🔐',
    badge: 'الزامی',
    content: `برای اینکه ترموکس به فایل‌های حافظه دسترسی خواندن پیدا کند:
\`\`\`bash
termux-setup-storage
\`\`\`
روی صفحه تلویزیون دیالوگ سیستمی **"Allow Termux to access photos, media, and files on your device?"** ظاهر می‌شود. با کلیک روی **Allow** مجوز را صادر کنید.`
  },
  {
    id: 4,
    title: '۴. اتصال فلش / هارد اکسترنال و نحوه عملکرد بدون نیاز به روت',
    icon: '🔌',
    badge: 'بدون روت (No Root)',
    content: `### بررسی تخصصی دسترسی به USB در Android TV بدون روت:
1. **مسیر پیش‌فرض اندروید**: هنگامی که فلش USB یا هارد اکسترنال به پورت USB تلویزیون وصل می‌شود، سیستم‌عامل اندروید آن را با شناسه Volume ID در مسیر زیر مانت می‌کند:
   \`\`\`
   /storage/XXXX-XXXX
   \`\`\`
   (به عنوان مثال: \`/storage/4F2A-18D9\`)
2. **پیوند‌های ترموکس**: با اجرای \`termux-setup-storage\`، پوشه‌ای به نام \`~/storage\` ایجاد می‌شود که به صورت خودکار حافظه‌های خارجی را با نام‌های:
   \`\`\`
   ~/storage/external-1
   ~/storage/external-2
   \`\`\`
   لینک می‌کند.
3. **سرور ما چگونه عمل می‌کند؟**
   کد پایتون سرور هم پوشه \`/storage/*\` و هم مسیرهای \`~/storage/external-*\` را اسکن کرده و تمام فلش‌ها و هاردهای متصل را با نام واقعی و حجم آزاد شناسایی می‌کند.
4. **آیا روت لازم است؟ خیر!**
   سیستم‌عامل‌های Android TV فرمت‌های استاندارد رسانه‌ای FAT32, exFAT و اکثر مواقع NTFS را پشتیبانی می‌کنند. تا زمانی که قصد تغییر ساختار پارتیشن‌ها یا نوشتن مستقیم روی سکتورهای خام را نداشته باشید و فقط فیلم/آهنگ/عکس را بخوانید، هیچ نیازی به روت وجود ندارد.`
  },
  {
    id: 5,
    title: '۵. دانلود و اضافه کردن سورس سرور به تلویزیون',
    icon: '📥',
    content: `کافیست دستور زیر را در محیط Termux تلویزیون کپی/پیست کنید:
\`\`\`bash
git clone https://github.com/your-repo/android-tv-vlc-server.git
cd android-tv-vlc-server
bash scripts/install.sh
\`\`\`
یا فایل ZIP پروژه را دانلود کرده و داخل پوشه خانگی ترموکس Extract کنید.`
  },
  {
    id: 6,
    title: '۶. اجرای Server (در پس‌زمینه یا تستی)',
    icon: '🚀',
    content: `برای اجرای دائمی در پس‌زمینه (Background):
\`\`\`bash
bash scripts/start.sh
\`\`\`
برای اجرای در پیش‌زمینه و مشاهده لاگ‌های زنده:
\`\`\`bash
python3 server/main.py
\`\`\`
پس از اجرا، پیام سبزرنگ وضعیت آنلاین و IP تلویزیون روی صفحه نمایش داده می‌شود.`
  },
  {
    id: 7,
    title: '۷. پیدا کردن IP تلویزیون',
    icon: '🌐',
    content: `سرور هنگام اجرا تمام IPهای شبکه محلی تلویزیون را روی صفحه چاپ می‌کند.
همچنین در تنظیمات تلویزیون می‌توانید بررسی کنید:
- **Settings ➔ Network & Internet ➔ Wi-Fi ➔ IP Address**
نمونه: \`192.168.1.100\`
پورت پیش‌فرض سرور \`8080\` است:
\`\`\`
http://192.168.1.100:8080
\`\`\``
  },
  {
    id: 8,
    title: '۸. اتصال گوشی به همان Wi-Fi',
    icon: '📶',
    content: `گوشی موبایل باید به همان مودم یا اکسس‌پوینت تلویزیون متصل باشد.
- نیازی به اینترنت فعال نیست؛ این پروژه ۱۰۰٪ آفلاین بر بستر LAN کار می‌کند.
- اگر مودم در دسترس نیست، می‌توانید هات‌اسپات (Hotspot) گوشی را روشن کرده و تلویزیون را به آن وصل کنید.`
  },
  {
    id: 9,
    title: '۹. اتصال VLC گوشی به سرور و فایل‌ها',
    icon: '📱',
    badge: 'ساده',
    content: `### دو روش سریع برای باز کردن در VLC:
1. **روش اول (توصیه شده - از طریق مرورگر گوشی)**:
   مرورگر گوشی را باز کنید و آدرس \`http://192.168.1.100:8080\` را وارد کنید. پوشه‌ها و فیلم‌ها را می‌بینید؛ کافیست روی دکمه **VLC 🚀** کنار هر فایل بزنید تا اپلیکیشن VLC خودکار بالا بیاید!
2. **روش دوم (مستقیم داخل اپ VLC)**:
   اپلیکیشن VLC for Android یا iOS را باز کنید ➔ وارد تب **More (بیشتر)** شوید ➔ گزینه **New Stream (جریان شبکه جدید)** را انتخاب کرده و آدرس فایل را وارد کنید:
   \`\`\`
   http://192.168.1.100:8080/media/usb_sandisk_64g/Movies/Inception.mkv
   \`\`\``
  },
  {
    id: 10,
    title: '۱۰. استریم و جلو/عقب زدن فیلم بدون نیاز به دانلود (HTTP Range 206)',
    icon: '🎬',
    badge: 'فوق سریع',
    content: `### راز سرعت بالا و روان بودن در VLC:
- این سرور از استاندارد **HTTP 206 Partial Content** و هدر **Accept-Ranges: bytes** پشتیبانی می‌کند.
- وقتی نوار زمان فیلم را در VLC جلو یا عقب می‌برید، VLC یک هدر مثلاً \`Range: bytes=104857600-\` می‌فرستد.
- سرور بدون اینکه فایل را از ابتدا بخواند یا آن را در حافظه رم لود کند، نشانگر فایل را دقیقاً به بایت درخواستی برده و با چانک‌های ۱۲۸ کیلوبایتی مستقیماً به کارت شبکه ارسال می‌کند.
- هیچ‌گونه ترنسکدینگ (Transcoding) انجام نمی‌شود، در نتیجه مصرف CPU تلویزیون زیر ۲٪ خواهد بود.`
  },
  {
    id: 11,
    title: '۱۱. تنظیمات امنیتی و محافظت در برابر نفوذ',
    icon: '🛡️',
    content: `1. **حالت فقط خواندنی (Read-Only)**: سرور تنها متدهای GET و HEAD را می‌پذیرد و هیچ متد حذف یا تغییری در آن وجود ندارد.
2. **جلوگیری از Path Traversal**: تمام درخواست‌ها با تابع \`os.path.realpath\` اعتبارسنجی می‌شوند تا هیچ کاربری نتواند با \`../../\` به فایل‌های سیستمی یا حساس اندروید دسترسی پیدا کند.
3. **رمز عبور اختیاری (Basic Auth)**: با ویرایش \`config/config.json\` و تغییر \`auth_enabled: true\` می‌توانید نام کاربری و رمز دلخواه تنظیم کنید.`
  },
  {
    id: 12,
    title: '۱۲. رفع خطاهای رایج (Troubleshooting)',
    icon: '🛠️',
    content: `### ۱. قطع شدن سرور بعد از خاموش شدن صفحه تلویزیون:
تلویزیون‌های اندرویدی برای ذخیره انرژی پردازش‌های پس‌زمینه را متوقف می‌کنند. برای جلوگیری از این موضوع:
دستور زیر را در ترموکس بزنید:
\`\`\`bash
termux-wake-lock
\`\`\`
همچنین در تنظیمات تلویزیون: Apps ➔ Termux ➔ Battery ➔ **Unrestricted (بدون محدودیت)**.

### ۲. خطای "Permission denied" برای دسترسی به حافظه:
دوباره دستور \`termux-setup-storage\` را بزنید و پیام اجازه را با ریموت تأیید کنید.

### ۳. خطای "Port already in use":
پورت 8080 توسط سرویس دیگری اشغال است. فایل \`config/config.json\` را با \`nano config/config.json\` باز کرده و مقدار پورت را به \`8090\` یا \`9000\` تغییر دهید.`
  },
  {
    id: 13,
    title: '۱۳. اجرای خودکار هنگام روشن شدن تلویزیون (Start on Boot)',
    icon: '🔄',
    content: `با استفاده از افزونه رسمی **Termux:Boot**:
1. برنامه Termux:Boot را از F-Droid نصب کنید.
2. اسکریپت بوت را در مسیر مربوطه قرار دهید:
\`\`\`bash
mkdir -p ~/.termux/boot
cp scripts/boot.sh ~/.termux/boot/media-server.sh
chmod +x ~/.termux/boot/media-server.sh
\`\`\`
از این به بعد به محض روشن شدن تلویزیون و بالا آمدن شبکه وای‌فای، سرور به طور خودکار شروع به کار خواهد کرد.`
  },
  {
    id: 14,
    title: '۱۴. نحوه متوقف کردن (Stop) و راه‌اندازی مجدد (Restart)',
    icon: '🛑',
    content: `برای متوقف کردن سرور:
\`\`\`bash
bash scripts/stop.sh
\`\`\`
برای راه‌اندازی مجدد (ری‌استارت):
\`\`\`bash
bash scripts/restart.sh
\`\`\`
برای مشاهده لاگ‌های در حال ثبت:
\`\`\`bash
tail -f server.log
\`\`\``
  }
];

export const Documentation: React.FC = () => {
  const [openSections, setOpenSections] = useState<number[]>([1, 4, 10]);

  const toggleSection = (id: number) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenSections(DOC_SECTIONS.map((s) => s.id));
  const collapseAll = () => setOpenSections([]);

  return (
    <div className="space-y-4">
      {/* Doc Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100">
              راهنمای جامع ۱۴ مرحله‌ای راه‌اندازی در Android TV و Termux
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              شامل تحلیل محدودیت‌های Scoped Storage، اتصال USB بدون روت و رفع باگ‌های قطع ارتباط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            باز کردن همه
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            بستن همه
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5">
        {DOC_SECTIONS.map((section) => {
          const isOpen = openSections.includes(section.id);
          return (
            <div
              key={section.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden transition-all shadow-md"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{section.icon}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-100">
                    {section.title}
                  </span>
                  {section.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                      {section.badge}
                    </span>
                  )}
                </div>

                <div className="text-slate-400">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 py-3.5 bg-slate-950/60 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-line dir-rtl">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
