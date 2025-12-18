import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import './TextInput.css';

interface TextInputProps {
  onEmbed: (text: string) => void;
  isEmbedding: boolean;
  isModelReady: boolean;
  text: string;
  onTextChange: (text: string) => void;
}

export function TextInput({ onEmbed, isEmbedding, isModelReady, text, onTextChange }: TextInputProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEmbed = () => {
    if (text.trim() && !isEmbedding && isModelReady) {
      onEmbed(text);
    }
  };

  const handleClear = () => {
    onTextChange('');
  };

  const lineCount = text.split('\n').length;
  const charCount = text.length;

  return (
    <div className="text-input-container">
      <div className="text-input-header">
        <div className="text-input-title">
          <span className="icon">📝</span>
          <span>Editor</span>
        </div>
        <div className="text-input-stats">
          Ln {lineCount}, Ch {charCount}
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="400px"
          defaultLanguage="plaintext"
          theme="vs-dark"
          value={text}
          onChange={(value) => onTextChange(value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            readOnly: isEmbedding,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>

      <div className="text-input-actions">
        <button
          className="btn btn-primary"
          onClick={handleEmbed}
          disabled={!text.trim() || isEmbedding || !isModelReady}
        >
          <span className="btn-icon">⚡</span>
          {isEmbedding ? 'Embedding...' : 'Generate Embeddings'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={isEmbedding || !text}
        >
          <span className="btn-icon">🗑️</span>
          Clear
        </button>
      </div>
    </div>
  );
}
