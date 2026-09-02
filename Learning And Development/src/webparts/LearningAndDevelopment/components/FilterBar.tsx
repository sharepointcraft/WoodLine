import * as React from 'react';
import { IFilterState, ViewMode } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface IFilterBarProps {
  filterState: IFilterState;
  onFilterChange: (newFilters: Partial<IFilterState>) => void;
  viewMode: ViewMode;
  availableYears?: string[];
  availableMonths?: string[];
  onResetFilters?: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const FilterBar: React.FC<IFilterBarProps> = ({
  filterState,
  onFilterChange
}) => {
  return (
    <div className={styles.Filter}>
      <div className={styles.FilterContainer}>
        <div className={styles.FilterLabel}>Browse A–Z</div>
        <div className={styles.alphabetTrack}>
          <button
            type="button"
            className={`${styles.letterButton} ${filterState.folderAlpha === 'All' ? styles.active : ''}`}
            onClick={() => onFilterChange({ folderAlpha: 'All' })}
          >
            All
          </button>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`${styles.letterButton} ${filterState.folderAlpha === letter ? styles.active : ''}`}
              onClick={() => onFilterChange({ folderAlpha: letter })}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
