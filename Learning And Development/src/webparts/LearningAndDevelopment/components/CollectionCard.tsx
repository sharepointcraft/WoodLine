import * as React from 'react';
import { ILearningCollection } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface ICollectionCardProps {
  collection: ILearningCollection;
  onSelectCollection: (collection: ILearningCollection) => void;
}

export const CollectionCard: React.FC<ICollectionCardProps> = ({
  collection,
  onSelectCollection
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    onSelectCollection(collection);
  };

  return (
    <div
      className={styles.collectionCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectCollection(collection);
        }
      }}
    >
      <div className={styles.cardInner} onClick={handleClick}>
        {/* CARD FRONT */}
        <div className={styles.cardFront} onClick={handleClick}>
          <div className={styles.iconBox}>
            <Icon iconName="FolderOpen" />
          </div>

          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>
              {collection.title}
            </h3>
            <p className={styles.sessionCount}>
              {collection.itemCount} {collection.itemCount === 1 ? 'session' : 'sessions'}
            </p>
          </div>

          <div className={styles.flipText}>
            Flip to explore
          </div>
        </div>

        {/* CARD BACK */}
        <div className={styles.cardBack} onClick={handleClick}>
          <div className={styles.backLabel}>
            Learning Collection
          </div>

          <h3 className={styles.backTitle}>
            {collection.title}
          </h3>

          <p className={styles.backDescription}>
            {collection.description}
          </p>

          <div className={styles.backSessions}>
            {collection.itemCount} sessions to watch
          </div>

          <div className={styles.backAction} onClick={handleClick}>
            Select to view video sessions &rarr;
          </div>
        </div>
      </div>
    </div>
  );
};
