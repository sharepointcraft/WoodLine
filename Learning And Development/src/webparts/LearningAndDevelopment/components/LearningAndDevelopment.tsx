import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './LearningAndDevelopment.module.scss';
import { ILearningAndDevelopmentProps } from './ILearningAndDevelopmentProps';
import {
  ILearningCollection,
  IVideoSession,
  IFilterState,
  ILearningStats,
  IUpcomingEventItem,
  IQuickLinkItem,
  ViewMode
} from '../models/ILearningModels';
import { SpService } from '../services/SpService';
import { HeroSection } from './HeroSection';
import { AlphabetFilterBar } from './AlphabetFilterBar';
import { CollectionCard } from './CollectionCard';
import { ResourcesPanel } from './ResourcesPanel';
import { UpcomingEventsPanel } from './UpcomingEventsPanel';
import { SessionFilters } from './SessionFilters';
import { SessionCard } from './SessionCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { Icon } from '@fluentui/react/lib/Icon';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthNumber = (monthStr: string): number => {
  const index = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === monthStr.toLowerCase()
  );
  return index === -1 ? 99 : index;
};

const getSessionYear = (session: IVideoSession): string => {
  if (session.year && session.year !== 'Year not specified' && session.year !== 'All') {
    return session.year;
  }
  if (session.createdDate) {
    const parts = session.createdDate.split('-');
    if (parts.length >= 1 && parts[0].length === 4) {
      return parts[0];
    }
    const dateObj = new Date(session.createdDate);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.getFullYear().toString();
    }
  }
  return 'Year not specified';
};

const getSessionMonth = (session: IVideoSession): string => {
  if (session.month && session.month !== 'Month not specified' && session.month !== 'All') {
    return session.month;
  }
  if (session.createdDate) {
    const parts = session.createdDate.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      if (monthNum >= 1 && monthNum <= 12) {
        return MONTH_NAMES[monthNum - 1];
      }
    }
    const dateObj = new Date(session.createdDate);
    if (!isNaN(dateObj.getTime())) {
      return MONTH_NAMES[dateObj.getMonth()];
    }
  }
  return 'Month not specified';
};

const INITIAL_FILTERS: IFilterState = {
  folderSearch: '',
  folderAlpha: 'All',
  folderSort: 'asc',
  sessionSearch: '',
  sessionYear: 'All',
  sessionMonth: 'All',
  sessionSort: 'newest'
};

