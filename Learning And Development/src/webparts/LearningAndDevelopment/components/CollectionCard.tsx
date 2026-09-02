import * as React from 'react';
import { ILearningCollection } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';

export interface ICollectionCardProps {
  collection: ILearningCollection;
  onSelectCollection: (collection: ILearningCollection) => void;
}

export const CollectionCard: React.FC<ICollectionCardProps> = ({ collection, onSelectCollection }) => {
  return (
    <div
      className={styles.collectionCard}
      onClick={() => onSelectCollection(collection)}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardFront}>
          <div className={styles.iconBox}>
            <Icon iconName="Education" />
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{collection.title}</h3>
            <p className={styles.sessionCount}>{collection.itemCount} sessions</p>
          </div>
          <div className={styles.flipText}>Flip to explore</div>
        </div>
        <div className={styles.cardBack}>
          <div className={styles.backLabel}>LEARNING COLLECTION</div>
          <h3 className={styles.backTitle}>{collection.title}</h3>
          <p className={styles.backDescription}>{collection.description}</p>
          <div className={styles.backSessions}>{collection.itemCount} sessions to watch</div>
          <div className={styles.backAction}>Select again to view videos &rarr;</div>
        </div>
      </div>
    </div>
  );
};
