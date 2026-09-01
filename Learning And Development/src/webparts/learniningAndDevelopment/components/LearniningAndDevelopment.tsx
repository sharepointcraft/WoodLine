import * as React from 'react';
import styles from './LearniningAndDevelopment.module.scss';
import type { ILearniningAndDevelopmentProps } from './ILearniningAndDevelopmentProps';
import { Icon } from '@fluentui/react';

export default class LearniningAndDevelopment extends React.Component<ILearniningAndDevelopmentProps> {
  public render(): React.ReactElement<ILearniningAndDevelopmentProps> {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    interface ILearningCollection {
      title: string;
      sessions: number;
      description: string;
      icon: string;
      resourceTitle?: string;
    }

    const learningCollections: ILearningCollection[] = [
      {
        title: 'Analysts',
        sessions: 4,
        description: 'Analyst learning covering sourcing, sizing, data leverage, QR Q&A and training-day resources.',
        icon: 'LineChart',
        resourceTitle: 'Analyst Training'
      },
      {
        title: 'Associates',
        sessions: 6,
        description: 'Associate learning covering advanced skills, collaboration and professional development.',
        icon: 'People',
        resourceTitle: 'Associate Training'
      },
      {
        title: 'Corporate Access',
        sessions: 0,
        description: 'Resources supporting corporate access, company engagement and related learning.',
        icon: 'Handshake',
        resourceTitle: 'Corporate Access'
      },
      {
        title: 'Earnings',
        sessions: 0,
        description: 'Learning resources and materials related to earnings analysis and company updates.',
        icon: 'Ringer',
        resourceTitle: 'Earnings Resources'
      },
      {
        title: 'Fusion',
        sessions: 0,
        description: 'Fusion learning resources and development materials.',
        icon: 'BranchFork',
        resourceTitle: 'Fusion Training'
      },
      {
        title: 'Idea Generation',
        sessions: 0,
        description: 'Resources focused on developing ideas, research thinking and investment insights.',
        icon: 'Lightbulb',
        resourceTitle: 'Idea Generation'
      },
      {
        title: 'Health, General Interest',
        sessions: 0,
        description: 'Resources covering health and general-interest learning topics.',
        icon: 'Heart',
        resourceTitle: 'Health, General Interest'
      },
      {
        title: 'Investment Forums',
        sessions: 0,
        description: 'Learning resources and materials from investment forums.',
        icon: 'Flag',
        resourceTitle: 'Investment Forums'
      },
      {
        title: 'Onboarding',
        sessions: 0,
        description: 'Resources to help new team members understand Woodline, its processes and key learning materials.',
        icon: 'ClipboardList',
        resourceTitle: 'Onboarding Resources'
      },
      {
        title: 'Quant Research',
        sessions: 3,
        description: 'Quantitative research resources covering data analysis, research methods and related investment tools.',
        icon: 'Sigma',
        resourceTitle: 'Quant Research'
      },
      {
        title: 'SDAs',
        sessions: 0,
        description: 'Learning resources and materials related to SDAs and supporting development activities.',
        icon: 'Settings',
        resourceTitle: 'SDAs'
      },
      {
        title: 'Tools & Tech Tips',
        sessions: 0,
        description: 'Helpful technology resources, tools, tips and guidance to improve your day-to-day work.',
        icon: 'Laptop',
        resourceTitle: 'Tools & Tech Tips'
      },
      {
        title: 'Training Days',
        sessions: 0,
        description: 'Training day resources, presentations, recordings and supporting learning materials.',
        icon: 'Calendar',
        resourceTitle: 'Training Days'
      }
    ];


    // Available alphabet letters
    // Automatically generated from collection titles

    const availableLetters = new Set(
      learningCollections.map(
        (collection) => collection.title.charAt(0).toUpperCase()
      )
    );

    interface IUpcomingEvent {
      title: string;
      date: string;
      time: string;
    }

    const upcomingEvents: IUpcomingEvent[] = [
      {
        title: 'Wellness Week, US',
        date: 'Mon, Aug 24',
        time: 'All day'
      },
      {
        title: '2026 US Open Enrollment',
        date: 'Tue, Aug 25',
        time: 'All day'
      }
    ];

    return (
      <section>
        <section className={styles.learningHero}>

          <div className={styles.heroContent}>

            {/* navigationPath / Breadcrumb */}
            <div className={styles.navigationPath}>
              WOODLINE WEB / EDUCATE / LEARNING &amp; DEVELOPMENT
            </div>

            {/* Main Heading */}
            <h1 className={styles.title}>
              Learning &amp; Development Center
            </h1>

            {/* Description */}
            <p className={styles.description}>
              Build knowledge, sharpen skills, and access the training,
              insights, and resources that support your development at
              Woodline.
            </p>

            {/* Statistics */}
            <div className={styles.stats}>

              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  13
                </div>

                <div className={styles.statLabel}>
                  Collections
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  32
                </div>

                <div className={styles.statLabel}>
                  Sessions
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* Filter */}
        <section className={styles.Filter}>

          <div className={styles.FilterContainer}>

            <div className={styles.FilterLabel}>
              Browse A–Z
            </div>

            <div className={styles.FilterLetters}>

              {/* All button */}
              <button
                type="button"
                className={`${styles.letterButton} ${styles.active}`}
              >
                All
              </button>

              {/* A-Z buttons */}
              {alphabet.map((letter) => {

                const isAvailable = availableLetters.has(letter);

                return (
                  <button
                    key={letter}
                    type="button"
                    className={`${styles.letterButton} ${!isAvailable ? styles.disabled : ''}`}
                    disabled={!isAvailable}
                  >
                    {letter}
                  </button>
                );

              })}

            </div>

          </div>

        </section>

        {/* =========================
    Learning Library
========================== */}
        <section className={styles.librarySection}>

          <div className={styles.libraryContainer}>

            {/* Left side */}
            <div className={styles.libraryContent}>

              <div className={styles.libraryHeader}>
                <h2 className={styles.libraryTitle}>
                  Learning Library
                </h2>

                <p className={styles.librarySubtitle}>
                  Collections are alphabetised. Select an active letter to filter.
                </p>
              </div>

              <div className={styles.collectionGrid}>

                {learningCollections.map((collection) => (

                  <div
                    key={collection.title}
                    className={styles.collectionCard}
                  >

                    <div className={styles.cardInner}>

                      <div className={styles.cardFront}>

                        <div className={styles.iconBox}>
                          <Icon iconName={collection.icon} />
                        </div>

                        <div className={styles.cardContent}>

                          <h3 className={styles.cardTitle}>
                            {collection.title}
                          </h3>

                          <p className={styles.sessionCount}>
                            {collection.sessions} sessions
                          </p>

                        </div>

                        <div className={styles.flipText}>
                          Flip to explore
                        </div>

                      </div>


                      {/* =========================
                  Back
              ========================== */}

                      <div className={styles.cardBack}>

                        <div className={styles.backLabel}>
                          LEARNING COLLECTION
                        </div>

                        <h3 className={styles.backTitle}>
                          {collection.title}
                        </h3>

                        <p className={styles.backDescription}>
                          {collection.description}
                        </p>

                        <div className={styles.backSessions}>
                          {collection.sessions} sessions to watch
                        </div>

                        <div className={styles.backAction}>
                          Select again to view videos →
                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            {/* =========================
        Right Side
    ========================== */}

            <div className={styles.rightColumn}>
              <aside className={styles.resourcesPanel}>

                <h2 className={styles.resourcesTitle}>
                  Resources &amp; Documents
                </h2>

                <p className={styles.resourcesDescription}>
                  Open the learning resource areas from the
                  Woodline Learning &amp; Development Center.
                </p>

                <div className={styles.resourceList}>

                  {learningCollections
                    .filter((collection) => collection.resourceTitle)
                    .map((collection) => (

                      <button
                        key={collection.resourceTitle}
                        type="button"
                        className={styles.resourceButton}
                      >

                        <span className={styles.resourceIcon}>
                          ↗
                        </span>

                        <span className={styles.resourceText}>
                          {collection.resourceTitle}
                        </span>

                      </button>

                    ))}

                </div>

                <div className={styles.resourcesFooter}>
                  <p>
                    Links are draggable into supported browser tabs,
                    messages and documents.
                  </p>
                </div>

              </aside>

              <div className={styles.eventsPanel}>

                <h2 className={styles.eventsTitle}>
                  Upcoming Events
                </h2>

                <div className={styles.eventsList}>

                  {upcomingEvents.map((event) => (

                    <div
                      key={`${event.title}-${event.date}`}
                      className={styles.eventItem}
                    >

                      <div className={styles.eventTitle}>
                        {event.title}
                      </div>

                      <div className={styles.eventDetails}>
                        {event.date}, {event.time}
                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </section>
      </section>

    );
  }
}