import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
// import { Icon } from '@fluentui/react/lib/Icon';
import { IVideoSession } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface ISessionCardProps {
  video: IVideoSession;
  collectionTitle?: string;
  onWatchVideo: (video: IVideoSession) => void;
}

/**
 * Formats duration in seconds into mm:ss or h:mm:ss format
 */
const formatSecondsToDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * SessionCard Component
 * Displays an individual video session card with navy thumbnail, white play circle,
 * duration badge, serif title, collection date subtitle, views/comments stats, and open recording button.
 */
export const SessionCard: React.FC<ISessionCardProps> = ({
  video,
  onWatchVideo
}) => {
  // State for the actual dynamic video duration
  const [actualDuration, setActualDuration] = useState<string>(video.duration || '');
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;

    // If video already has a valid formatted duration with ":" like "45:09", use it
    if (video.duration && video.duration.indexOf(':') !== -1) {
      setActualDuration(video.duration);
      return () => { isMountedRef.current = false; };
    }

    // Dynamically load the actual video duration from the video file's metadata
    if (!video.serverRelativeUrl) {
      return () => { isMountedRef.current = false; };
    }

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    function handleLoadedMetadata(): void {
      if (!isMountedRef.current) return;
      const dur = videoElement.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setActualDuration(formatSecondsToDuration(dur));
      }
      cleanup();
    }

    function handleError(): void {
      cleanup();
    }

    function cleanup(): void {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeAttribute('src');
      videoElement.load();
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);
    videoElement.src = video.serverRelativeUrl;

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [video.serverRelativeUrl, video.duration]);

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
        {video.cardThumbnailUrl ? (
          <img className={styles.videoThumbnail} src={video.cardThumbnailUrl} alt="" />
        ) : null}

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

        {/* Video Duration Badge in Top Right - shows actual dynamic video duration */}
        {actualDuration ? (
          <span className={styles.duration}>
            {actualDuration}
          </span>
        ) : null}
      </div>

      {/* 2. CARD CONTENT DETAILS */}
      <div className={styles.cardContent}>
          {/* Session Title (dynamic SharePoint SessionTitle field) */}
          {video.sessionTitle ? (
            <h3
              className={styles.sessionTitle}
              onClick={() => onWatchVideo(video)}
              title={video.sessionTitle}
            >
              {video.sessionTitle}
            </h3>
          ) : null}

          {/* Speaker Name (dynamic SharePoint SpeakerName field) */}
          {video.speakerName ? (
            <div className={styles.sessionDate}>{video.speakerName}</div>
          ) : null}

          {/*
          <div className={styles.sessionDate}>
            {collectionTitle || 'Associate Training Day'} &middot; {video.createdDate}
          </div>

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

          <button
            type="button"
            className={styles.recordingButton}
            onClick={() => onWatchVideo(video)}
          >
            Open recording
            <span className={styles.buttonArrow}>&rarr;</span>
          </button>
          */}
      </div>
    </article>
  );
};

