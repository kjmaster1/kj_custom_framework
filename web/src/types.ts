/**
 * Represents the static definition of an item (from config).
 */
export interface ItemDefinition {
  // Unique ID, e.g., 'water_bottle'
  name: string;
  // Display Name, e.g., 'Water Bottle'
  label: string;
  // Weight in grams
  weight: number;
  // Item type
  type: 'item' | 'weapon' | 'account';
  // Image file name (e.g., 'water_bottle.png')
  image: string;
  // Is it stackable?
  unique: boolean;
  // Can it be used?
  useable: boolean;
  // Is 1 of the item consumed on use?
  consumable: boolean;
  // We can add metadata, weapon data, etc. here later
  description: string;
}

/**
 * Represents a single item stack.
 * This is the data that will be saved in the database
 * and sent to the NUI.
 */
export interface ItemSlot {
  name: string; // The item ID (e.g., "water_bottle")
  quantity: number;
  metadata?: Record<string, any>; // For serial numbers, durability, etc.
}

/**
 * This is the shape of the inventory data
 * as it will be received by the NUI (React) app.
 */
export interface NuiInventory {
  id: string;
  label: string;
  slots: number;
  maxWeight: number;
  currentWeight: number;
  items: Record<number, ItemSlot>; // <slot, item>
}
