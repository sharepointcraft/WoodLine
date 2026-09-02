import * as React from 'react';
import { IVideoSession } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface ISessionCardProps {
  session: IVideoSession;
  onWatchVideo: (session: IVideoSession) => void;
}

export const SessionCard: React.FC<ISessionCardProps> = ({ session, onWatchVideo }) => {
  const [imgError, setImgError] = React.useState<boolean>(false);

  const handlePlayClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onWatchVideo(session);
  };

  return (
    <div className={styles.sessionCard}>
      {/* THUMBNAIL / PREVIEW SECTION */}
      <div className={styles.thumbnailContainer} onClick={handlePlayClick}>
        {!imgError && session.thumbnailUrl ? (
          <img
            src={session.thumbnailUrl}
            alt={session.title}
            className={styles.thumbnailImage}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.fallbackThumbnail}>
            <div className={styles.thumbnailPattern} />
            <Icon iconName="VideoSolid" className={styles.largeVideoIcon} />
            <span className={styles.extBadge}>{session.fileExtension}</span>
          </div>
        )}

        <div className={styles.playOverlay}>
          <div className={styles.playButtonCircle}>
            <Icon iconName="Play" />
          </div>
        </div>

        {session.duration && (
          <div className={styles.durationPill}>
            <Icon iconName="Clock" />
            <span>{session.duration}</span>
          </div>
        )}
      </div>

      {/* SESSION BODY */}
      <div className={styles.sessionBody}>
        <div className={styles.sessionMetaHeader}>
          <span className={styles.yearBadge}>{session.year}</span>
          <span className={styles.fileSizePill}>{session.fileSize}</span>
        </div>

        <h3 className={styles.sessionTitle} onClick={handlePlayClick} title={session.title}>
          {session.title}
        </h3>

        <p className={styles.sessionDescription}>
          {session.description.length > 95
            ? `${session.description.substring(0, 95)}...`
            : session.description}
        </p>

        <div className={styles.sessionFooter}>
          <div className={styles.sessionDate}>
            <Icon iconName="Calendar" />
            <span>{session.createdDate}</span>
          </div>

          <div className={styles.sessionActions}>
            <button
              type="button"
              className={styles.watchBtn}
              onClick={handlePlayClick}
              title="Play Session Video"
            >
              <Icon iconName="Play" />
              <span>Watch</span>
            </button>
            <a
              href={session.serverRelativeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openExternalBtn}
              title="Open video file in SharePoint"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon iconName="OpenInNewWindow" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
