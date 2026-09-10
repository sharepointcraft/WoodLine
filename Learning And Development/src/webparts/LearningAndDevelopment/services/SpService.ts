import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { ILearningCollection, IVideoSession, ILearningStats, IUpcomingEventItem, IQuickLinkItem } from '../models/ILearningModels';

interface ISpFolderItem {
  Name?: string;
  FileLeafRef?: string;
  ServerRelativeUrl?: string;
  FileRef?: string;
  ItemCount?: number;
  ItemChildCount?: number;
  TimeCreated?: string;
  Created?: string;
  TimeLastModified?: string;
  Modified?: string;
  Active?: boolean | string | number | null;
  Title?: string;
  Description?: string;
  Comments?: string;
  Category?: string;
  Folder?: {
    Name?: string;
    ServerRelativeUrl?: string;
    ItemCount?: number;
  };
  ListItemAllFields?: {
    Title?: string;
    Description?: string;
    Comments?: string;
    OData__Comments?: string;
    Category?: string;
    Active?: boolean | string | number | null;
    OData_Active?: boolean | string | number | null;
  };
}

interface ISpFileItem {
  Name: string;
  ServerRelativeUrl: string;
  TimeCreated?: string;
  TimeLastModified?: string;
  Length?: number;
  ListItemAllFields?: {
    Title?: string;
    SessionTitle?: string;
    SpeakerName?: string;
    Description?: string;
    Comments?: string;
    [key: string]: unknown;
  };
}

interface ISpEventItem {
  Id?: number;
  Title?: string;
  EventDate?: string;
  EndDate?: string;
  EventUrl?: string | { Url?: string; Description?: string };
  EventURL?: string | { Url?: string; Description?: string };
  Location?: string;
  Active?: boolean | string | number | null;
}

export class SpService {
  private context: WebPartContext;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  /**
   * Retrieves top-level folders from the designated library (showing ONLY folders where Active Yes/No column is explicitly Yes / true, excluding null/undefined/false).
   */
  public async getTopLevelFolders(
    libraryTitle: string = 'Documents',
    useMock: boolean = false,
    allowedExtensions: string[] = ['mp4', 'mov', 'wmv', 'avi', 'webm', 'mkv', 'm4v']
  ): Promise<ILearningCollection[]> {
    if (libraryTitle !== undefined && libraryTitle.trim() === '') {
      return [];
    }

    let collections: ILearningCollection[] = [];

    if (useMock || this.isLocalEnvironment()) {
      collections = this.getMockCollections().filter((c) => c.isActive !== false);
    } else {
      try {
        const webUrl = this.context.pageContext.web.absoluteUrl;

        // Dynamically resolve the Document Library Display Title on this site
        const resolvedTitle = await this.getLibraryListTitle(webUrl, libraryTitle);

        // Method 1: Query List Items where FSObjType eq 1 (Folders) with $expand=Folder
        const itemsEndpoint = `${webUrl}/_api/web/lists/getByTitle('${encodeURIComponent(
          resolvedTitle
        )}')/items?$filter=FSObjType eq 1&$expand=Folder`;

        const response: SPHttpClientResponse = await this.context.spHttpClient.get(
          itemsEndpoint,
          SPHttpClient.configurations.v1
        );

        if (response.ok) {
          const data: { value?: ISpFolderItem[] } = await response.json();
          const rawItems: ISpFolderItem[] = data.value || [];

          const activeFolders = rawItems.filter((item) => {
            const folderName = item.FileLeafRef || item.Name || item.Folder?.Name || '';
            if (!folderName || folderName === 'Forms' || folderName.startsWith('_') || folderName.startsWith('.')) {
              return false;
            }
            return this.isFolderActive(item);
          });

          if (activeFolders.length > 0) {
            collections = activeFolders.map((f, index) => {
              const folderName = f.FileLeafRef || f.Name || f.Folder?.Name || `Folder ${index + 1}`;
              const serverUrl = f.FileRef || f.ServerRelativeUrl || f.Folder?.ServerRelativeUrl || '';
              const description =
                f.Description ||
                f.Comments ||
                `Collection of learning sessions for ${folderName}. Explore videos and training materials.`;

              return {
                id: serverUrl || `col-${index}`,
                title: f.Title || folderName,
                description: description,
                serverRelativeUrl: serverUrl,
                itemCount: 0,
                createdDate: this.formatDate(f.Created || f.TimeCreated || ''),
                modifiedDate: this.formatDate(f.Modified || f.TimeLastModified || ''),
                category: f.Category || this.getRandomCategory(folderName),
                bannerUrl: this.getCategoryBanner(folderName, index),
                author: 'L&D Team',
                isActive: true
              };
            });
          }
        }

        if (collections.length === 0) {
          collections = await this.getFoldersByFolderEndpoint(libraryTitle);
        }
      } catch (err) {
        console.warn('[L&D Portal] Method 1 list item query exception, falling back:', err);
        collections = await this.getFoldersByFolderEndpoint(libraryTitle);
      }
    }

    // Update itemCount to count ONLY video files (excluding PDFs & other non-video documents)
    const collectionsWithVideoCounts = await Promise.all(
      collections.map(async (col) => {
        try {
          const videoSessions = await this.getVideoSessionsInFolder(
            col.serverRelativeUrl,
            allowedExtensions,
            useMock
          );
          return {
            ...col,
            itemCount: videoSessions.length
          };
        } catch {
          return col;
        }
      })
    );

    return collectionsWithVideoCounts;
  }

