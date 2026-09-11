import * as React from 'react';
import styles from './LearningAndDevelopment.module.scss';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export interface IAlphabetFilterBarProps {
  selectedLetter: string;
  activeLetters: Set<string>;
  onSelectLetter: (letter: string) => void;
}

export const AlphabetFilterBar: React.FC<IAlphabetFilterBarProps> = ({
  selectedLetter,
  activeLetters,
  onSelectLetter
}) => {
  return (
    <nav className={styles.Filter} aria-label="Alphabetical Filter">
      <div className={styles.FilterContainer}>
        <span className={styles.FilterLabel}>Browse by A-Z</span>
        <div className={styles.alphabetTrack}>
          <button
            type="button"
            className={`${styles.letterButton} ${selectedLetter === 'All' ? styles.active : ''}`}
            onClick={() => onSelectLetter('All')}
          >
            All
          </button>
          {ALPHABET.map((letter) => {
            const isActive = selectedLetter === letter;
            const hasItems = activeLetters.has(letter);
            return (
              <button
                key={letter}
                type="button"
                disabled={!hasItems}
                className={`${styles.letterButton} ${isActive ? styles.active : ''} ${!hasItems ? styles.disabled : ''}`}
                onClick={() => onSelectLetter(letter)}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
