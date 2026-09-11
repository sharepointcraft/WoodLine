import * as React from 'react';
import { IFilterState } from '../models/ILearningModels';
import styles from './LearningAndDevelopment.module.scss';

export interface ISessionFiltersProps {
  filterState: IFilterState;
  availableYears: string[];
  availableMonths: string[];
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onSearchChange: (search: string) => void;
}

export const SessionFilters: React.FC<ISessionFiltersProps> = ({
  filterState,
  availableYears,
  availableMonths,
  onYearChange,
  onMonthChange,
  onSearchChange
}) => {
  return (
    <div className={styles.filterPanel}>
      <div className={styles.availableSessions}>
        <span className={styles.availableTitle}>
          Available Sessions
        </span>
        <span className={styles.newestText}>
          NEWEST TO OLDEST
        </span>
      </div>

      <div className={styles.filters}>
        {/* YEAR FILTER */}
        <div className={styles.filterGroup}>
          <label htmlFor="yearFilter">YEAR</label>
          <select
            id="yearFilter"
            value={filterState.sessionYear}
            onChange={(e) => onYearChange(e.target.value)}
          >
            <option value="All">All years</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* MONTH FILTER */}
        <div className={styles.filterGroup}>
          <label htmlFor="monthFilter">MONTH</label>
          <select
            id="monthFilter"
            value={filterState.sessionMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            <option value="All">All months</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* SEARCH FILTER */}
        <div className={styles.filterGroupSearch}>
          <label htmlFor="sessionSearch">SEARCH</label>
          <div className={styles.searchBox}>
            <input
              id="sessionSearch"
              type="text"
              placeholder="Search sessions"
              value={filterState.sessionSearch}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>
      </div>
    </div>
  );
};
