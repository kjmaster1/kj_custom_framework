import {GetItem} from "./configRegistry";
import {GetPlayerInventory} from "./inventoryManager";

/**
 * Triggers a server event to attempt to use an item from a specific slot.
 * @param slot The slot number (1-based) in the player's inventory.
 */
export function UseItem(slot: number) {
  const inv = GetPlayerInventory();
  if (!inv) return;

  const itemSlot = inv.items.get(slot);
  if (!itemSlot) {
    console.warn(`[ItemUsage] No item in slot: ${slot}`);
    return;
  }

  const itemConfig = GetItem(itemSlot.name);
  if (!itemConfig) return;

  // Quick client-side check
  if (!itemConfig.useable) {
    console.warn(`[ItemUsage] Item '${itemSlot.name}' is not useable.`);
    return;
  }

  console.log(`[ItemUsage] Requesting to use item in slot: ${slot}`);
  emitNet('core:server:useItem', slot);
}
