# Semantic Line Editor

A 100% browser-based semantic search application that lets you search through text using natural language queries. No backend, no APIs, complete privacy.

## Features

- **Paste & Search**: Paste any text and search through it semantically
- **AI-Powered**: Uses Transformers.js to run embeddings locally in your browser
- **Privacy-First**: All processing happens in your browser - nothing leaves your device
- **Offline Ready**: Works offline after the initial model download
- **Smart Highlighting**: Automatically scrolls to and highlights best matches
- **Similarity Scores**: See how well each result matches your query

## How It Works

1. **Paste Text**: Copy and paste your text into the input area
2. **Embed**: Click "Embed Text" to process the text into vector embeddings
3. **Search**: Enter a natural language query and click "Search"
4. **Results**: The app finds the most semantically similar line and highlights it

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A modern browser with WebGPU support (Chrome, Edge, or Safari)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. Open the app in your browser (usually http://localhost:5173)
2. Wait for the embedding model to load (first load may take 30-60 seconds)
3. Paste your text into the text area
4. Click "Embed Text" to process the lines
5. Enter a search query like "What is the main idea?" or "How do I install?"
6. Click "Search" to find the most relevant line

## Example Queries

- "What is this document about?"
- "How do I get started?"
- "Error messages and troubleshooting"
- "Performance optimization tips"
- "Installation instructions"

## Technical Details

### Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **ML Library**: @xenova/transformers (Transformers.js)
- **Model**: Xenova/all-MiniLM-L6-v2 (lightweight sentence embeddings)
- **Similarity**: Cosine similarity with normalized vectors

### Project Structure

```
src/
├── components/
│   ├── TextInput.tsx       # Text paste and embed interface
│   ├── LineViewer.tsx      # Display and highlight lines
│   └── SearchBar.tsx       # Search input and controls
├── hooks/
│   └── useEmbedding.ts     # Embedding model lifecycle
├── utils/
│   └── similarity.ts       # Cosine similarity calculations
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main application logic
└── main.tsx                # Entry point
```

### Browser Compatibility

The app requires a modern browser with support for:
- WebGPU or WebAssembly
- ES2020+ JavaScript features
- Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers

Tested on:
- Chrome 113+
- Edge 113+
- Safari 16.4+

## Performance

- Model size: ~25MB (downloaded once and cached)
- Average embedding time: 50-200ms per line
- Memory usage: ~100-200MB
- Supports 1000+ lines efficiently

## Privacy & Security

- **No server communication**: Everything runs in your browser
- **No data collection**: Your text never leaves your device
- **No API keys**: No external services required
- **Open source**: Inspect the code yourself

## Troubleshooting

### Model won't load
- Check your internet connection (needed for first download)
- Clear browser cache and reload
- Ensure your browser supports WebGPU/WASM

### Search not working
- Make sure you've clicked "Embed Text" first
- Try a different search query
- Check browser console for errors

### Slow performance
- Try shorter texts (under 500 lines)
- Close other browser tabs
- Use a device with more RAM

## Development

```bash
# Run development server with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License - feel free to use and modify

## Credits

- Built with [Transformers.js](https://huggingface.co/docs/transformers.js)
- Embedding model: [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- Powered by React and Vite