  /**
   * Retrieves upcoming events from the configured SharePoint list (default 'UpcomingEvents').
   * Filters: Active = Yes, EventDate/EndDate >= Today, sorted by EventDate ascending.
   */
  public async getUpcomingEvents(
    listName: string = '',
    useMock: boolean = false
  ): Promise<IUpcomingEventItem[]> {
    if (!listName || !listName.trim()) {
      return [];
    }

    if (useMock || this.isLocalEnvironment()) {
      return this.getMockUpcomingEvents();
    }

    try {
      const webUrl = this.context.pageContext.web.absoluteUrl;
      const targetListName = listName.trim();

      // Pre-flight check: verify list exists without throwing a 404 (returns 200 OK with value: [])
      const checkEndpoint = `${webUrl}/_api/web/lists?$filter=Title eq '${encodeURIComponent(targetListName)}'&$select=Title`;
      const checkRes = await this.context.spHttpClient.get(checkEndpoint, SPHttpClient.configurations.v1);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.value || checkData.value.length === 0) {
          console.log(`[L&D Portal] List '${targetListName}' does not exist on site.`);
          return [];
        }
      }

      const endpoint = `${webUrl}/_api/web/lists/getByTitle('${encodeURIComponent(
        targetListName
      )}')/items?$select=Id,Title,EventDate,EndDate,EventURL,EventUrl,Location,Active&$orderby=EventDate asc`;

      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (!response.ok) {
        return [];
      }

      const data: { value?: ISpEventItem[] } = await response.json();
      const rawEvents: ISpEventItem[] = data.value || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validEvents = rawEvents.filter((evt) => {
        // Active check: Exclude if Active === false, 'No', 0, null, undefined
        if (
          evt.Active === false ||
          evt.Active === 'false' ||
          evt.Active === 'No' ||
          evt.Active === 0 ||
          evt.Active === null ||
          evt.Active === undefined
        ) {
          return false;
        }

        // Date check: EventDate >= Today or EndDate >= Today
        const start = evt.EventDate ? new Date(evt.EventDate) : undefined;
        const end = evt.EndDate ? new Date(evt.EndDate) : start;

        if (end && end.getTime() < today.getTime()) {
          return false; // Event has passed
        }

        return true;
      });

      // Sort by EventDate ascending
      validEvents.sort((a, b) => {
        const timeA = a.EventDate ? new Date(a.EventDate).getTime() : 0;
        const timeB = b.EventDate ? new Date(b.EventDate).getTime() : 0;
        return timeA - timeB;
      });

