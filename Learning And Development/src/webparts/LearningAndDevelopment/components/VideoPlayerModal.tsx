import * as React from 'react';
import { useEffect, useState } from 'react';
import { IVideoSession } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IVideoPlayerModalProps {
  session: IVideoSession | undefined;
  isOpen: boolean;
  onDismiss: () => void;
}

const formatSecondsToDuration = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) return '';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const VideoPlayerModal: React.FC<IVideoPlayerModalProps> = ({ session, isOpen, onDismiss }) => {
  const [actualDuration, setActualDuration] = useState<string>('');

  useEffect(() => {
    setActualDuration('');
  }, [session?.id]);

  if (!isOpen || !session) return null;

  return (
    <div className={styles.modalOverlay} onClick={onDismiss}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleArea}>
              <span className={styles.modalCategoryBadge}>{session.folderName}</span>
              {/*
              <h2>{session.title}</h2>
              */}
              {session.sessionTitle ? <h2>{session.sessionTitle}</h2> : null}
            </div>
          <button className={styles.modalCloseBtn} onClick={onDismiss} aria-label="Close modal">
            <Icon iconName="Cancel" />
          </button>
        </div>

        {/* MODAL VIDEO PLAYER / PREVIEW */}
        <div className={styles.videoPlayerContainer}>
          <video
            className={styles.videoElement}
            controls
            autoPlay
            src={session.serverRelativeUrl}
            poster={session.thumbnailUrl}
            onLoadedMetadata={(event) => {
              setActualDuration(formatSecondsToDuration(event.currentTarget.duration));
            }}
          >
            Your browser does not support HTML5 video playback.
          </video>
        </div>

          {/* MODAL DETAILS BODY */}
          <div className={styles.modalBody}>
            <div className={styles.modalMetaRow}>
              {session.speakerName ? (
                <div className={styles.metaChip}>
                  <Icon iconName="Contact" />
                  <span>{session.speakerName}</span>
                </div>
              ) : null}
              
              {/* <div className={styles.metaChip}>
                <Icon iconName="Calendar" />
              <span>{session.createdDate}</span>
            </div> */}

            {actualDuration ? (
              <div className={styles.metaChip}>
                <Icon iconName="Clock" />
                <span>{actualDuration}</span>
              </div>
            ) : null}
            {/*
            <div className={styles.metaChip}>
              <Icon iconName="Database" />
              <span>{session.fileSize}</span>
            </div>
            <div className={styles.metaChip}>
              <Icon iconName="Page" />
              <span>{session.fileExtension}</span>
            </div>
            */}
          </div>

          {/*
          <div className={styles.modalDescriptionBox}>
            <h3>Session Description</h3>
            <p>{session.description}</p>
          </div>
          */}

          {/*
          <div className={styles.modalPathBox}>
            <Icon iconName="FolderList" />
            <span>{session.serverRelativeUrl}</span>
          </div>
          */}
        </div>

        {/* MODAL FOOTER */}
        {/*
        <div className={styles.modalFooter}>
          <a
            href={session.serverRelativeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primaryBtn}
          >
            <Icon iconName="OpenInNewWindow" />
            <span>Open in SharePoint Viewer</span>
          </a>
          <button className={styles.secondaryBtn} onClick={onDismiss}>
            Close
          </button>
        </div>
        */}
      </div>
    </div>
  );
};
