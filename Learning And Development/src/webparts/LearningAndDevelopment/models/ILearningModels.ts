export interface ILearningCollection {
  id: string;
  title: string;
  description: string;
  serverRelativeUrl: string;
  itemCount: number;
  createdDate: string;
  modifiedDate: string;
  bannerUrl?: string;
  category?: string;
  author?: string;
  isActive?: boolean;
}

export interface IVideoSession {
  id: string;
  title: string;
  sessionTitle?: string;
  speakerName?: string;
  description: string;
  serverRelativeUrl: string;
  fileName: string;
  fileExtension: string;
  thumbnailUrl: string;
  cardThumbnailUrl?: string;
  createdDate: string;
  year: string;
  month: string;
  fileSize: string;
  duration?: string;
  folderServerRelativeUrl: string;
  folderName: string;
}

export interface IUpcomingEventItem {
  id: string;
  title: string;
  eventDate: string;
  endDate?: string;
  eventUrl?: string;
  location?: string;
  isActive: boolean;
}

export interface IQuickLinkItem {
  id: string;
  title: string;
  url?: string;
  description?: string;
  target?: string;
}

export interface IFilterState {
  folderSearch: string;
  folderAlpha: string; // 'All' | 'A' | 'B' ... 'Z'
  folderSort: 'asc' | 'desc';
  sessionSearch: string;
  sessionYear: string; // 'All' | '2025' | '2026' etc
  sessionMonth: string; // 'All' | 'January' ... 'December' or '01'..'12'
  sessionSort: 'newest' | 'oldest' | 'title';
}

export interface ILearningStats {
  totalCollections: number;
  totalSessions: number;
}

export type ViewMode = 'collections' | 'sessions';
