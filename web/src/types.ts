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
