import { useRef, useEffect } from 'react';
import { Line } from '../types';
import './LineViewer.css';

interface LineViewerProps {
  lines: Line[];
  highlightedLine: number | null;
}

export function LineViewer({ lines, highlightedLine }: LineViewerProps) {
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to highlighted line when it changes
  useEffect(() => {
    if (highlightedLine !== null && lineRefs.current[highlightedLine]) {
      lineRefs.current[highlightedLine]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedLine]);

  if (lines.length === 0) {
    return (
      <div className="line-viewer-container">
        <div className="line-viewer-empty">
          <p>No lines to display. Paste text and click "Embed Text" to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="line-viewer-container">
      <div className="line-viewer-header">
        <h2>Lines ({lines.length})</h2>
      </div>
      <div className="line-viewer-content">
        {lines.map((line) => (
          <div
            key={line.lineNumber}
            ref={(el) => (lineRefs.current[line.lineNumber] = el)}
            className={`line-item ${
              highlightedLine === line.lineNumber ? 'highlighted' : ''
            }`}
          >
            <div className="line-number">{line.lineNumber + 1}</div>
            <div className="line-text">{line.text || <em>(empty line)</em>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
