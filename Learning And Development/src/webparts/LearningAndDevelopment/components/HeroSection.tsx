import * as React from 'react';
import { ILearningStats } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface IHeroSectionProps {
  title?: string;
  description?: string;
  stats: ILearningStats;
}

export const HeroSection: React.FC<IHeroSectionProps> = ({ title, description, stats }) => {
  const displayTitle = title || 'Learning & Development Center';
  const displayDescription = description || 'Build knowledge, sharpen skills, and access the training, insights, and resources that support your development at Woodline.';

  return (
    <header className={styles.learningHero}>
      <div className={styles.heroContent}>
        <div className={styles.navigationPath}>
          WOODLINE WEB / EDUCATE / LEARNING &amp; DEVELOPMENT
        </div>

        <h1 className={styles.title}>
          {displayTitle}
        </h1>

        <p className={styles.description}>
          {displayDescription}
        </p>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.totalCollections}</span>
            <span className={styles.statLabel}>
              {stats.totalCollections === 1 ? 'Collection' : 'Collections'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.totalSessions}</span>
            <span className={styles.statLabel}>
              {stats.totalSessions === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
