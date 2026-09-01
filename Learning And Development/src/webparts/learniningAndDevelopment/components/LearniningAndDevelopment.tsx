import * as React from 'react';
import styles from './LearniningAndDevelopment.module.scss';
import type { ILearniningAndDevelopmentProps } from './ILearniningAndDevelopmentProps';


/* =========================================================
   VIDEO INTERFACE
   ========================================================= */

interface IVideoContent {
  id: number;
  title: string;
  videoDate?: string;
  libraryName: string;
  duration: string;
  views: number;
  comments: number;
  recordingUrl: string;
  thumbnailUrl?: string;
}


/* =========================================================
   VIDEO ARRAY
   =========================================================
   
   IMPORTANT:
   
   Add your videos here.

   You DON'T need to create year/month arrays.

   Example:

   2023-10-05
        ↓
      2023
        ↓
     October
        ↓
      Video

   The code automatically performs the grouping.
   ========================================================= */

const videoContents: IVideoContent[] = [

  {
    id: 1,
    title: 'Automation, Tools – Elliott',
    videoDate: '2023-10-05',
    libraryName: 'Associates',
    duration: '45:09',
    views: 441,
    comments: 4,
    recordingUrl: '#'
  },

  {
    id: 2,
    title: 'Idea Gen, Stock Drivers – Ryan, Peter',
    videoDate: '2023-10-05',
    libraryName: 'Associates',
    duration: '10:25',
    views: 441,
    comments: 4,
    recordingUrl: '#'
  },

  {
    id: 3,
    title: 'Mgmt Relationships – Karl, Elliott',
    videoDate: '2023-10-05',
    libraryName: 'Associates',
    duration: '04:21',
    views: 441,
    comments: 4,
    recordingUrl: '#'
  },

  {
    id: 4,
    title: 'Modeling Best Practices – Brian, Bill',
    videoDate: '2023-10-05',
    libraryName: 'Associates',
    duration: '05:24',
    views: 441,
    comments: 4,
    recordingUrl: '#'
  },

  {
    id: 5,
    title: 'Using Alt Data – Ben, Michelle',
    videoDate: '2023-10-05',
    libraryName: 'Associates',
    duration: '05:37',
    views: 441,
    comments: 4,
    recordingUrl: '#'
  },

  /*{
    id: 6,
    title: 'Associate Town Hall 2023',
    videoDate: undefined,
    libraryName: 'Associates',
    duration: '05:02',
    views: 441,
    comments: 4,
    recordingUrl: '#'
  },*/

  /* ---------------------------------------------------------
     Additional examples to demonstrate automatic grouping
     --------------------------------------------------------- */

  {
    id: 7,
    title: 'Associate Training – November',
    videoDate: '2023-11-10',
    libraryName: 'Associates',
    duration: '22:15',
    views: 320,
    comments: 6,
    recordingUrl: '#'
  },

  {
    id: 8,
    title: 'Associate Training – December',
    videoDate: '2023-12-15',
    libraryName: 'Associates',
    duration: '18:40',
    views: 275,
    comments: 3,
    recordingUrl: '#'
  },

  {
    id: 9,
    title: 'Associate Kickoff 2024',
    videoDate: '2024-01-12',
    libraryName: 'Associates',
    duration: '31:20',
    views: 520,
    comments: 8,
    recordingUrl: '#'
  },

  {
    id: 10,
    title: 'Associate Development Session',
    videoDate: '2024-02-08',
    libraryName: 'Associates',
    duration: '25:12',
    views: 410,
    comments: 5,
    recordingUrl: '#'
  }

];


/* =========================================================
   COMPONENT
   ========================================================= */

