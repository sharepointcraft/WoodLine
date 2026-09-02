import * as React from 'react';
import { ILearningStats, ILearningCollection } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface IHeaderStatsProps {
  stats: ILearningStats;
  selectedCollection: ILearningCollection | undefined;
  onBackToCollections: () => void;
  libraryTitle: string;
}

export const HeaderStats: React.FC<IHeaderStatsProps> = ({ stats }) => {
  return (
    <div className={styles.learningHero}>
      <div className={styles.heroContent}>
        <div className={styles.navigationPath}>
          WOODLINE WEB / EDUCATE / LEARNING &amp; DEVELOPMENT
        </div>
        <h1 className={styles.title}>Learning &amp; Development Center</h1>
        <p className={styles.description}>
          Build knowledge, sharpen skills, and access the training, insights, and resources that support your development at Woodline.
        </p>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.totalCollections}</div>
            <div className={styles.statLabel}>Collections</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.totalSessions}</div>
            <div className={styles.statLabel}>Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
};
