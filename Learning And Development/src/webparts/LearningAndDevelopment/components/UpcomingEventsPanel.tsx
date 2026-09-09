import * as React from 'react';
import { IUpcomingEventItem } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IUpcomingEventsPanelProps {
  events: IUpcomingEventItem[];
}

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

export const UpcomingEventsPanel: React.FC<IUpcomingEventsPanelProps> = ({ events }) => {
  return (
    <div className={styles.eventsPanel}>
      <h2 className={styles.eventsTitle}>
        Upcoming Events
      </h2>

      <div className={styles.eventsList}>
        {events.length > 0 ? (
          events.map((evt) => {
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
  );
};