      return validEvents.map((evt) => {
        const rawUrl = evt.EventURL || evt.EventUrl;
        let urlStr: string | undefined;
        if (typeof rawUrl === 'string') {
          urlStr = rawUrl;
        } else if (rawUrl && typeof rawUrl === 'object' && rawUrl.Url) {
          urlStr = rawUrl.Url;
        }

        return {
          id: evt.Id ? evt.Id.toString() : Math.random().toString(),
          title: evt.Title || 'Upcoming Event',
          eventDate: evt.EventDate || new Date().toISOString(),
          endDate: evt.EndDate,
          eventUrl: urlStr,
          location: evt.Location,
          isActive: true
        };
      });
    } catch (err) {
      console.warn('[L&D Portal] Failed to fetch UpcomingEvents from SharePoint list:', err);
      return [];
    }
  }

  /**
   * Retrieves quick links from the configured SharePoint list.
   */
  public async getQuickLinks(
    listName: string = '',
    useMock: boolean = false
  ): Promise<IQuickLinkItem[]> {
    if (!listName || !listName.trim()) {
      return [];
    }
    if (useMock || this.isLocalEnvironment()) {
      return [];
    }

    try {
      const webUrl = this.context.pageContext.web.absoluteUrl;
      const targetListName = listName.trim();

      // Pre-flight check: verify list exists without throwing a 404 (returns 200 OK with value: [])
      const checkEndpoint = `${webUrl}/_api/web/lists?$filter=Title eq '${encodeURIComponent(targetListName)}'&$select=Title`;
      const checkRes = await this.context.spHttpClient.get(checkEndpoint, SPHttpClient.configurations.v1);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.value || checkData.value.length === 0) {
          console.log(`[L&D Portal] QuickLinks List '${targetListName}' does not exist on site.`);
          return [];
        }
      }

      const endpoint = `${webUrl}/_api/web/lists/getByTitle('${encodeURIComponent(
        targetListName
      )}')/items?$select=Id,Title,URL,Url,LinkUrl,Description,Active`;

      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (!response.ok) {
        return [];
      }

      const data: { value?: any[] } = await response.json();
      const rawItems: any[] = data.value || [];

      return rawItems
        .filter((item) => {
          if (
            item.Active === false ||
            item.Active === 'false' ||
            item.Active === 'No' ||
            item.Active === 0 ||
            item.Active === null ||
            item.Active === undefined
          ) {
            return false;
          }
          return true;
        })
        .map((item, index) => {
          const rawUrl = item.URL || item.Url || item.LinkUrl;
          let urlStr = '#';
          if (typeof rawUrl === 'string') {
            urlStr = rawUrl;
          } else if (rawUrl && typeof rawUrl === 'object' && rawUrl.Url) {
            urlStr = rawUrl.Url;
          }

          return {
            id: item.Id ? item.Id.toString() : `ql-${index}`,
            title: item.Title || 'Resource Link',
            url: urlStr,
            description: item.Description
          };
        });
    } catch (err) {
      console.warn('[L&D Portal] Failed to fetch QuickLinks from SharePoint list:', err);
      return [];
    }
  }

  /**
   * Dynamically resolves the Document Library Title on the current SharePoint site.
   */
  private async getLibraryListTitle(webUrl: string, configuredTitle: string): Promise<string> {
    // 1. Try configured title first
    try {
      const res = await this.context.spHttpClient.get(
        `${webUrl}/_api/web/lists/getByTitle('${encodeURIComponent(configuredTitle)}')?$select=Title`,
        SPHttpClient.configurations.v1
      );
      if (res.ok) {
        const data = await res.json();
        return data.Title || configuredTitle;
      }
    } catch (_err) {
      // Continue fallback
    }

    // 2. Try 'Documents'
    try {
      const res = await this.context.spHttpClient.get(
        `${webUrl}/_api/web/lists/getByTitle('Documents')?$select=Title`,
        SPHttpClient.configurations.v1
      );
      if (res.ok) {
        const data = await res.json();
        return data.Title || 'Documents';
      }
    } catch (_err) {
      // Continue fallback
    }

    // 3. Try 'Shared Documents'
    try {
      const res = await this.context.spHttpClient.get(
        `${webUrl}/_api/web/lists/getByTitle('Shared%20Documents')?$select=Title`,
        SPHttpClient.configurations.v1
      );
      if (res.ok) {
        const data = await res.json();
        return data.Title || 'Shared Documents';
      }
    } catch (_err) {
      // Continue fallback
    }

    // 4. Fallback: Query all Document Libraries on this site (BaseTemplate 101)
    try {
      const res = await this.context.spHttpClient.get(
        `${webUrl}/_api/web/lists?$filter=BaseTemplate eq 101 and Hidden eq false&$select=Title`,
        SPHttpClient.configurations.v1
      );
      if (res.ok) {
        const data = await res.json();
        if (data.value && data.value.length > 0) {
          return data.value[0].Title;
        }
      }
    } catch (_err) {
      // Continue fallback
    }

    return configuredTitle;
  }

  /**
   * Fallback Method 2: Query via Folder ServerRelativePath endpoint
   */
  private async getFoldersByFolderEndpoint(libraryTitle: string): Promise<ILearningCollection[]> {
    try {
      const webUrl = this.context.pageContext.web.absoluteUrl;
      const libraryUrl = this.getLibraryRelativeUrl(libraryTitle);

      const endpoint = `${webUrl}/_api/web/getFolderByServerRelativePath(decodedUrl='${encodeURIComponent(
        libraryUrl
      )}')/folders?$expand=ListItemAllFields`;

      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (!response.ok) {
        return this.getFoldersByListTitle(libraryTitle);
      }

      const data: { value?: ISpFolderItem[] } = await response.json();
      const rawFolders: ISpFolderItem[] = data.value || [];

      const validFolders = rawFolders.filter((f) => {
        const name = f.Name || '';
        if (name === 'Forms' || name.startsWith('_') || name.startsWith('.')) {
          return false;
        }
        return this.isFolderActive(f);
      });

      return validFolders.map((f, index) => {
        const itemFields = f.ListItemAllFields || {};
        const folderName = f.Name || `Folder ${index + 1}`;
        const description =
          itemFields.Description ||
          itemFields.Comments ||
          itemFields.OData__Comments ||
          `Collection of learning sessions for ${folderName}. Explore videos and training materials.`;

        return {
          id: f.ServerRelativeUrl || `col-${index}`,
          title: itemFields.Title || folderName,
          description: description,
          serverRelativeUrl: f.ServerRelativeUrl || '',
          itemCount: f.ItemCount || 0,
          createdDate: this.formatDate(f.TimeCreated || ''),
          modifiedDate: this.formatDate(f.TimeLastModified || ''),
          category: itemFields.Category || this.getRandomCategory(folderName),
          bannerUrl: this.getCategoryBanner(folderName, index),
          author: 'L&D Team',
          isActive: true
        };
      });
    } catch (err) {
      console.warn('[L&D Portal] Method 2 folder endpoint exception, falling back:', err);
      return this.getFoldersByListTitle(libraryTitle);
    }
  }

  /**
   * Fallback Method 3: Query folders via List Title rootFolder endpoint
   */
  private async getFoldersByListTitle(libraryTitle: string): Promise<ILearningCollection[]> {
    try {
      const webUrl = this.context.pageContext.web.absoluteUrl;
      const resolvedTitle = await this.getLibraryListTitle(webUrl, libraryTitle);

      const endpoint = `${webUrl}/_api/web/lists/getByTitle('${encodeURIComponent(
        resolvedTitle
      )}')/rootFolder/folders?$expand=ListItemAllFields`;

      const response = await this.context.spHttpClient.get(endpoint, SPHttpClient.configurations.v1);
      if (!response.ok) {
        return this.getMockCollections().filter((c) => c.isActive !== false);
      }

      const data: { value?: ISpFolderItem[] } = await response.json();
      const rawFolders = data.value || [];

      return rawFolders
        .filter((f) => {
          const name = f.Name || '';
          if (name === 'Forms' || name.startsWith('_') || name.startsWith('.')) {
            return false;
          }
          return this.isFolderActive(f);
        })
        .map((f, index) => ({
          id: f.ServerRelativeUrl || `col-${index}`,
          title: f.ListItemAllFields?.Title || f.Name || `Folder ${index + 1}`,
          description: f.ListItemAllFields?.Description || `Learning modules and video tutorials for ${f.Name}.`,
          serverRelativeUrl: f.ServerRelativeUrl || '',
          itemCount: f.ItemCount || 0,
          createdDate: this.formatDate(f.TimeCreated || ''),
          modifiedDate: this.formatDate(f.TimeLastModified || ''),
          category: this.getRandomCategory(f.Name || ''),
          bannerUrl: this.getCategoryBanner(f.Name || '', index),
          author: 'L&D Team',
          isActive: true
        }));
    } catch {
      return this.getMockCollections().filter((c) => c.isActive !== false);
    }
  }

  /**
   * Helper: Evaluates whether a folder item is Active (Yes) or Inactive (No/null/undefined) across all SharePoint Yes/No field formats.
   */
  private isFolderActive(item: ISpFolderItem): boolean {
    const fields = item.ListItemAllFields || {};

    const activeVal =
      item.Active !== undefined
        ? item.Active
        : fields.Active !== undefined
          ? fields.Active
          : fields.OData_Active !== undefined
            ? fields.OData_Active
            : undefined;

    const folderName = item.FileLeafRef || item.Name || item.Folder?.Name || 'Folder';
    console.log(`[L&D Portal] Checking Active column for folder "${folderName}":`, activeVal);

    // Rule: Exclude folder ONLY if Active column is explicitly false, "No", or 0!
    if (
      activeVal === false ||
      activeVal === 'false' ||
      activeVal === 'False' ||
      activeVal === 'No' ||
      activeVal === 'no' ||
      activeVal === 0 ||
      activeVal === '0'
    ) {
      return false; // Explicitly inactive
    }

    // Include folder by default if Active is Yes/true OR if the column is not present (undefined/null)
    return true;
  }

  /**
   * Retrieves all video files stored inside a specific folder.
   */
  public async getVideoSessionsInFolder(
    folderServerRelativeUrl: string,
    allowedExtensions: string[] = ['mp4', 'mov', 'wmv', 'avi', 'webm', 'mkv', 'm4v'],
    useMock: boolean = false
  ): Promise<IVideoSession[]> {
    if (useMock || this.isLocalEnvironment()) {
      return this.getMockSessionsForFolder(folderServerRelativeUrl);
    }

    try {
      const webUrl = this.context.pageContext.web.absoluteUrl;
      const endpoint = `${webUrl}/_api/web/getFolderByServerRelativePath(decodedUrl='${encodeURIComponent(
        folderServerRelativeUrl
      )}')/files?$expand=ListItemAllFields`;

      const response: SPHttpClientResponse = await this.context.spHttpClient.get(
        endpoint,
        SPHttpClient.configurations.v1
      );

      if (!response.ok) {
        return this.getMockSessionsForFolder(folderServerRelativeUrl);
      }

      const data: { value?: ISpFileItem[] } = await response.json();
      const rawFiles: ISpFileItem[] = data.value || [];

      const lowerAllowed = allowedExtensions.map((e) => e.toLowerCase());
      const videoFiles = rawFiles.filter((file) => {
        const ext = file.Name.split('.').pop()?.toLowerCase() || '';
        return lowerAllowed.indexOf(ext) !== -1;
      });

      return videoFiles.map((file, index) => {
        const itemFields = file.ListItemAllFields || {};
        const ext = file.Name.split('.').pop()?.toLowerCase() || 'mp4';
        const cleanTitle = itemFields.Title || file.Name.replace(/\.[^/.]+$/, '');
        const createdDate = file.TimeCreated || new Date().toISOString();
        const dateObj = new Date(createdDate);

        const folderName = folderServerRelativeUrl.split('/').pop() || 'Collection';

        return {
          id: file.ServerRelativeUrl || `vid-${index}`,
          title: cleanTitle,
          // These custom library fields are intentionally optional: every video is
          // returned even when either field is blank.
          sessionTitle: this.getTextField(itemFields, 'SessionTitle'),
          speakerName: this.getTextField(itemFields, 'SpeakerName'),
          description:
            itemFields.Description ||
            itemFields.Comments ||
            `Interactive video training session covering ${cleanTitle}. Watch to master key concepts.`,
          serverRelativeUrl: file.ServerRelativeUrl,
          fileName: file.Name,
          fileExtension: ext.toUpperCase(),
          thumbnailUrl: `${webUrl}/_layouts/15/getpreview.ashx?path=${encodeURIComponent(
            file.ServerRelativeUrl
          )}&resolution=3`,
          cardThumbnailUrl: this.getThumbnailUrl(itemFields.Thumbnail, webUrl),
          createdDate: this.formatDate(createdDate),
          year: dateObj.getFullYear().toString(),
          month: dateObj.toLocaleString('default', { month: 'long' }),
          fileSize: this.formatBytes(file.Length || 0),
          duration: this.extractDurationFromItem(itemFields),
          folderServerRelativeUrl: folderServerRelativeUrl,
          folderName: folderName
        };
      });
    } catch {
      return this.getMockSessionsForFolder(folderServerRelativeUrl);
    }
  }

  /** Returns a trimmed custom library field value, or an empty string when blank. */
  private getTextField(itemFields: { [key: string]: unknown }, fieldName: string): string {
    const value = itemFields[fieldName];
    return typeof value === 'string' ? value.trim() : '';
  }

  /** Gets an image URL from the custom SharePoint Thumbnail field. */
  private getThumbnailUrl(value: unknown, webUrl: string): string {
    let imageValue: unknown = value;

    if (typeof imageValue === 'string') {
      const trimmedValue = imageValue.trim();
      if (!trimmedValue) return '';
      try {
        imageValue = JSON.parse(trimmedValue) as unknown;
      } catch {
        return this.toAbsoluteImageUrl(trimmedValue, webUrl);
      }
    }

    if (!imageValue || typeof imageValue !== 'object') return '';

    const image = imageValue as {
      Url?: unknown;
      url?: unknown;
      serverUrl?: unknown;
      serverRelativeUrl?: unknown;
    };
    const directUrl = typeof image.Url === 'string' ? image.Url : image.url;
    if (typeof directUrl === 'string') return this.toAbsoluteImageUrl(directUrl, webUrl);

    if (typeof image.serverRelativeUrl === 'string') {
      const serverUrl = typeof image.serverUrl === 'string' ? image.serverUrl.replace(/\/$/, '') : webUrl;
      return this.toAbsoluteImageUrl(`${serverUrl}${image.serverRelativeUrl}`, webUrl);
    }

    return '';
  }

  /** Allows only absolute HTTP(S) or site-relative image URLs. */
  private toAbsoluteImageUrl(url: string, webUrl: string): string {
    const trimmedUrl = url.trim();
    if (trimmedUrl.indexOf('/') === 0 && trimmedUrl.indexOf('//') !== 0) {
      return `${new URL(webUrl).origin}${trimmedUrl}`;
    }
    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : '';
  }


  /**
   * Helper: Formats total seconds into mm:ss or h:mm:ss format
   */
  private formatDurationSeconds(seconds: number): string {
    if (isNaN(seconds) || seconds <= 0) return '';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Helper: Extracts actual media duration from SharePoint list item fields if present
   */
  private extractDurationFromItem(itemFields: any): string {
    if (!itemFields) return '';
    const directSeconds = itemFields.MediaLengthInSeconds || itemFields.VideoDuration || itemFields.Duration;
    if (directSeconds && !isNaN(Number(directSeconds))) {
      return this.formatDurationSeconds(Number(directSeconds));
    }
    if (itemFields.MediaServiceMetadata) {
      try {
        const meta = typeof itemFields.MediaServiceMetadata === 'string'
          ? JSON.parse(itemFields.MediaServiceMetadata)
          : itemFields.MediaServiceMetadata;
        if (meta && meta.mediaDuration && !isNaN(Number(meta.mediaDuration))) {
          return this.formatDurationSeconds(Number(meta.mediaDuration));
        }
      } catch {
        // Ignore JSON parse error
      }
    }
    return '';
  }

  /**
   * Retrieves overall learning library statistics across ALL active folders in the library.
   */
  public async getLibraryStats(
    libraryTitle: string = 'Documents',
    useMock: boolean = false,
    allowedExtensions: string[] = ['mp4', 'mov', 'wmv', 'avi', 'webm', 'mkv', 'm4v']
  ): Promise<ILearningStats> {
    const collections = await this.getTopLevelFolders(libraryTitle, useMock, allowedExtensions);

    let totalSessionsSum = 0;
    for (const col of collections) {
      totalSessionsSum += col.itemCount;
    }

    return {
      totalCollections: collections.length,
      totalSessions: totalSessionsSum
    };
  }

  // --- Helper Methods ---

  private isLocalEnvironment(): boolean {
    return (
      !this.context ||
      !this.context.pageContext ||
      !this.context.pageContext.web ||
      this.context.pageContext.web.absoluteUrl.indexOf('localhost') > -1
    );
  }

  private getLibraryRelativeUrl(libraryTitle: string): string {
    const serverRelUrl = this.context?.pageContext?.web?.serverRelativeUrl || '';
    const cleanTitle = libraryTitle === 'Documents' ? 'Shared Documents' : libraryTitle;
    return `${serverRelUrl}/${cleanTitle}`.replace(/\/+/g, '/');
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  private formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private getRandomCategory(folderName: string): string {
    const lower = folderName.toLowerCase();
    if (lower.indexOf('react') !== -1 || lower.indexOf('spfx') !== -1 || lower.indexOf('frontend') !== -1) return 'Development';
    if (lower.indexOf('architecture') !== -1 || lower.indexOf('cloud') !== -1 || lower.indexOf('azure') !== -1) return 'Architecture';
    if (lower.indexOf('design') !== -1 || lower.indexOf('ui') !== -1 || lower.indexOf('ux') !== -1) return 'UI/UX Design';
    if (lower.indexOf('power') !== -1 || lower.indexOf('automation') !== -1 || lower.indexOf('flow') !== -1) return 'Automation';
    if (lower.indexOf('ai') !== -1 || lower.indexOf('copilot') !== -1 || lower.indexOf('ml') !== -1) return 'AI & Data';
    return 'General Learning';
  }

  private getCategoryBanner(folderName: string, index: number): string {
    const colors = [
      'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      'linear-gradient(135deg, #dc2626 0%, #e11d48 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
    ];
    return colors[index % colors.length];
  }

  // --- Mock Data Providers ---

  private getMockUpcomingEvents(): IUpcomingEventItem[] {
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 2);

    const d2 = new Date(today);
    d2.setDate(today.getDate() + 5);

    const d3 = new Date(today);
    d3.setDate(today.getDate() + 14);

    return [
      {
        id: 'evt-1',
        title: 'Wellness Week, US',
        eventDate: d1.toISOString(),
        location: 'Woodline Main Hub',
        eventUrl: 'https://realitytechhub.sharepoint.com',
        isActive: true
      },
      {
        id: 'evt-2',
        title: '2026 US Open Enrollment',
        eventDate: d2.toISOString(),
        location: 'Virtual Conference',
        eventUrl: 'https://realitytechhub.sharepoint.com',
        isActive: true
      },
      {
        id: 'evt-3',
        title: 'Woodline Q3 Investment Summit',
        eventDate: d3.toISOString(),
        location: 'New York Auditorium',
        eventUrl: 'https://realitytechhub.sharepoint.com',
        isActive: true
      }
    ];
  }

  private getMockCollections(): ILearningCollection[] {
    return [
      {
        id: '/sites/WoodLine/Shared Documents/Analysts',
        title: 'Analysts',
        description: 'Analyst learning covering sourcing, sizing, data leverage, QR Q&A and training-day resources.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Analysts',
        itemCount: 4,
        createdDate: 'Jan 15, 2026',
        modifiedDate: 'Feb 20, 2026',
        category: 'Development',
        bannerUrl: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        author: 'Sarah Connor',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Associates',
        title: 'Associates',
        description: 'Associate learning covering advanced skills, collaboration and professional development.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Associates',
        itemCount: 6,
        createdDate: 'Mar 10, 2025',
        modifiedDate: 'Aug 12, 2025',
        category: 'Architecture',
        bannerUrl: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
        author: 'Alex Mercer',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Corporate Access',
        title: 'Corporate Access',
        description: 'Resources supporting corporate access, company engagement and related learning.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Corporate Access',
        itemCount: 0,
        createdDate: 'Nov 05, 2025',
        modifiedDate: 'Dec 18, 2025',
        category: 'Corporate',
        bannerUrl: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        author: 'David Chen',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Earnings',
        title: 'Earnings',
        description: 'Learning resources and materials related to earnings analysis and company updates.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Earnings',
        itemCount: 0,
        createdDate: 'May 14, 2025',
        modifiedDate: 'Jun 22, 2025',
        category: 'Finance',
        bannerUrl: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        author: 'Elena Rostova',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Fusion',
        title: 'Fusion',
        description: 'Fusion learning resources and development materials.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Fusion',
        itemCount: 0,
        createdDate: 'Feb 01, 2026',
        modifiedDate: 'Feb 28, 2026',
        category: 'Development',
        bannerUrl: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        author: 'Maya Lin',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Idea Generation',
        title: 'Idea Generation',
        description: 'Resources focused on developing ideas, research thinking and investment insights.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Idea Generation',
        itemCount: 0,
        createdDate: 'Jan 20, 2026',
        modifiedDate: 'Aug 05, 2026',
        category: 'Research',
        bannerUrl: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
        author: 'Liam Vance',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Health, General Interest',
        title: 'Health, General Interest',
        description: 'Resources covering health and general-interest learning topics.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Health, General Interest',
        itemCount: 0,
        createdDate: 'Jan 10, 2026',
        modifiedDate: 'Feb 15, 2026',
        category: 'Wellness',
        bannerUrl: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        author: 'L&D Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Investment Forums',
        title: 'Investment Forums',
        description: 'Learning resources and materials from investment forums.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Investment Forums',
        itemCount: 0,
        createdDate: 'Feb 05, 2026',
        modifiedDate: 'Feb 25, 2026',
        category: 'Finance',
        bannerUrl: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
        author: 'L&D Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Onboarding',
        title: 'Onboarding',
        description: 'Resources to help new team members understand Woodline, its processes and key learning materials.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Onboarding',
        itemCount: 0,
        createdDate: 'Dec 01, 2025',
        modifiedDate: 'Feb 20, 2026',
        category: 'Onboarding',
        bannerUrl: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        author: 'HR Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Quant Research',
        title: 'Quant Research',
        description: 'Quantitative research resources covering data analysis, research methods and related investment tools.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Quant Research',
        itemCount: 3,
        createdDate: 'Jan 28, 2026',
        modifiedDate: 'Feb 22, 2026',
        category: 'Research',
        bannerUrl: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
        author: 'Quant Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/SDAs',
        title: 'SDAs',
        description: 'Learning resources and materials related to SDAs and supporting development activities.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/SDAs',
        itemCount: 0,
        createdDate: 'Feb 10, 2026',
        modifiedDate: 'Feb 26, 2026',
        category: 'Development',
        bannerUrl: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        author: 'L&D Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Tools & Tech Tips',
        title: 'Tools & Tech Tips',
        description: 'Helpful technology resources, tools, tips and guidance to improve your day-to-day work.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Tools & Tech Tips',
        itemCount: 0,
        createdDate: 'Jan 05, 2026',
        modifiedDate: 'Feb 28, 2026',
        category: 'Technology',
        bannerUrl: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        author: 'IT Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Training Days',
        title: 'Training Days',
        description: 'Training day resources, presentations, recordings and supporting learning materials.',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Training Days',
        itemCount: 0,
        createdDate: 'Feb 02, 2026',
        modifiedDate: 'Feb 27, 2026',
        category: 'Training',
        bannerUrl: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
        author: 'L&D Team',
        isActive: true
      },
      {
        id: '/sites/WoodLine/Shared Documents/Archived Inactive Folder',
        title: 'Archived Inactive Folder',
        description: 'Legacy folder where Active column is set to No (false).',
        serverRelativeUrl: '/sites/WoodLine/Shared Documents/Archived Inactive Folder',
        itemCount: 0,
        createdDate: 'Jan 01, 2024',
        modifiedDate: 'Jan 01, 2024',
        category: 'Archived',
        bannerUrl: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
        author: 'System',
        isActive: false // Filtered out because Active === false (No)
      }
    ];
  }

  private getMockSessionsForFolder(folderUrl: string): IVideoSession[] {
    const folderName = folderUrl.split('/').pop() || 'Learning Collection';

    const mockVideos: Record<string, Partial<IVideoSession>[]> = {
      'Analysts': [
        {
          title: '01. Analyst Fundamentals & Sourcing Overview',
          description: 'Analyst learning covering sourcing, sizing, data leverage, QR Q&A and training-day resources.',
          year: '2026',
          month: 'January',
          createdDate: 'Jan 15, 2026',
          fileSize: '145.8 MB',
          duration: '18 min'
        },
        {
          title: '02. Data Sizing & Financial Model Leverage',
          description: 'Deep dive into leverage models, data structuring, and QR analysis.',
          year: '2026',
          month: 'January',
          createdDate: 'Jan 18, 2026',
          fileSize: '210.4 MB',
          duration: '24 min'
        },
        {
          title: '03. QR Q&A Session & Case Studies',
          description: 'Interactive analyst Q&A session discussing quantitative research techniques.',
          year: '2026',
          month: 'February',
          createdDate: 'Feb 02, 2026',
          fileSize: '320.1 MB',
          duration: '35 min'
        },
        {
          title: '04. Training-Day Sourcing Resources',
          description: 'Key takeaways and training-day materials for analysts.',
          year: '2026',
          month: 'February',
          createdDate: 'Feb 12, 2026',
          fileSize: '185.0 MB',
          duration: '22 min'
        }
      ],
      'Associates': [
        {
          title: '01. Associate Advanced Skills & Leadership',
          description: 'Associate learning covering advanced skills, collaboration and professional development.',
          year: '2025',
          month: 'March',
          createdDate: 'Mar 10, 2025',
          fileSize: '198.5 MB',
          duration: '26 min'
        },
        {
          title: '02. Cross-Team Collaboration Workshop',
          description: 'Practical exercises to foster effective collaboration across Woodline teams.',
          year: '2025',
          month: 'April',
          createdDate: 'Apr 04, 2025',
          fileSize: '265.0 MB',
          duration: '30 min'
        },
        {
          title: '03. Investment Analysis & Professional Growth',
          description: 'Strategies for career progression and mastering complex analysis.',
          year: '2025',
          month: 'June',
          createdDate: 'Jun 15, 2025',
          fileSize: '175.2 MB',
          duration: '21 min'
        },
        {
          title: '04. Project Sizing & Portfolio Guidance',
          description: 'Frameworks for managing associate level responsibilities.',
          year: '2025',
          month: 'August',
          createdDate: 'Aug 12, 2025',
          fileSize: '240.0 MB',
          duration: '27 min'
        },
        {
          title: '05. Market Research & Data Leverage',
          description: 'Utilizing data leverage tools for deeper sector analysis.',
          year: '2025',
          month: 'October',
          createdDate: 'Oct 08, 2025',
          fileSize: '210.0 MB',
          duration: '25 min'
        },
        {
          title: '06. Associate Capstone & Review',
          description: 'Comprehensive review session summarizing key learnings.',
          year: '2025',
          month: 'December',
          createdDate: 'Dec 12, 2025',
          fileSize: '280.0 MB',
          duration: '32 min'
        }
      ],
      'Quant Research': [
        {
          title: '01. Quant Research Fundamentals & Data Analysis',
          description: 'Quantitative research resources covering data analysis, research methods and related investment tools.',
          year: '2026',
          month: 'January',
          createdDate: 'Jan 28, 2026',
          fileSize: '190.5 MB',
          duration: '22 min'
        },
        {
          title: '02. Research Methods & Statistical Modeling',
          description: 'Advanced statistical modeling techniques and research methods.',
          year: '2026',
          month: 'February',
          createdDate: 'Feb 10, 2026',
          fileSize: '245.0 MB',
          duration: '29 min'
        },
        {
          title: '03. Investment Tools & Automation Lab',
          description: 'Hands-on quantitative lab building automated research scripts.',
          year: '2026',
          month: 'February',
          createdDate: 'Feb 22, 2026',
          fileSize: '310.2 MB',
          duration: '34 min'
        }
      ]
    };

    const templates = mockVideos[folderName] || [
      {
        title: `01. Introduction to ${folderName}`,
        description: `Fundamental overview and core principles of ${folderName}. Perfect starting point for team members.`,
        year: '2026',
        month: 'February',
        createdDate: 'Feb 05, 2026',
        fileSize: '160.0 MB',
        duration: '19 min'
      },
      {
        title: `02. Practical Exercises & Case Walkthrough - ${folderName}`,
        description: `Hands-on guided walkthrough with real-world scenarios and learning materials.`,
        year: '2026',
        month: 'February',
        createdDate: 'Feb 12, 2026',
        fileSize: '280.4 MB',
        duration: '31 min'
      },
      {
        title: `03. Advanced Insights & Best Practices`,
        description: `In-depth exploration of operational workflows, performance strategies, and key guidelines.`,
        year: '2026',
        month: 'February',
        createdDate: 'Feb 20, 2026',
        fileSize: '315.8 MB',
        duration: '38 min'
      }
    ];

    return templates.map((tmpl, idx) => {
      const ext = 'MP4';
      const fileName = `${tmpl.title}.mp4`;
      const fileRef = `${folderUrl}/${fileName}`;
      return {
        id: fileRef,
        title: tmpl.title || `Session ${idx + 1}`,
        description: tmpl.description || `Video session for ${folderName}`,
        serverRelativeUrl: fileRef,
        fileName: fileName,
        fileExtension: ext,
        thumbnailUrl: '',
        createdDate: tmpl.createdDate || 'Feb 2026',
        year: tmpl.year || '2026',
        month: tmpl.month || 'February',
        fileSize: tmpl.fileSize || '180 MB',
        duration: tmpl.duration || '25 min',
        folderServerRelativeUrl: folderUrl,
        folderName: folderName
      };
    });
  }
}