const LearningAndDevelopment: React.FC<ILearningAndDevelopmentProps> = (props) => {
  const {
    libraryTitle = '',
    quickLinksListName = '',
    upcomingEventsListName = '',
    useMockData,
    videoExtensions,
    context
  } = props;

  const spService = useMemo(() => new SpService(context), [context]);

  const [collections, setCollections] = useState<ILearningCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<ILearningCollection | undefined>(undefined);
  const [sessions, setSessions] = useState<IVideoSession[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<IUpcomingEventItem[]>([]);
  const [quickLinks, setQuickLinks] = useState<IQuickLinkItem[]>([]);
  const [stats, setStats] = useState<ILearningStats>({ totalCollections: 0, totalSessions: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>('collections');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [filterState, setFilterState] = useState<IFilterState>({ ...INITIAL_FILTERS });
  const [selectedVideoForModal, setSelectedVideoForModal] = useState<IVideoSession | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadPortalData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      const allowedExts = videoExtensions
        ? videoExtensions.split(',').map((s: string) => s.trim())
        : ['mp4', 'mov', 'wmv', 'avi', 'webm', 'mkv', 'm4v'];

      const fetchedCollections = await spService.getTopLevelFolders(libraryTitle, useMockData, allowedExts);
      const fetchedStats = await spService.getLibraryStats(libraryTitle, useMockData, allowedExts);
      const fetchedEvents = await spService.getUpcomingEvents(upcomingEventsListName, useMockData);
      const fetchedQuickLinks = await spService.getQuickLinks(quickLinksListName, useMockData);

      setCollections(fetchedCollections);
      setStats(fetchedStats);
      setUpcomingEvents(fetchedEvents);
      setQuickLinks(fetchedQuickLinks);
      setIsLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Learning Collections from SharePoint library.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [libraryTitle, quickLinksListName, upcomingEventsListName, useMockData, videoExtensions, spService]);

  useEffect(() => {
    loadPortalData().catch(() => { });
  }, [loadPortalData]);

  const handleSelectCollection = useCallback(async (collection: ILearningCollection): Promise<void> => {
    setSelectedCollection(collection);
    setViewMode('sessions');
    setIsLoading(true);
    setError(undefined);
    setFilterState((prev) => ({
      ...prev,
      sessionSearch: '',
      sessionYear: 'All',
      sessionMonth: 'All'
    }));

    try {
      const allowedExts = videoExtensions
        ? videoExtensions.split(',').map((s: string) => s.trim())
        : ['mp4', 'mov', 'wmv', 'avi', 'webm', 'mkv', 'm4v'];

      const fetchedSessions = await spService.getVideoSessionsInFolder(
        collection.serverRelativeUrl,
        allowedExts,
        useMockData
      );

      setSessions(fetchedSessions);
      setIsLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video sessions for this collection.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [videoExtensions, useMockData, spService]);

  const handleBackToCollections = useCallback((): void => {
    setViewMode('collections');
    setSelectedCollection(undefined);
    setSessions([]);
  }, []);

  const filteredCollections = useMemo(() => {
    let list = [...collections];

    if (filterState.folderSearch.trim()) {
      const query = filterState.folderSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().indexOf(query) !== -1 ||
          (c.description && c.description.toLowerCase().indexOf(query) !== -1)
      );
    }

    if (filterState.folderAlpha !== 'All') {
      list = list.filter(
        (c) =>
          c.title &&
          c.title.charAt(0).toUpperCase() === filterState.folderAlpha.toUpperCase()
      );
    }

    list.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      return filterState.folderSort === 'asc'
        ? titleA.localeCompare(titleB)
        : titleB.localeCompare(titleA);
    });

    return list;
  }, [collections, filterState.folderSearch, filterState.folderAlpha, filterState.folderSort]);

  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    if (filterState.sessionSearch.trim()) {
      const query = filterState.sessionSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().indexOf(query) !== -1 ||
          s.description.toLowerCase().indexOf(query) !== -1 ||
          s.fileName.toLowerCase().indexOf(query) !== -1
      );
    }

    if (filterState.sessionYear && filterState.sessionYear !== 'All') {
      list = list.filter((s) => getSessionYear(s) === filterState.sessionYear);
    }

    if (filterState.sessionMonth && filterState.sessionMonth !== 'All') {
      list = list.filter(
        (s) => getSessionMonth(s).toLowerCase() === filterState.sessionMonth.toLowerCase()
      );
    }

    list.sort((a, b) => {
      if (filterState.sessionSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      const timeA = new Date(a.createdDate).getTime() || 0;
      const timeB = new Date(b.createdDate).getTime() || 0;
      return filterState.sessionSort === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [sessions, filterState.sessionSearch, filterState.sessionYear, filterState.sessionMonth, filterState.sessionSort]);

  // Distinct Years for Dropdown Filter
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const y = getSessionYear(s);
      if (y && y !== 'Year not specified') set.add(y);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [sessions]);

  // Distinct Months for Dropdown Filter
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const m = getSessionMonth(s);
      if (m && m !== 'Month not specified') set.add(m);
    });
    return Array.from(set).sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
  }, [sessions]);

  // Group filtered sessions by Year
  const groupedByYear = useMemo(() => {
    const grouped: { [year: string]: IVideoSession[] } = {};
    filteredSessions.forEach((session) => {
      const year = getSessionYear(session);
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(session);
    });
    return grouped;
  }, [filteredSessions]);

  const yearKeys = useMemo(() => {
    const keys = Object.keys(groupedByYear);
    return keys.sort((a, b) => {
      if (a === 'Year not specified') return 1;
      if (b === 'Year not specified') return -1;
      return Number(b) - Number(a);
    });
  }, [groupedByYear]);

  const groupVideosByMonth = (videos: IVideoSession[]): { [month: string]: IVideoSession[] } => {
    const grouped: { [month: string]: IVideoSession[] } = {};
    videos.forEach((video) => {
      const month = getSessionMonth(video);
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(video);
    });
    return grouped;
  };

  const activeLetters = useMemo(() => {
    const set = new Set<string>();
    collections.forEach((c) => {
      if (c.title) {
        set.add(c.title.charAt(0).toUpperCase());
      }
    });
    return set;
  }, [collections]);

  const handleAlphaClick = useCallback((letter: string): void => {
    setFilterState((prev) => ({
      ...prev,
      folderAlpha: prev.folderAlpha === letter ? 'All' : letter
    }));
  }, []);

  const handleResetFilters = useCallback((): void => {
    setFilterState({ ...INITIAL_FILTERS });
  }, []);

  const handleWatchVideo = useCallback((session: IVideoSession): void => {
    setSelectedVideoForModal(session);
    setIsModalOpen(true);
  }, []);

  const handleDismissModal = useCallback((): void => {
    setIsModalOpen(false);
    setSelectedVideoForModal(undefined);
  }, []);

  return (
    <section className={styles.learningAndDevelopment}>
      {viewMode === 'collections' ? (
        <>
          {/* 1. HERO SECTION (COLLECTIONS PAGE) */}
          <HeroSection stats={stats} />

          {/* 2. ALPHABETICAL FILTER BAR */}
          <AlphabetFilterBar
            selectedLetter={filterState.folderAlpha}
            activeLetters={activeLetters}
            onSelectLetter={handleAlphaClick}
          />

          {/* 3. MAIN CONTENT SECTION */}
          <section className={styles.librarySection}>
            <div className={styles.libraryContainer}>
              {/* LEFT COLUMN: LEARNING COLLECTIONS */}
              <div className={styles.libraryContent}>
                <div className={styles.libraryHeader}>
                  <h2 className={styles.libraryTitle}>Learning Collections</h2>
                  <p className={styles.librarySubtitle}>
                    Browse by department or topic to access curated training materials and session recordings.
                  </p>

                  {/* SEARCH ROW */}
                  <div className={styles.searchRow}>
                    <div className={styles.searchBoxWrapper}>
                      <Icon iconName="Search" className={styles.searchIcon} />
                      <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search collections by title, description or category..."
                        value={filterState.folderSearch}
                        onChange={(e) => setFilterState((prev) => ({ ...prev, folderSearch: e.target.value }))}
                      />
                      {filterState.folderSearch && (
                        <button
                          type="button"
                          className={styles.clearSearchBtn}
                          onClick={() => setFilterState((prev) => ({ ...prev, folderSearch: '' }))}
                        >
                          <Icon iconName="Cancel" />
                        </button>
                      )}
                    </div>

                    {(filterState.folderSearch || filterState.folderAlpha !== 'All') && (
                      <button
                        type="button"
                        className={styles.resetBtn}
                        onClick={handleResetFilters}
                      >
                        <Icon iconName="Refresh" /> Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* ERROR DISPLAY */}
                {error && (
                  <div className={styles.errorContainer}>
                    <Icon iconName="ErrorBadge" className={styles.errorIcon} />
                    <span>{error}</span>
                  </div>
                )}

                {/* LOADING SPINNER */}
                {isLoading && (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <p>Loading learning collections...</p>
                  </div>
                )}

                {/* FOLDER COLLECTIONS GRID */}
                {!isLoading && (
                  <>
                    {filteredCollections.length > 0 ? (
                      <div className={styles.collectionGrid}>
                        {filteredCollections.map((collection) => (
                          <CollectionCard
                            key={collection.id}
                            collection={collection}
                            onSelectCollection={(col) => { handleSelectCollection(col).catch(() => { }); }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyStateContainer}>
                        <Icon iconName="SearchData" className={styles.emptyIcon} />
                        <h3>No Learning Collections Found</h3>
                        <p>No collections match your search or letter filter.</p>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={handleResetFilters}
                        >
                          Reset Filters
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: RESOURCES & UPCOMING EVENTS */}
              <div className={styles.rightColumn}>
                {/* RESOURCES & DOCUMENTS PANEL */}
                <ResourcesPanel
                  collections={collections}
                  quickLinks={quickLinks}
                  onSelectCollection={(col) => { handleSelectCollection(col).catch(() => { }); }}
                />

                {/* UPCOMING EVENTS PANEL */}
                <UpcomingEventsPanel events={upcomingEvents} />
              </div>
            </div>
          </section>
        </>
      ) : (
        /* =========================================================
           SESSION PAGE UI (REDESIGNED LEARNING SESSION DETAIL PAGE)
           ========================================================= */
        <div className={styles.learningAndDevelopment}>
          {/* HERO HEADER SECTION */}
          <div className={styles.heroSection}>
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBackToCollections}
            >
              <span>&larr;</span> Back to Learning Library
            </button>

            <div className={styles.heroLabel}>
              LEARNING COLLECTION
            </div>

            <h1>
              {selectedCollection?.title || 'Analysts'}
            </h1>

            <p>
              {selectedCollection?.description || 'Browse video training sessions, presentations, and learning resources.'}
            </p>

            <div className={styles.sessionCount}>
              <strong>
                {filteredSessions.length}
              </strong>
              <span>
                {filteredSessions.length === 1 ? 'Session available' : 'Sessions available'}
              </span>
            </div>
          </div>

          {/* MAIN CONTENT WRAPPER */}
          <div className={styles.contentWrapper}>
            {/* FLOATING SESSION FILTER PANEL */}
            <SessionFilters
              filterState={filterState}
              availableYears={availableYears}
              availableMonths={availableMonths}
              onYearChange={(year) => setFilterState((prev) => ({ ...prev, sessionYear: year }))}
              onMonthChange={(month) => setFilterState((prev) => ({ ...prev, sessionMonth: month }))}
              onSearchChange={(search) => setFilterState((prev) => ({ ...prev, sessionSearch: search }))}
            />

            {/* ERROR DISPLAY */}
            {error && (
              <div className={styles.errorContainer} style={{ marginTop: '20px' }}>
                <Icon iconName="ErrorBadge" className={styles.errorIcon} />
                <span>{error}</span>
              </div>
            )}

            {/* LOADING SPINNER */}
            {isLoading && (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>Loading video sessions...</p>
              </div>
            )}

            {/* VIDEO SESSIONS GROUPED BY YEAR AND MONTH */}
            {!isLoading && (
              <>
                {filteredSessions.length === 0 ? (
                  <div className={styles.noResults}>
                    <h3>No sessions found</h3>
                    <p>Try changing the year, month, or search criteria.</p>
                  </div>
                ) : (
                  <div className={styles.sessionsContainer}>
                    {yearKeys.map((year) => {
                      const videosForYear = groupedByYear[year];
                      const groupedByMonth = groupVideosByMonth(videosForYear);
                      const monthKeys = Object.keys(groupedByMonth).sort(
                        (a, b) => getMonthNumber(a) - getMonthNumber(b)
                      );

                      return (
                        <div className={styles.yearSection} key={year}>
                          {/* YEAR HEADING */}
                          <div className={styles.yearHeading}>
                            <h2>{year}</h2>
                            <div className={styles.yearLine} />
                          </div>

                          {/* MONTH SECTIONS */}
                          {monthKeys.map((month) => {
                            const monthVideos = groupedByMonth[month];
                            return (
                              <div className={styles.monthSection} key={`${year}-${month}`}>
                                {/* MONTH HEADING */}
                                <div className={styles.monthHeading}>
                                  <h3>{month}</h3>
                                  <span>
                                    {monthVideos.length} {monthVideos.length === 1 ? 'SESSION' : 'SESSIONS'}
                                  </span>
                                </div>

                                {/* MONTH CONTENT */}
                                <div className={styles.monthContent}>
                                  <div className={styles.monthVerticalLine} />
                                  <div className={styles.sessionGrid}>
                                    {monthVideos.map((video) => (
                                      <SessionCard
                                        key={video.id}
                                        video={video}
                                        collectionTitle={selectedCollection?.title}
                                        onWatchVideo={handleWatchVideo}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      <VideoPlayerModal
        session={selectedVideoForModal}
        isOpen={isModalOpen}
        onDismiss={handleDismissModal}
      />
    </section>
  );
};

export default LearningAndDevelopment;
