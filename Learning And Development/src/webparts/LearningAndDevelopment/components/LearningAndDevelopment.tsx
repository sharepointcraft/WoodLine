import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './LearningAndDevelopment.module.scss';
import { ILearningAndDevelopmentProps } from './ILearningAndDevelopmentProps';
import { FilterBar } from './FilterBar';
import {
  ILearningCollection,
  IVideoSession,
  IFilterState,
  ILearningStats,
  IUpcomingEventItem,
  ViewMode
} from '../models/ILearningModels';
import { SpService } from '../services/SpService';
import { SessionCard } from './SessionCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { Icon } from '@fluentui/react/lib/Icon';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const INITIAL_FILTERS: IFilterState = {
  folderSearch: '',
  folderAlpha: 'All',
  folderSort: 'asc',
  sessionSearch: '',
  sessionYear: 'All',
  sessionMonth: 'All',
  sessionSort: 'newest'
};

const formatEventDisplayDate = (eventDateStr: string, endDateStr?: string): string => {
  try {
    const start = new Date(eventDateStr);
    if (isNaN(start.getTime())) return eventDateStr;

    const startFormatted = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const timeFormatted = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const isAllDay = start.getHours() === 0 && start.getMinutes() === 0;

    if (endDateStr) {
      const end = new Date(endDateStr);
      if (!isNaN(end.getTime()) && end.toDateString() !== start.toDateString()) {
        const endFormatted = end.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        return `${startFormatted} - ${endFormatted}`;
      }
    }

    return isAllDay ? `${startFormatted} • All Day` : `${startFormatted} at ${timeFormatted}`;
  } catch {
    return eventDateStr;
  }
};

