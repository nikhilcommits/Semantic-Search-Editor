import { useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  isEnabled: boolean;
  lastResult: { lineNumber: number; similarity: number } | null;
}

export function SearchBar({ onSearch, isSearching, isEnabled, lastResult }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim() && !isSearching && isEnabled) {
      onSearch(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-header">
        <h2>Semantic Search</h2>
        {lastResult && (
          <div className="search-result-badge">
            Line {lastResult.lineNumber + 1} • {(lastResult.similarity * 100).toFixed(1)}% match
          </div>
        )}
      </div>

      <div className="search-bar-input-wrapper">
        <input
          type="text"
          className="search-bar-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your search query (e.g., 'What is the main topic?')"
          disabled={isSearching || !isEnabled}
        />
        <button
          className="btn btn-search"
          onClick={handleSearch}
          disabled={!query.trim() || isSearching || !isEnabled}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {!isEnabled && (
        <div className="search-bar-hint">
          Please embed text first before searching
        </div>
      )}
    </div>
  );
}
