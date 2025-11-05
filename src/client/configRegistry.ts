// Client-side private registry. This will be populated by the server.
import {Item, Job} from "../common";

let cachedItemDefinitions: Record<string, Item> | null = null;

const Registry = {
  Items: new Map<string, Item>(),
  Jobs: new Map<string, Job>(),
  Locales: new Map<string, any>(),
};

/**
 * Private helper to populate a Map from a Record (plain object)
 * received from the server.
 */
function populateMapFromRecord<T>(map: Map<string, T>, record: Record<string, T>) {
  // Clear old data first (in case of resource restart)
  map.clear();
  // Loop over the object entries and set them in the Map
  for (const [key, value] of Object.entries(record)) {
    map.set(key, value);
  }
}

/**
 * Initializes the client-side config registry.
 * This sets up the event listener to receive data from the server.
 * This function will be called once from client/main.ts.
 */
export function InitConfigRegistry() {
  onNet('core:client:syncConfig', (data: {
    items: Record<string, Item>,
    jobs: Record<string, Job>,
    locales: Record<string, any>,
  }) => {
    console.log('[Config] Received config data from server.');

    cachedItemDefinitions = data.items;

    // Populate our local client Maps
    populateMapFromRecord(Registry.Items, data.items);
    populateMapFromRecord(Registry.Jobs, data.jobs);
    populateMapFromRecord(Registry.Locales, data.locales);

    console.log(`[Config] Client Registry Loaded:`);
    console.log(`[Config] -> ${Registry.Items.size} Items`);
    console.log(`[Config] -> ${Registry.Jobs.size} Jobs`);
    console.log(`[Config] -> ${Registry.Locales.size} Locales`);
  });
}

// --- Public Client-Side Accessor Functions ---

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

/**
 * Gets the raw locale object for a specific language.
 * @param lang Language code (e.g., 'en')
 */
export function GetLocale(lang: string): any | undefined {
  return Registry.Locales.get(lang);
}

/**
 * Gets the entire map of loaded locales.
 */
export function GetLocales(): Map<string, any> {
  return Registry.Locales;
}

export function GetItemDefinitions() {
  return cachedItemDefinitions;
}
