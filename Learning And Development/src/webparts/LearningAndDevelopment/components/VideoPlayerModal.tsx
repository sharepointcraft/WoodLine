import * as React from 'react';
import { IVideoSession } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IVideoPlayerModalProps {
  session: IVideoSession | undefined;
  isOpen: boolean;
  onDismiss: () => void;
}

export const VideoPlayerModal: React.FC<IVideoPlayerModalProps> = ({ session, isOpen, onDismiss }) => {
  if (!isOpen || !session) return null;

  return (
    <div className={styles.modalOverlay} onClick={onDismiss}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleArea}>
            <span className={styles.modalCategoryBadge}>{session.folderName}</span>
            <h2>{session.title}</h2>
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
          >
            Your browser does not support HTML5 video playback.
          </video>
        </div>

        {/* MODAL DETAILS BODY */}
        <div className={styles.modalBody}>
          <div className={styles.modalMetaRow}>
            <div className={styles.metaChip}>
              <Icon iconName="Calendar" />
              <span>{session.createdDate}</span>
            </div>
            <div className={styles.metaChip}>
              <Icon iconName="Clock" />
              <span>{session.duration || 'Session Video'}</span>
            </div>
            <div className={styles.metaChip}>
              <Icon iconName="Database" />
              <span>{session.fileSize}</span>
            </div>
            <div className={styles.metaChip}>
              <Icon iconName="Page" />
              <span>{session.fileExtension}</span>
            </div>
          </div>

          <div className={styles.modalDescriptionBox}>
            <h3>Session Description</h3>
            <p>{session.description}</p>
          </div>

          <div className={styles.modalPathBox}>
            <Icon iconName="FolderList" />
            <span>{session.serverRelativeUrl}</span>
          </div>
        </div>

        {/* MODAL FOOTER */}
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
      </div>
    </div>
  );
};
