import { StorageDevice, MediaFile } from './types';

export const INITIAL_STORAGES: StorageDevice[] = [
  {
    id: 'internal',
    name: 'حافظه داخلی تلویزیون (Internal Storage)',
    type: 'internal',
    path: '/storage/emulated/0',
    totalSpace: 32 * 1024 * 1024 * 1024, // 32 GB
    freeSpace: 14.8 * 1024 * 1024 * 1024, // 14.8 GB
    isMounted: true,
    isReadOnly: true
  },
  {
    id: 'usb_sandisk_64g',
    name: 'فلش مموری SanDisk Ultra 64GB (USB 1)',
    type: 'usb',
    path: '/storage/4F2A-18D9',
    totalSpace: 64 * 1024 * 1024 * 1024,
    freeSpace: 22.4 * 1024 * 1024 * 1024,
    isMounted: true,
    isReadOnly: true
  },
  {
    id: 'usb_wd_elements_2tb',
    name: 'هارد اکسترنال WD Elements 2TB (USB 2)',
    type: 'usb',
    path: '/storage/9A81-22B4',
    totalSpace: 2000 * 1024 * 1024 * 1024,
    freeSpace: 680 * 1024 * 1024 * 1024,
    isMounted: true,
    isReadOnly: true
  }
];

export const INITIAL_MEDIA_FILES: MediaFile[] = [
  // USB 1: Movies & Series
  {
    name: 'Movies',
    path: '/storage/4F2A-18D9/Movies',
    relativePath: 'Movies',
    storageId: 'usb_sandisk_64g',
    isDir: true,
    size: 0,
    extension: '',
    mimeType: 'inode/directory',
    category: 'folder',
    modifiedTime: '2026-08-15 19:30'
  },
  {
    name: 'Inception.2010.1080p.BluRay.mkv',
    path: '/storage/4F2A-18D9/Movies/Inception.2010.1080p.BluRay.mkv',
    relativePath: 'Movies/Inception.2010.1080p.BluRay.mkv',
    storageId: 'usb_sandisk_64g',
    isDir: false,
    size: 3450 * 1024 * 1024, // 3.45 GB
    extension: '.mkv',
    mimeType: 'video/x-matroska',
    category: 'video',
    modifiedTime: '2026-08-10 14:20'
  },
  {
    name: 'Interstellar.2014.2160p.HDR.mp4',
    path: '/storage/4F2A-18D9/Movies/Interstellar.2014.2160p.HDR.mp4',
    relativePath: 'Movies/Interstellar.2014.2160p.HDR.mp4',
    storageId: 'usb_sandisk_64g',
    isDir: false,
    size: 8200 * 1024 * 1024, // 8.2 GB
    extension: '.mp4',
    mimeType: 'video/mp4',
    category: 'video',
    modifiedTime: '2026-08-12 11:15'
  },
  {
    name: 'Oppenheimer.2023.1080p.WEBRip.mkv',
    path: '/storage/4F2A-18D9/Movies/Oppenheimer.2023.1080p.WEBRip.mkv',
    relativePath: 'Movies/Oppenheimer.2023.1080p.WEBRip.mkv',
    storageId: 'usb_sandisk_64g',
    isDir: false,
    size: 2900 * 1024 * 1024,
    extension: '.mkv',
    mimeType: 'video/x-matroska',
    category: 'video',
    modifiedTime: '2026-08-14 22:45'
  },
  {
    name: 'Music',
    path: '/storage/4F2A-18D9/Music',
    relativePath: 'Music',
    storageId: 'usb_sandisk_64g',
    isDir: true,
    size: 0,
    extension: '',
    mimeType: 'inode/directory',
    category: 'folder',
    modifiedTime: '2026-08-20 09:10'
  },
  {
    name: 'Hans_Zimmer_Time_Live.flac',
    path: '/storage/4F2A-18D9/Music/Hans_Zimmer_Time_Live.flac',
    relativePath: 'Music/Hans_Zimmer_Time_Live.flac',
    storageId: 'usb_sandisk_64g',
    isDir: false,
    size: 45 * 1024 * 1024,
    extension: '.flac',
    mimeType: 'audio/flac',
    category: 'audio',
    modifiedTime: '2026-08-18 16:30'
  },
  {
    name: 'Shajarian_Rastan_Album.mp3',
    path: '/storage/4F2A-18D9/Music/Shajarian_Rastan_Album.mp3',
    relativePath: 'Music/Shajarian_Rastan_Album.mp3',
    storageId: 'usb_sandisk_64g',
    isDir: false,
    size: 18 * 1024 * 1024,
    extension: '.mp3',
    mimeType: 'audio/mpeg',
    category: 'audio',
    modifiedTime: '2026-08-19 18:05'
  },
  {
    name: 'Nature_4K_Sample.mp4',
    path: '/storage/4F2A-18D9/Nature_4K_Sample.mp4',
    relativePath: 'Nature_4K_Sample.mp4',
    storageId: 'usb_sandisk_64g',
    isDir: false,
    size: 120 * 1024 * 1024,
    extension: '.mp4',
    mimeType: 'video/mp4',
    category: 'video',
    modifiedTime: '2026-08-22 10:00'
  },

  // Internal Storage items
  {
    name: 'DCIM',
    path: '/storage/emulated/0/DCIM',
    relativePath: 'DCIM',
    storageId: 'internal',
    isDir: true,
    size: 0,
    extension: '',
    mimeType: 'inode/directory',
    category: 'folder',
    modifiedTime: '2026-08-25 12:00'
  },
  {
    name: 'TV_Screenshot_20260825.png',
    path: '/storage/emulated/0/DCIM/TV_Screenshot_20260825.png',
    relativePath: 'DCIM/TV_Screenshot_20260825.png',
    storageId: 'internal',
    isDir: false,
    size: 3.2 * 1024 * 1024,
    extension: '.png',
    mimeType: 'image/png',
    category: 'image',
    modifiedTime: '2026-08-25 12:02'
  },
  {
    name: 'Download',
    path: '/storage/emulated/0/Download',
    relativePath: 'Download',
    storageId: 'internal',
    isDir: true,
    size: 0,
    extension: '',
    mimeType: 'inode/directory',
    category: 'folder',
    modifiedTime: '2026-08-26 15:30'
  },
  {
    name: 'Tutorial_Video_AndroidTV.mp4',
    path: '/storage/emulated/0/Download/Tutorial_Video_AndroidTV.mp4',
    relativePath: 'Download/Tutorial_Video_AndroidTV.mp4',
    storageId: 'internal',
    isDir: false,
    size: 78 * 1024 * 1024,
    extension: '.mp4',
    mimeType: 'video/mp4',
    category: 'video',
    modifiedTime: '2026-08-26 15:35'
  },

  // USB 2: WD Elements 2TB
  {
    name: 'Family_Archive',
    path: '/storage/9A81-22B4/Family_Archive',
    relativePath: 'Family_Archive',
    storageId: 'usb_wd_elements_2tb',
    isDir: true,
    size: 0,
    extension: '',
    mimeType: 'inode/directory',
    category: 'folder',
    modifiedTime: '2026-08-01 10:00'
  },
  {
    name: 'Vacation_Summer_Trip.mov',
    path: '/storage/9A81-22B4/Family_Archive/Vacation_Summer_Trip.mov',
    relativePath: 'Family_Archive/Vacation_Summer_Trip.mov',
    storageId: 'usb_wd_elements_2tb',
    isDir: false,
    size: 1540 * 1024 * 1024,
    extension: '.mov',
    mimeType: 'video/quicktime',
    category: 'video',
    modifiedTime: '2026-08-01 10:45'
  },
  {
    name: 'Documentaries',
    path: '/storage/9A81-22B4/Documentaries',
    relativePath: 'Documentaries',
    storageId: 'usb_wd_elements_2tb',
    isDir: true,
    size: 0,
    extension: '',
    mimeType: 'inode/directory',
    category: 'folder',
    modifiedTime: '2026-08-05 14:00'
  },
  {
    name: 'Cosmos_Episode_1.mkv',
    path: '/storage/9A81-22B4/Documentaries/Cosmos_Episode_1.mkv',
    relativePath: 'Documentaries/Cosmos_Episode_1.mkv',
    storageId: 'usb_wd_elements_2tb',
    isDir: false,
    size: 1980 * 1024 * 1024,
    extension: '.mkv',
    mimeType: 'video/x-matroska',
    category: 'video',
    modifiedTime: '2026-08-05 14:40'
  }
];