const LearningAndDevelopment: React.FC<ILearningAndDevelopmentProps> = (props) => {
  const { libraryTitle, useMockData, videoExtensions, context } = props;

  const spService = useMemo(() => new SpService(context), [context]);

  const [collections, setCollections] = useState<ILearningCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<ILearningCollection | undefined>(undefined);
  const [sessions, setSessions] = useState<IVideoSession[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<IUpcomingEventItem[]>([]);
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
      const fetchedCollections = await spService.getTopLevelFolders(libraryTitle, useMockData);
      const fetchedStats = await spService.getLibraryStats(libraryTitle, useMockData);
      const fetchedEvents = await spService.getUpcomingEvents(useMockData);

      setCollections(fetchedCollections);
      setStats(fetchedStats);
      setUpcomingEvents(fetchedEvents);
      setIsLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Learning Collections from SharePoint library.';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [libraryTitle, useMockData, spService]);

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
    } catch {
      setError(`Could not retrieve video sessions for "${collection.title}".`);
      setIsLoading(false);
    }
  }, [spService, videoExtensions, useMockData]);

  const handleBackToCollections = useCallback((): void => {
    setSelectedCollection(undefined);
    setViewMode('collections');
    setSessions([]);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<IFilterState>): void => {
    setFilterState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const filteredCollections = useMemo(() => {
    let list = [...collections];

    if (filterState.folderSearch) {
      const query = filterState.folderSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().indexOf(query) !== -1 ||
          c.description.toLowerCase().indexOf(query) !== -1 ||
          (c.category && c.category.toLowerCase().indexOf(query) !== -1)
      );
    }

    if (filterState.folderAlpha && filterState.folderAlpha !== 'All') {
      const char = filterState.folderAlpha.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().startsWith(char));
    }

    list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [collections, filterState.folderSearch, filterState.folderAlpha]);

  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    if (filterState.sessionSearch) {
      const query = filterState.sessionSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().indexOf(query) !== -1 ||
          s.description.toLowerCase().indexOf(query) !== -1 ||
          s.fileName.toLowerCase().indexOf(query) !== -1
      );
    }

    if (filterState.sessionYear && filterState.sessionYear !== 'All') {
      list = list.filter((s) => s.year === filterState.sessionYear);
    }

    if (filterState.sessionMonth && filterState.sessionMonth !== 'All') {
      list = list.filter(
        (s) => s.month.toLowerCase() === filterState.sessionMonth.toLowerCase()
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
      {/* 1. HERO SECTION */}
      <header className={styles.learningHero}>
        <div className={styles.heroContent}>
          <div className={styles.navigationPath}>
            WOODLINE WEB / EDUCATE / LEARNING &amp; DEVELOPMENT
          </div>

          <h1 className={styles.title}>
            Learning &amp; Development Center
          </h1>

          <p className={styles.description}>
            Build knowledge, sharpen skills, and access the training, insights, and resources that support your development at Woodline.
          </p>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.totalCollections}</span>
              <span className={styles.statLabel}>
                {stats.totalCollections === 1 ? 'Collection' : 'Collections'}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.totalSessions}</span>
              <span className={styles.statLabel}>
                {stats.totalSessions === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. ALPHABETICAL FILTER BAR */}
      <nav className={styles.Filter} aria-label="Alphabetical Filter">
        <div className={styles.FilterContainer}>
          <span className={styles.FilterLabel}>Browse by A-Z</span>
          <div className={styles.alphabetTrack}>
            <button
              type="button"
              className={`${styles.letterButton} ${filterState.folderAlpha === 'All' ? styles.active : ''}`}
              onClick={() => handleAlphaClick('All')}
            >
              All
            </button>
            {ALPHABET.map((letter) => {
              const isActive = filterState.folderAlpha === letter;
              const hasItems = activeLetters.has(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!hasItems}
                  className={`${styles.letterButton} ${isActive ? styles.active : ''} ${!hasItems ? styles.disabled : ''}`}
                  onClick={() => handleAlphaClick(letter)}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. MAIN CONTENT SECTION */}
      <section className={styles.librarySection}>
        <div className={styles.libraryContainer}>
          {/* LEFT COLUMN: LEARNING COLLECTIONS OR SESSIONS */}
          <div className={styles.libraryContent}>
            {/* SEARCH & BREADCRUMB HEADER */}
            <div className={styles.libraryHeader}>
              {viewMode === 'collections' ? (
                <>
                  <h2 className={styles.libraryTitle}>Learning Collections</h2>
                  <p className={styles.librarySubtitle}>
                    Browse by department or topic to access curated training materials and session recordings.
                  </p>

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
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.backNavBtn}
                    onClick={handleBackToCollections}
                  >
                    <Icon iconName="Back" /> Back to Collections
                  </button>

                  <h2 className={styles.libraryTitle}>
                    {selectedCollection?.title}
                  </h2>
                  <p className={styles.librarySubtitle}>
                    {selectedCollection?.description}
                  </p>

                  <FilterBar
                    filterState={filterState}
                    onFilterChange={handleFilterChange}
                    viewMode="sessions"
                  />
                </>
              )}
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
                <p>Loading learning sessions...</p>
              </div>
            )}

            {/* FOLDER COLLECTIONS VIEW (4 CARDS PER ROW DESKTOP) */}
            {!isLoading && viewMode === 'collections' && (
              <>
                {filteredCollections.length > 0 ? (
                  <div className={styles.collectionGrid}>
                    {filteredCollections.map((collection) => (
                      <div
                        key={collection.id}
                        className={styles.collectionCard}
                        onClick={() => { handleSelectCollection(collection).catch(() => { }); }}
                      >
                        <div className={styles.cardInner}>
                          {/* CARD FRONT */}
                          <div className={styles.cardFront}>
                            <div className={styles.iconBox}>
                              <Icon iconName="FolderOpen" />
                            </div>

                            <div className={styles.cardContent}>
                              <h3 className={styles.cardTitle}>
                                {collection.title}
                              </h3>
                              <p className={styles.sessionCount}>
                                {collection.itemCount} {collection.itemCount === 1 ? 'session' : 'sessions'}
                              </p>
                            </div>

                            <div className={styles.flipText}>
                              Flip to explore
                            </div>
                          </div>

                          {/* CARD BACK */}
                          <div className={styles.cardBack}>
                            <div className={styles.backLabel}>
                              Learning Collection
                            </div>

                            <h3 className={styles.backTitle}>
                              {collection.title}
                            </h3>

                            <p className={styles.backDescription}>
                              {collection.description}
                            </p>

                            <div className={styles.backSessions}>
                              {collection.itemCount} sessions to watch
                            </div>

                            <div className={styles.backAction}>
                              Select to view video sessions &rarr;
                            </div>
                          </div>
                        </div>
                      </div>
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

            {/* VIDEO SESSIONS VIEW */}
            {!isLoading && viewMode === 'sessions' && (
              <>
                {filteredSessions.length > 0 ? (
                  <div className={styles.sessionGridContainer}>
                    {filteredSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onWatchVideo={handleWatchVideo}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyStateContainer}>
                    <Icon iconName="VideoOff" className={styles.emptyIcon} />
                    <h3>No Video Sessions Found</h3>
                    <p>No video files found in this collection matching your search.</p>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => setFilterState((prev) => ({ ...prev, sessionSearch: '' }))}
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: RESOURCES & UPCOMING EVENTS */}
          <div className={styles.rightColumn}>
            {/* RESOURCES & DOCUMENTS PANEL (QUICK LINKS) */}
            <aside className={styles.resourcesPanel}>
              <h2 className={styles.resourcesTitle}>
                Resources &amp; Documents
              </h2>

              <p className={styles.resourcesDescription}>
                Open the learning resource areas from the Woodline Learning &amp; Development Center.
              </p>

              <div className={styles.resourceList}>
                {collections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    className={styles.resourceButton}
                    onClick={() => { handleSelectCollection(col).catch(() => { }); }}
                  >
                    <span className={styles.resourceIcon} aria-hidden="true">
                      <Icon iconName="OpenInNewWindow" />
                    </span>
                    <span className={styles.resourceText}>
                      {col.title}
                    </span>
                  </button>
                ))}
              </div>

              <div className={styles.resourcesFooter}>
                <p>
                  Links are draggable into supported browser tabs, messages and documents.
                </p>
              </div>
            </aside>

            {/* UPCOMING EVENTS PANEL */}
            <div className={styles.eventsPanel}>
              <h2 className={styles.eventsTitle}>
                Upcoming Events
              </h2>

              <div className={styles.eventsList}>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((evt) => {
                    const dateDisplay = formatEventDisplayDate(evt.eventDate, evt.endDate);

                    if (evt.eventUrl) {
                      return (
                        <a
                          key={evt.id}
                          href={evt.eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.eventItemLink}
                        >
                          <div className={styles.eventTitleRow}>
                            <span className={styles.eventTitle}>{evt.title}</span>
                            <Icon iconName="OpenInNewWindow" className={styles.eventLinkIcon} />
                          </div>
                          <div className={styles.eventDetails}>
                            <span>{dateDisplay}</span>
                            {evt.location && (
                              <span className={styles.eventLocation}>
                                <Icon iconName="Poi" /> {evt.location}
                              </span>
                            )}
                          </div>
                        </a>
                      );
                    }

                    return (
                      <div key={evt.id} className={styles.eventItemStatic}>
                        <div className={styles.eventTitleRow}>
                          <span className={styles.eventTitle}>{evt.title}</span>
                        </div>
                        <div className={styles.eventDetails}>
                          <span>{dateDisplay}</span>
                          {evt.location && (
                            <span className={styles.eventLocation}>
                              <Icon iconName="Poi" /> {evt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.eventEmpty}>
                    No upcoming events scheduled at this time.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
