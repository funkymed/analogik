/**
 * Reads a JSON file from a File object (e.g., from a file input).
 * Returns the parsed JSON content typed as T.
 *
 * Throws a descriptive error if the file content is not valid JSON.
 */
export async function readJsonFile<T = unknown>(file: File): Promise<T> {
  const text = await file.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Failed to parse "${file.name}" as JSON. Ensure the file contains valid JSON.`,
    );
  }
}