export default class LearniningAndDevelopment
  extends React.Component<ILearniningAndDevelopmentProps> {


  /* =========================================================
     STATE
     ========================================================= */

  public state = {
    selectedYear: 'All years',
    selectedMonth: 'All months',
    searchText: ''
  };


  /* =========================================================
     GET YEAR
     ========================================================= */

  private getYear(video: IVideoContent): string {

    if (!video.videoDate) {
      return 'Year not specified';
    }

    /*
     * Using split instead of new Date()
     * avoids timezone-related date changes.
     */

    return video.videoDate.split('-')[0];
  }


  /* =========================================================
     GET MONTH
     ========================================================= */

  private getMonth(video: IVideoContent): string {

    if (!video.videoDate) {
      return 'Month not specified';
    }

    const parts: string[] =
      video.videoDate.split('-');

    const monthNumber: number =
      Number(parts[1]);

    const months: string[] = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return months[monthNumber - 1] || 'Month not specified';
  }


  /* =========================================================
     GET MONTH NUMBER
     ========================================================= */

  private getMonthNumber(month: string): number {

    const months: string[] = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    const index: number =
      months.indexOf(month);

    if (index === -1) {
      return 99;
    }

    return index;
  }


  /* =========================================================
     FORMAT DATE
     ========================================================= */

  private formatDate(video: IVideoContent): string {

    if (!video.videoDate) {
      return 'Date not specified';
    }

    const parts: string[] =
      video.videoDate.split('-');

    if (parts.length !== 3) {
      return video.videoDate;
    }

    const year: string = parts[0];
    const month: number = Number(parts[1]);
    const day: string = parts[2];

    const months: string[] = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    return `${months[month - 1]} ${day}, ${year}`;
  }


  /* =========================================================
     FILTER VIDEOS
     ========================================================= */

  private getFilteredVideos(): IVideoContent[] {

    const selectedYear: string =
      this.state.selectedYear;

    const selectedMonth: string =
      this.state.selectedMonth;

    const searchText: string =
      this.state.searchText
        .trim()
        .toLowerCase();


    return videoContents.filter(
      (video: IVideoContent) => {

        const videoYear: string =
          this.getYear(video);

        const videoMonth: string =
          this.getMonth(video);


        /* YEAR */

        const matchesYear: boolean =
          selectedYear === 'All years' ||
          videoYear === selectedYear;


        /* MONTH */

        const matchesMonth: boolean =
          selectedMonth === 'All months' ||
          videoMonth === selectedMonth;


        /* SEARCH */

        const matchesSearch: boolean =
          searchText === '' ||
          video.title
            .toLowerCase()
            .indexOf(searchText) !== -1;


        return (
          matchesYear &&
          matchesMonth &&
          matchesSearch
        );
      }
    );
  }


  /* =========================================================
     GROUP BY YEAR
     ========================================================= */

  private groupVideosByYear(
    videos: IVideoContent[]
  ): { [year: string]: IVideoContent[] } {

    const grouped: {
      [year: string]: IVideoContent[]
    } = {};


    videos.forEach(
      (video: IVideoContent) => {

        const year: string =
          this.getYear(video);


        if (!grouped[year]) {
          grouped[year] = [];
        }


        /*
         * Add video to the appropriate year.
         */

        grouped[year].push(video);
      }
    );


    return grouped;
  }


  /* =========================================================
     GROUP BY MONTH
     ========================================================= */

  private groupVideosByMonth(
    videos: IVideoContent[]
  ): { [month: string]: IVideoContent[] } {

    const grouped: {
      [month: string]: IVideoContent[]
    } = {};


    videos.forEach(
      (video: IVideoContent) => {

        const month: string =
          this.getMonth(video);


        if (!grouped[month]) {
          grouped[month] = [];
        }


        /*
         * Add video to the appropriate month.
         */

        grouped[month].push(video);
      }
    );


    return grouped;
  }


  /* =========================================================
     VIDEO CARD
     ========================================================= */

  private renderVideoCard(
    video: IVideoContent
  ): React.ReactElement {

    return (

      <article
        className={styles.sessionCard}
        key={video.id}
      >

        {/* VIDEO HEADER */}

        <div className={styles.videoArea}>

          <button
            type="button"
            className={styles.playButton}
            aria-label={`Play ${video.title}`}
            onClick={() => {

              if (
                video.recordingUrl &&
                video.recordingUrl !== '#'
              ) {

                window.open(
                  video.recordingUrl,
                  '_blank',
                  'noopener,noreferrer'
                );
              }

            }}
          >

            <span className={styles.playIcon} />

          </button>


          {/* DURATION */}

          <span className={styles.duration}>
            {video.duration}
          </span>

        </div>


        {/* VIDEO DETAILS */}

        <div className={styles.cardContent}>

          <h3 className={styles.sessionTitle}>
            {video.title}
          </h3>


          <div className={styles.sessionDate}>
            Associate Training Day - {' '}
            {this.formatDate(video)}
          </div>


          <div className={styles.sessionStats}>

            <span>
              {video.views} Views
            </span>

            <span className={styles.separator}>
              •
            </span>

            <span>
              {video.comments} Comments
            </span>

          </div>


          <button
            type="button"
            className={styles.recordingButton}
            onClick={() => {

              if (
                video.recordingUrl &&
                video.recordingUrl !== '#'
              ) {

                window.open(
                  video.recordingUrl,
                  '_blank',
                  'noopener,noreferrer'
                );
              }

            }}
          >

            Open recording

            <span className={styles.buttonArrow}>
              →
            </span>

          </button>

        </div>

      </article>
    );
  }


  /* =========================================================
     RENDER
     ========================================================= */

  public render(): React.ReactElement<ILearniningAndDevelopmentProps> {

    /*
     * STEP 1
     *
     * Get filtered videos.
     */

    const filteredVideos: IVideoContent[] =
      this.getFilteredVideos();


    /*
     * STEP 2
     *
     * Automatically group videos by year.
     */

    const groupedByYear =
      this.groupVideosByYear(filteredVideos);


    /*
     * STEP 3
     *
     * Generate years for dropdown.
     */

    const years: string[] = Array.from(
      new Set(
        videoContents.map(
          (video: IVideoContent) =>
            this.getYear(video)
        )
      )
    );


    years.sort(
      (a: string, b: string) => {

        if (a === 'Year not specified') {
          return 1;
        }

        if (b === 'Year not specified') {
          return -1;
        }

        return Number(b) - Number(a);
      }
    );


    /*
     * STEP 4
     *
     * Generate months for dropdown.
     */

    const months: string[] = Array.from(
      new Set(
        videoContents.map(
          (video: IVideoContent) =>
            this.getMonth(video)
        )
      )
    );


    months.sort(
      (a: string, b: string) =>
        this.getMonthNumber(a) -
        this.getMonthNumber(b)
    );


    /*
     * STEP 5
     *
     * Get years that actually contain videos.
     */

    const yearKeys: string[] =
      Object.keys(groupedByYear);


    yearKeys.sort(
      (a: string, b: string) => {

        if (a === 'Year not specified') {
          return 1;
        }

        if (b === 'Year not specified') {
          return -1;
        }

        return Number(b) - Number(a);
      }
    );


    return (

      <section
        className={styles.learningAndDevelopment}
      >


        {/* =================================================
            HERO SECTION
        ================================================= */}

        <div className={styles.heroSection}>

          <div className={styles.heroContent}>

            <button
              type="button"
              className={styles.backButton}
              onClick={() => {
                window.history.back();
              }}
            >

              <span>
                ←
              </span>

              Back to Learning Library

            </button>


            <div className={styles.heroLabel}>
              LEARNING COLLECTION
            </div>


            <h1>
              Associates
            </h1>


            <p>
              The Associate curriculum and town halls —
              modelling standards, alt data, management
              meetings and the expectations that come
              with the seat.
            </p>


            <div className={styles.sessionCount}>

              <strong>
                {filteredVideos.length}
              </strong>

              <span>
                {filteredVideos.length === 1
                  ? 'Session available'
                  : 'Sessions available'}
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className={styles.contentWrapper}>


          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className={styles.filterPanel}>


            {/* TITLE */}

            <div className={styles.availableSessions}>

              <span className={styles.availableTitle}>
                Available Sessions
              </span>

              <span className={styles.newestText}>
                NEWEST TO OLDEST
              </span>

            </div>


            {/* FILTERS */}

            <div className={styles.filters}>


              {/* YEAR */}

              <div className={styles.filterGroup}>

                <label htmlFor="yearFilter">
                  YEAR
                </label>

                <select
                  id="yearFilter"
                  value={this.state.selectedYear}
                  onChange={(
                    event: React.ChangeEvent<HTMLSelectElement>
                  ) => {

                    this.setState({
                      selectedYear:
                        event.target.value
                    });

                  }}
                >

                  <option value="All years">
                    All years
                  </option>


                  {years.map(
                    (year: string) => (

                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* MONTH */}

              <div className={styles.filterGroup}>

                <label htmlFor="monthFilter">
                  MONTH
                </label>

                <select
                  id="monthFilter"
                  value={this.state.selectedMonth}
                  onChange={(
                    event: React.ChangeEvent<HTMLSelectElement>
                  ) => {

                    this.setState({
                      selectedMonth:
                        event.target.value
                    });

                  }}
                >

                  <option value="All months">
                    All months
                  </option>


                  {months.map(
                    (month: string) => (

                      <option
                        key={month}
                        value={month}
                      >
                        {month}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* SEARCH */}

              <div className={styles.filterGroupSearch}>

                <label htmlFor="sessionSearch">
                  SEARCH
                </label>


                <div className={styles.searchBox}>

                  <input
                    id="sessionSearch"
                    type="text"
                    placeholder="Search sessions"
                    value={this.state.searchText}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {

                      this.setState({
                        searchText:
                          event.target.value
                      });

                    }}
                  />


                  <span className={styles.searchIcon}>
                    ⌕
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              VIDEO CONTENT
          ================================================= */}

          {filteredVideos.length === 0 ? (

            <div className={styles.noResults}>

              <h3>
                No sessions found
              </h3>

              <p>
                Try changing the year, month,
                or search criteria.
              </p>

            </div>

          ) : (

            <div className={styles.sessionsContainer}>


              {/* =================================================
                  YEAR LOOP
              ================================================= */}

              {yearKeys.map(
                (year: string) => {

                  /*
                   * Get all videos for this year.
                   */

                  const videosForYear: IVideoContent[] =
                    groupedByYear[year];


                  /*
                   * Group those videos by month.
                   */

                  const groupedByMonth =
                    this.groupVideosByMonth(
                      videosForYear
                    );


                  /*
                   * Get months for this year.
                   */

                  const monthKeys: string[] =
                    Object.keys(groupedByMonth);


                  /*
                   * Sort months.
                   */

                  monthKeys.sort(
                    (a: string, b: string) =>
                      this.getMonthNumber(a) -
                      this.getMonthNumber(b)
                  );


                  return (

                    <div
                      className={styles.yearSection}
                      key={year}
                    >


                      {/* =====================================
                          YEAR
                      ====================================== */}

                      <div className={styles.yearHeading}>

                        <h2>
                          {year}
                        </h2>

                        <div
                          className={styles.yearLine}
                        />

                      </div>


                      {/* =====================================
                          MONTH LOOP
                      ====================================== */}

                      {monthKeys.map(
                        (month: string) => {

                          /*
                           * THIS IS THE ARRAY OF VIDEOS
                           * FOR THIS MONTH.
                           *
                           * Example:
                           *
                           * October:
                           *
                           * [
                           *   Video 1,
                           *   Video 2,
                           *   Video 3,
                           *   Video 4
                           * ]
                           */

                          const monthVideos: IVideoContent[] =
                            groupedByMonth[month];


                          return (

                            <div
                              className={
                                styles.monthSection
                              }
                              key={`${year}-${month}`}
                            >


                              {/* MONTH HEADING */}

                              <div
                                className={
                                  styles.monthHeading
                                }
                              >

                                <h3>
                                  {month}
                                </h3>


                                <span>

                                  {monthVideos.length}

                                  {' '}

                                  {monthVideos.length === 1
                                    ? 'SESSION'
                                    : 'SESSIONS'}

                                </span>

                              </div>


                              {/* =================================
                                  VIDEO ARRAY
                              ================================== */}

                              <div
                                className={
                                  styles.monthContent
                                }
                              >

                                <div
                                  className={
                                    styles.monthVerticalLine
                                  }
                                />


                                <div
                                  className={
                                    styles.sessionGrid
                                  }
                                >

                                  {/*
                                    IMPORTANT:

                                    This loops through every
                                    video in the month.

                                    4 videos = 4 cards

                                    10 videos = 10 cards

                                    100 videos = 100 cards
                                  */}

                                  {monthVideos.map(
                                    (
                                      video: IVideoContent
                                    ) =>

                                      this.renderVideoCard(
                                        video
                                      )
                                  )}

                                </div>

                              </div>

                            </div>

                          );
                        }
                      )}

                    </div>

                  );
                }
              )}

            </div>

          )}

        </div>

      </section>
    );
  }
}