import * as React from 'react';
import { ILearningCollection, IQuickLinkItem } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IResourcesPanelProps {
  collections: ILearningCollection[];
  quickLinks?: IQuickLinkItem[];
  onSelectCollection: (collection: ILearningCollection) => void;
}

export const ResourcesPanel: React.FC<IResourcesPanelProps> = ({
  collections,
  quickLinks,
  onSelectCollection
}) => {
  const hasCustomQuickLinks = quickLinks && quickLinks.length > 0;

  return (
    <aside className={styles.resourcesPanel}>
      <h2 className={styles.resourcesTitle}>
        Resources &amp; Documents
      </h2>

      <p className={styles.resourcesDescription}>
        Open the learning resource areas from the Woodline Learning &amp; Development Center.
      </p>

      <div className={styles.resourceList}>
        {hasCustomQuickLinks
          ? quickLinks.map((link) => (
            <a
              key={link.id}
              href={link.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.resourceButton}
              style={{ textDecoration: 'none' }}
            >
              <span className={styles.resourceIcon} aria-hidden="true">
                <Icon iconName="OpenInNewWindow" />
              </span>
              <span className={styles.resourceText}>
                {link.title}
              </span>
            </a>
          ))
          : collections.map((col) => (
            <button
              key={col.id}
              type="button"
              className={styles.resourceButton}
              onClick={() => onSelectCollection(col)}
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
  );
};
