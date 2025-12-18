/**
 * Calculates cosine similarity between two vectors
 * @param a First vector
 * @param b Second vector
 * @returns Similarity score between -1 and 1 (higher is more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dot = 0;
  let aa = 0;
  let bb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }

  const denominator = Math.sqrt(aa) * Math.sqrt(bb);

  if (denominator === 0) {
    return 0;
  }

  return dot / denominator;
}

/**
 * Finds the line with highest similarity to the query
 * @param queryEmbedding Embedding vector of the search query
 * @param lineEmbeddings Array of line embeddings
 * @returns Index of best matching line and its similarity score
 */
export function findBestMatch(
  queryEmbedding: number[],
  lineEmbeddings: number[][]
): { index: number; score: number } {
  const results = findTopMatches(queryEmbedding, lineEmbeddings, 1);
  return results.length > 0 ? results[0] : { index: 0, score: -1 };
}

/**
 * Finds the top N lines with highest similarity to the query
 * @param queryEmbedding Embedding vector of the search query
 * @param lineEmbeddings Array of line embeddings
 * @param topN Number of top matches to return (default: 5)
 * @returns Array of matches sorted by similarity score (highest first)
 */
export function findTopMatches(
  queryEmbedding: number[],
  lineEmbeddings: number[][],
  topN: number = 5
): Array<{ index: number; score: number }> {
  const results: Array<{ index: number; score: number }> = [];

  for (let i = 0; i < lineEmbeddings.length; i++) {
    // Skip empty lines (those with no embedding)
    if (lineEmbeddings[i].length === 0) {
      continue;
    }

    const score = cosineSimilarity(queryEmbedding, lineEmbeddings[i]);
    results.push({ index: i, score });
  }

  // Sort by score descending and return top N
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
