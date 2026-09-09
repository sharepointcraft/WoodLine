import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IVideoSession } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface ISessionCardProps {
  video: IVideoSession;
  collectionTitle?: string;
  onWatchVideo: (video: IVideoSession) => void;
}

/**
 * SessionCard Component
 * Displays an individual video session card with navy thumbnail, white play circle,
 * duration badge, serif title, collection date subtitle, views/comments stats, and open recording button.
 */
export const SessionCard: React.FC<ISessionCardProps> = ({
  video,
  collectionTitle,
  onWatchVideo
}) => {
  return (
    <article className={styles.sessionCard}>
      {/* 1. VIDEO THUMBNAIL / PLAY AREA */}
      <div
        className={styles.videoArea}
        onClick={() => onWatchVideo(video)}
        role="button"
        tabIndex={0}
        aria-label={`Watch ${video.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onWatchVideo(video);
          }
        }}
      >
        {/* Centered Circular White Play Button with Navy Triangle */}
        <button
          type="button"
          className={styles.playButton}
          aria-label={`Play ${video.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onWatchVideo(video);
          }}
        >
          <span className={styles.playIcon} />
        </button>

        {/* Video Duration Badge in Top Right */}
        <span className={styles.duration}>
          {video.duration || 'Video'}
        </span>
      </div>

      {/* 2. CARD CONTENT DETAILS */}
      <div className={styles.cardContent}>
        {/* Session Title (Serif Typography) */}
        <h3
          className={styles.sessionTitle}
          onClick={() => onWatchVideo(video)}
          title={video.title}
        >
          {video.title}
        </h3>

        {/* Collection Name & Created Date Subtitle */}
        <div className={styles.sessionDate}>
          {collectionTitle || 'Associate Training Day'} &middot; {video.createdDate}
        </div>

        {/* Views & Comments Stats Row Matching Reference Design */}
        <div className={styles.sessionStats}>
          <span className={styles.statItem}>
            <Icon iconName="View" className={styles.statIcon} />
            <span>-- Views</span>
          </span>
          <span className={styles.statItem}>
            <Icon iconName="Comment" className={styles.statIcon} />
            <span>-- Comments</span>
          </span>
        </div>

        {/* Open Recording Action Button */}
        <button
          type="button"
          className={styles.recordingButton}
          onClick={() => onWatchVideo(video)}
        >
          Open recording
          <span className={styles.buttonArrow}>&rarr;</span>
        </button>
      </div>
    </article>
  );
};

