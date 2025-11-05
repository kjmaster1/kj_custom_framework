import {getFilesInDirectory, LoadJsonFile} from './utils';
import * as path from 'path';
import {Item, Job} from "../common";

// Private registry state using Maps for performance.
const Registry = {
  Items: new Map<string, Item>(),
  Jobs: new Map<string, Job>(),
  Locales: new Map<string, any>(), // <'en', { ...json_data }>
};

/**
 * A generic function to load all JSON configs from a directory.
 * It assumes files contain an object where keys are the config IDs.
 *
 * e.g., items/general.json -> { "water": { ... }, "bread": { ... } }
 *
 * @param configPath The resource-relative path (e.g., 'config/items')
 * @param registryMap The Map to populate (e.g., Registry.Items)
 * @param configType A string name for logging (e.g., 'Item')
 */
function loadConfigDirectory<T>(
  configPath: string,
  registryMap: Map<string, T>,
  configType: string,
) {
  // 1. Find all .json files in the directory
  const files = getFilesInDirectory(configPath, /\.json$/i);
  console.log(`[Config] Found ${files.length} file(s) for ${configType} in ${configPath}`);

  for (const file of files) {
    const filePath = path.join(configPath, file).replace(/\\/g, '/'); // Use forward slashes for resource path

    try {
      // 2. Load and parse the file
      const fileData = LoadJsonFile<Record<string, T>>(filePath);

      if (typeof fileData !== 'object' || fileData === null) {
        console.error(`[Config] ${filePath} did not contain a valid object.`);
        continue;
      }

      // 3. Register each entry from the file into the Map
      let count = 0;
      for (const [key, value] of Object.entries(fileData)) {
        if (registryMap.has(key)) {
          console.warn(`[Config] Duplicate ${configType} key: "${key}" in ${file}. Overwriting!`);
        }
        registryMap.set(key, value);
        count++;
      }
      console.log(`[Config] Loaded ${count} ${configType}(s) from ${file}`);

    } catch (e) {
      console.error(`[Config] Failed to load ${filePath}:`, e.message);
    }
  }
}

/**
 * Loads all locale files from a directory.
 * Each file is stored in the map by its name (e.g., 'en', 'fr').
 */
function loadLocalesDirectory(configPath: string) {
  const files = getFilesInDirectory(configPath, /\.json$/i);
  console.log(`[Config] Found ${files.length} locale file(s) in ${configPath}`);

  for (const file of files) {
    const filePath = path.join(configPath, file).replace(/\\/g, '/');
    const langKey = path.basename(file, '.json').toLowerCase(); // 'en.json' -> 'en'

    try {
      const fileData = LoadJsonFile<object>(filePath);
      Registry.Locales.set(langKey, fileData);
      console.log(`[Config] Loaded locale '${langKey}' from ${file}`);
    } catch (e) {
      console.error(`[Config] Failed to load ${filePath}:`, e.message);
    }
  }
}



// --- Public API ---

/**
 * Initializes the entire config system.
 * Call this once on server startup.
 */
export function InitConfigLoader() {
  console.log('[Config] Initializing Config Registry...');

  // Load all config types
  loadConfigDirectory('config/items', Registry.Items, 'Item');
  loadConfigDirectory('config/jobs', Registry.Jobs, 'Job');

  // Load all locales
  loadLocalesDirectory('locales');

  console.log(`[Config] Registry Loaded:`);
  console.log(`[Config] -> ${Registry.Items.size} Items`);
  console.log(`[Config] -> ${Registry.Jobs.size} Jobs`);
  console.log(`[Config] -> ${Registry.Locales.size} Locales`);
}

/**
 * Returns all registered config data in an event-serializable format.
 * Maps are converted to Records (plain objects) for transport.
 */
export function GetConfigDataForClient() {
  return {
    items: Object.fromEntries(Registry.Items),
    jobs: Object.fromEntries(Registry.Jobs),
    locales: Object.fromEntries(Registry.Locales),
  };
}

// --- Accessor Functions ---

export function GetItem(itemName: string): Item | undefined {
  return Registry.Items.get(itemName);
}

export function GetAllItems(): Map<string, Item> {
  return Registry.Items;
}

export function GetJob(jobName: string): Job | undefined {
  return Registry.Jobs.get(jobName);
}

export function GetAllJobs(): Map<string, Job> {
  return Registry.Jobs;
}
