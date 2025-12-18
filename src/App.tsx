import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEmbedding, EmbeddingProgress } from './hooks/useEmbedding';
import { findTopMatches } from './utils/similarity';
import { normalizeText } from './utils/textPreprocessing';
import { Line } from './types';
import './App.css';

function App() {
  const { isLoading, isReady, error, embedText, embedBatch } = useEmbedding();
  const [text, setText] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ index: number; score: number }>>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState<EmbeddingProgress | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const isProgrammaticNavigationRef = useRef(false);

  // Clear highlights when search query is emptied
  useEffect(() => {
    if (searchQuery.trim() === '' && searchResults.length > 0) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      if (decorationsRef.current.length > 0 && editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
    }
  }, [searchQuery, searchResults.length]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Override the default find action with our semantic search
    editor.addAction({
      id: 'semantic-search',
      label: 'Semantic Search',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
      run: () => {
        if (lines.length > 0) {
          setShowSearch(true);
          setTimeout(() => {
            document.getElementById('semantic-search-input')?.focus();
          }, 100);
        } else {
          alert('Please generate embeddings first by clicking the "Generate Embeddings" button');
        }
      },
    });

    // Clear search highlights when user manually clicks or moves cursor in editor
    editor.onDidChangeCursorPosition(() => {
      if (!isProgrammaticNavigationRef.current && searchResults.length > 0) {
        setSearchResults([]);
        setCurrentResultIndex(0);
        if (decorationsRef.current.length > 0) {
          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        }
      }
      // Reset the flag after checking
      isProgrammaticNavigationRef.current = false;
    });
  };

  const handleOpenSearch = () => {
    if (lines.length > 0) {
      setShowSearch(true);
      setTimeout(() => {
        document.getElementById('semantic-search-input')?.focus();
      }, 100);
    }
  };

  const handleEmbed = async () => {
    if (!text.trim() || isEmbedding || !isReady) return;

    setIsEmbedding(true);
    setLines([]);
    setEmbeddingProgress(null);

    try {
      const textLines = text.split('\n');

      // Normalize text for better semantic understanding
      const normalizedLines = textLines.map(line => normalizeText(line));

      // Embed the normalized text with progress callback
      const embeddings = await embedBatch(normalizedLines, (progress) => {
        setEmbeddingProgress(progress);
      });

      const newLines: Line[] = textLines.map((lineText, index) => ({
        lineNumber: index,
        text: lineText,
        normalizedText: normalizedLines[index],
        embedding: embeddings[index] || [],
      }));

      setLines(newLines);
      setEmbeddingProgress(null);
    } catch (err) {
      alert(`Failed to embed text: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setEmbeddingProgress(null);
    } finally {
      setIsEmbedding(false);
    }
  };

  const updateHighlights = (results: Array<{ index: number; score: number }>, currentIndex: number) => {
    if (!editorRef.current || !monacoRef.current || results.length === 0) return;

    const decorations = results.map((result, idx) => {
      const lineNumber = result.index + 1; // Monaco uses 1-based line numbers
      const isCurrent = idx === currentIndex;

      return {
        range: new monacoRef.current.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: isCurrent ? 'highlighted-line-current' : 'highlighted-line-other',
          glyphMarginClassName: isCurrent ? 'highlighted-glyph-current' : 'highlighted-glyph-other',
        },
      };
    });

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );

    // Mark this as programmatic navigation to prevent clearing highlights
    isProgrammaticNavigationRef.current = true;

    // Scroll to the current result
    const currentLineNumber = results[currentIndex].index + 1;
    editorRef.current.revealLineInCenter(currentLineNumber);
    editorRef.current.setPosition({ lineNumber: currentLineNumber, column: 1 });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || lines.length === 0 || isSearching) return;

    setIsSearching(true);

    try {
      // Normalize search query for consistent comparison
      const normalizedQuery = normalizeText(searchQuery);
      const queryEmbedding = await embedText(normalizedQuery);
      const lineEmbeddings = lines.map(line => line.embedding);
      const results = findTopMatches(queryEmbedding, lineEmbeddings, 5);

      setSearchResults(results);
      setCurrentResultIndex(0);

      // Highlight all results
      updateHighlights(results, 0);
    } catch (err) {
      alert(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    updateHighlights(searchResults, nextIndex);
  };

  const handlePreviousResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIndex);
    updateHighlights(searchResults, prevIndex);
  };

  const handleClear = () => {
    setText('');
    setLines([]);
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults([]);
    setCurrentResultIndex(0);
    if (decorationsRef.current.length > 0 && editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(0);
    if (decorationsRef.current.length > 0 && editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter: Previous result
        if (searchResults.length > 0) {
          handlePreviousResult();
        }
      } else {
        // Enter: Search or next result
        if (searchResults.length > 0 && !isSearching) {
          handleNextResult();
        } else {
          handleSearch();
        }
      }
    }
    if (e.key === 'Escape') {
      handleCloseSearch();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Semantic Search Editor</h1>
          <span className="header-status">
            {isLoading ? 'Loading model...' : isReady ? 'Ready' : 'Error'}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleEmbed}
            disabled={!text.trim() || isEmbedding || !isReady}
          >
            {isEmbedding ? 'Generating...' : '⚡ Generate Embeddings'}
          </button>
          {lines.length > 0 && (
            <button
              className="btn btn-search"
              onClick={handleOpenSearch}
              disabled={isSearching}
              title="Semantic Search (Cmd+F / Ctrl+F)"
            >
              🔍 Search
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={isEmbedding || !text}
          >
            🗑️ Clear
          </button>
        </div>
      </header>

      {error && (
        <div className="app-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {embeddingProgress && isEmbedding && (
        <div className="embedding-progress">
          <div className="progress-info">
            <span>Embedding lines: {embeddingProgress.current} / {embeddingProgress.total}</span>
            <span>{embeddingProgress.percentage}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${embeddingProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="app-loading">
          <div className="spinner"></div>
          <p>Loading TensorFlow.js model... This may take a moment on first load.</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="editor-container">
          {showSearch && lines.length > 0 && (
            <div className="search-overlay">
              <input
                id="semantic-search-input"
                type="text"
                className="search-input"
                placeholder="Semantic search... (Enter to search, Esc to close)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isSearching}
              />
              {searchResults.length > 0 && (
                <div className="search-navigation">
                  <span className="search-result-count">
                    {currentResultIndex + 1} of {searchResults.length}
                  </span>
                  <button
                    className="search-nav-btn"
                    onClick={handlePreviousResult}
                    disabled={isSearching}
                    title="Previous result (Shift+Enter)"
                  >
                    ▲
                  </button>
                  <button
                    className="search-nav-btn"
                    onClick={handleNextResult}
                    disabled={isSearching}
                    title="Next result (Enter)"
                  >
                    ▼
                  </button>
                </div>
              )}
              <button
                className="search-close"
                onClick={handleCloseSearch}
              >
                ✕
              </button>
            </div>
          )}

          <Editor
            height="calc(100vh - 60px)"
            defaultLanguage="plaintext"
            theme="vs-dark"
            value={text}
            onChange={(value) => setText(value || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 14,
              lineNumbers: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              readOnly: isEmbedding,
              padding: { top: 16, bottom: 16 },
              glyphMargin: true,
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'never',
                seedSearchStringFromSelection: 'never',
              },
            }}
          />
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-left">
          {lines.length > 0 && (
            <span>
              ✓ {lines.length} lines embedded • Press <kbd>Cmd+F</kbd> / <kbd>Ctrl+F</kbd> for semantic search
            </span>
          )}
        </div>
        <div className="footer-right">
          Powered by TensorFlow.js • Privacy-first
        </div>
      </footer>
    </div>
  );
}

export default App;
