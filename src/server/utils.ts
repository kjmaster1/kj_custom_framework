import * as fs from 'fs';
import * as path from 'path';

const ResourceName = GetCurrentResourceName();

/**
 * Loads a file from the current resource.
 * @returns File content as a string.
 * @param filePath
 */
export function LoadFile(filePath: string): string {
  const content = LoadResourceFile(ResourceName, filePath);
  if (content === null) {
    throw new Error(`[FS] Failed to load resource file: ${ResourceName}/${filePath}`);
  }
  return content;
}

/**
 * Loads and parses a JSON file from the resource.
 * This is a SERVER-SIDE synchronous function.
 * @param filePath
 */
export function LoadJsonFile<T = unknown>(filePath: string): T {
  try {
    const fileContent = LoadFile(filePath);
    return JSON.parse(fileContent) as T;
  } catch (e) {
    console.error(`[FS] Failed to load or parse JSON file: ${ResourceName}/${filePath}`);
    throw e;
  }
}

/**
 * Searches a directory within the resource system and returns files matching a pattern.
 * This function is designed for the FiveM SERVER environment.
 *
 * @param inputPath The path to search, relative to the resource root (e.g., 'config/items').
 * @param pattern A regular expression used to filter file names (e.g., /\.json$/i).
 * @returns An array of file names that matched the pattern.
 */
export function getFilesInDirectory(inputPath: string, pattern: RegExp): string[] {
  let targetResource: string = ResourceName;
  let localPath: string = inputPath;

  // Check for the '@resourceName/' prefix
  if (inputPath.startsWith('@')) {
    // Resource paths always use forward slashes
    const parts = inputPath.substring(1).split('/');
    if (parts.length < 2) {
      console.error(`[FS] Invalid resource-prefixed path: ${inputPath}`);
      return [];
    }

    targetResource = parts[0];
    // Rebuild local path using OS-specific separator for fs module
    localPath = parts.slice(1).join(path.sep);
  }

  const resourceRoot = GetResourcePath(targetResource);
  if (!resourceRoot) {
    console.error(`[FS] Could not get resource path for '${targetResource}'.`);
    return [];
  }
  const absolutePath = path.join(resourceRoot, localPath);

  try {
    // Use withFileTypes to differentiate files from directories
    const dirents = fs.readdirSync(absolutePath, { withFileTypes: true });

    return dirents
      .filter(dirent => dirent.isFile() && pattern.test(dirent.name))
      .map(dirent => dirent.name);
  } catch (e) {
    // Handle errors like directory not found
    console.error(`[FS] Error reading directory: ${absolutePath}.`, e.message);
    return [];
  }
}
