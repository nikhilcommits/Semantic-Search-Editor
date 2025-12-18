/**
 * Normalizes technical text for better semantic embedding understanding
 * Converts URLs, kebab-case, snake_case, and camelCase into space-separated words
 *
 * @param text Original text to normalize
 * @returns Normalized text suitable for embedding
 *
 * @example
 * normalizeText("automatically-stop-rds-databases")
 * // Returns: "automatically stop rds databases"
 *
 * @example
 * normalizeText("getUserProfile")
 * // Returns: "get User Profile"
 */
export function normalizeText(text: string): string {
  if (!text || text.trim() === '') {
    return text;
  }

  let normalized = text;

  // Replace underscores with spaces
  normalized = normalized.replace(/_/g, ' ');

  // Replace dashes with spaces (handles kebab-case and URLs)
  normalized = normalized.replace(/-/g, ' ');

  // Convert camelCase and PascalCase to space-separated words
  // Insert space before capital letters that follow lowercase letters
  normalized = normalized.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Replace forward slashes with spaces (for URLs)
  normalized = normalized.replace(/\//g, ' ');

  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');

  // Trim whitespace
  normalized = normalized.trim();

  return normalized;
}
