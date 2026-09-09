import * as React from 'react';
import { IVideoSession } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface ISessionCardProps {
  video: IVideoSession;
  collectionTitle?: string;
  onWatchVideo: (video: IVideoSession) => void;
}

export const SessionCard: React.FC<ISessionCardProps> = ({
  video,
  collectionTitle,
  onWatchVideo
}) => {
  return (
    <article className={styles.sessionCard}>
      {/* VIDEO THUMBNAIL / PLAY AREA */}
      <div
        className={styles.videoArea}
        onClick={() => onWatchVideo(video)}
      >
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
        <span className={styles.duration}>
          {video.duration || 'Video'}
        </span>
      </div>

      {/* CARD CONTENT */}
      <div className={styles.cardContent}>
        <h3
          className={styles.sessionTitle}
          onClick={() => onWatchVideo(video)}
        >
          {video.title}
        </h3>

        <div className={styles.sessionDate}>
          {collectionTitle || 'Session Training'} - {video.createdDate}
        </div>

        <div className={styles.sessionStats}>
          <span>{video.fileSize}</span>
          <span className={styles.separator}>&bull;</span>
          <span>{video.fileExtension}</span>
        </div>

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
