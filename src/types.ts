export interface Line {
  lineNumber: number;
  text: string;
  normalizedText: string;
  embedding: number[];
}

export interface SearchResult {
  lineNumber: number;
  similarity: number;
}
